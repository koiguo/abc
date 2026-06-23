import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { ModalController, ActionSheetController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ImagePreviewModalComponent } from '../../image-preview-modal/image-preview-modal.component';

@Component({
  selector: 'app-chat-modal',
  templateUrl: './chat-modal.component.html',
  styleUrls: ['./chat-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class ChatModalComponent implements OnInit, OnDestroy {
  @Input() targetUserId: number;
  @Input() targetUserName: string;
  @Input() targetUserAvatar: string;
  
  @ViewChild('messageContent') messageContent: ElementRef;
  
  messages: any[] = [];
  newMessage: string = '';
  currentUser: any;
  myAvatar: string = '';
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';
  
  private pollingInterval: any;
  private isPageActive: boolean = true;
  private pollingTimeouts: any = null;
  
  private notifiedMessageIds: Set<number> = new Set();
  private lastNotificationTime: number = 0;

  // ========== 新增功能变量 ==========
  isVoiceMode: boolean = false;
  isRecordingVoice: boolean = false;
  showEmojiPicker: boolean = false;
  private touchStartY: number = 0;
  public isCancelling: boolean = false; 
  private pressTimer: any = null;
  
  // 语音播放相关
  currentlyPlayingId: number | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  
  emojis: string[] = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍'
  ];

  constructor(
    private modalController: ModalController,
    private authService: AuthService,
    private actionSheetController: ActionSheetController,
    private http: HttpClient,
    private toastController: ToastController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadMyAvatar();
    this.loadDefaultAvatar();
    this.loadMessages();
    this.markMessagesAsRead();
    this.startSmartPolling();
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  ngOnDestroy() {
    this.stopPolling();
    this.notifiedMessageIds.clear();
  }

  onInputFocus() {
    setTimeout(() => {
      this.scrollToBottom();
    }, 300);
  }

  onInputBlur() {
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  @HostListener('document:visibilitychange', [])
  onVisibilityChange() {
    this.isPageActive = !document.hidden;
    this.restartPolling();
  }

  @HostListener('window:focus', [])
  onWindowFocus() {
    this.isPageActive = true;
    this.restartPolling();
    this.checkNewMessages();
  }

  @HostListener('window:blur', [])
  onWindowBlur() {
    this.isPageActive = false;
    this.restartPolling();
  }

  @HostListener('document:mousemove', [])
  @HostListener('document:keydown', [])
  onUserInteraction() {
    if (!this.isPageActive) return;
    
    if (this.pollingTimeouts) {
      clearTimeout(this.pollingTimeouts);
    }
    
    this.pollingTimeouts = setTimeout(() => {
      if (this.isPageActive) {
        this.adjustPollingRate(false);
      }
    }, 5000);
  }

  startSmartPolling() {
    this.adjustPollingRate(true);
  }

  adjustPollingRate(isActive: boolean) {
    this.stopPolling();
    
    let interval = 3000;
    
    if (isActive && this.isPageActive && !document.hidden) {
      interval = 2000;
    } else if (!this.isPageActive || document.hidden) {
      interval = 10000;
    } else {
      interval = 3000;
    }
    
    this.pollingInterval = setInterval(() => {
      this.checkNewMessages();
    }, interval);
  }

  restartPolling() {
    if (this.isPageActive && !document.hidden) {
      this.adjustPollingRate(true);
    } else {
      this.adjustPollingRate(false);
    }
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  checkNewMessages() {
    this.http.get(`${this.apiUrl}/messages/${this.targetUserId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const currentMessageIds = new Set(this.messages.map(m => m.id));
          const newMessages = res.data.filter((msg: any) => !currentMessageIds.has(msg.id));
          
          if (newMessages.length > 0) {
            let hasNewFromOther = false;
            
            newMessages.forEach((msg: any) => {
              const isMine = msg.from_user_id === this.currentUser?.id;
              if (!isMine) {
                hasNewFromOther = true;
                if (!this.notifiedMessageIds.has(msg.id)) {
                  this.notifiedMessageIds.add(msg.id);
                }
              }
              
              this.messages.push({
                id: msg.id,
                fromUserId: msg.from_user_id,
                toUserId: msg.to_user_id,
                content: msg.content,
                type: msg.type || 'text',
                duration: msg.duration,
                timestamp: new Date(msg.timestamp),
                isMine: isMine,
                isPlaying: false
              });
            });
            
            this.scrollToBottom();
            
            if (hasNewFromOther && document.hasFocus()) {
              this.markMessagesAsRead();
            }
          }
        }
      },
      error: (err) => console.error('检查新消息失败', err)
    });
  }

  private loadMyAvatar() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.myAvatar = user.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg';
      } catch(e) {
        this.myAvatar = 'https://ionicframework.com/docs/img/demos/avatar.svg';
      }
    } else {
      this.myAvatar = 'https://ionicframework.com/docs/img/demos/avatar.svg';
    }
  }

  private loadDefaultAvatar() {
    if (!this.targetUserAvatar) {
      this.targetUserAvatar = 'https://ionicframework.com/docs/img/demos/avatar.svg';
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken() || localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  markMessagesAsRead() {
    this.http.post(`${this.apiUrl}/messages/mark-read`, {
      targetUserId: this.targetUserId
    }, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        console.log('消息已标记为已读', res);
      },
      error: (err) => console.error('标记已读失败', err)
    });
  }

  loadMessages() {
    this.http.get(`${this.apiUrl}/messages/${this.targetUserId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.messages = (res.data || []).map((msg: any) => ({
            id: msg.id,
            fromUserId: msg.from_user_id,
            toUserId: msg.to_user_id,
            content: msg.content,
            type: msg.type || 'text',
            duration: msg.duration,
            timestamp: new Date(msg.timestamp),
            isMine: msg.isMine || msg.from_user_id === this.currentUser?.id,
            isPlaying: false
          }));
          this.messages.forEach(msg => {
            if (!msg.isMine) {
              this.notifiedMessageIds.add(msg.id);
            }
          });
          this.scrollToBottom();
        }
      },
      error: (err) => console.error('加载消息失败', err)
    });
  }

  // ========== 按住说话功能 ==========
  toggleVoiceMode() {
    this.isVoiceMode = !this.isVoiceMode;
    if (!this.isVoiceMode) {
      this.showEmojiPicker = false;
    }
    this.cdr.detectChanges();
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartY = event.touches[0].clientY;
    this.isCancelling = false;
    this.startPressRecording();
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isRecordingVoice) return;
    
    const currentY = event.touches[0].clientY;
    const diffY = this.touchStartY - currentY;
    
    if (diffY > 50 && !this.isCancelling) {
      this.isCancelling = true;
      this.showToast('上滑取消发送', 'warning');
    } else if (diffY <= 50 && this.isCancelling) {
      this.isCancelling = false;
      this.showToast('录音中，松手发送', 'primary');
    }
  }

  onTouchEnd() {
    if (this.isCancelling) {
      this.cancelRecording();
    } else {
      this.stopPressRecording();
    }
    this.isCancelling = false;
  }

  onMouseDown(event: MouseEvent) {
    this.touchStartY = event.clientY;
    this.isCancelling = false;
    this.startPressRecording();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isRecordingVoice) return;
    
    const currentY = event.clientY;
    const diffY = this.touchStartY - currentY;
    
    if (diffY > 50 && !this.isCancelling) {
      this.isCancelling = true;
      this.showToast('上滑取消发送', 'warning');
    } else if (diffY <= 50 && this.isCancelling) {
      this.isCancelling = false;
      this.showToast('录音中，松手发送', 'primary');
    }
  }

  onMouseUp() {
    if (this.isCancelling) {
      this.cancelRecording();
    } else {
      this.stopPressRecording();
    }
    this.isCancelling = false;
  }

  async startPressRecording() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
    if (!hasPermission.value) {
      const granted = await VoiceRecorder.requestAudioRecordingPermission();
      if (!granted.value) {
        this.showToast('需要麦克风权限才能录音', 'danger');
        return;
      }
    }
    
    try {
      await VoiceRecorder.startRecording();
      this.isRecordingVoice = true;
      this.showToast('录音中，上滑取消', 'primary');
      this.cdr.detectChanges();
    } catch (error) {
      console.error('开始录音失败', error);
      this.showToast('录音失败，请重试', 'danger');
    }
  }

  async stopPressRecording() {
    if (!this.isRecordingVoice) return;
    
    this.isRecordingVoice = false;
    this.cdr.detectChanges();
    
    try {
      const result = await VoiceRecorder.stopRecording();
      
      if (result && result.value && result.value.recordDataBase64) {
        const audioBlob = this.base64ToBlob(
          result.value.recordDataBase64,
          result.value.mimeType || 'audio/aac'
        );
        const duration = Math.ceil((result.value.msDuration || 0) / 1000);
        await this.uploadAndSendAudio(audioBlob, duration);
      } else {
        this.showToast('录音时间太短', 'warning');
      }
    } catch (error) {
      console.error('停止录音失败', error);
      this.showToast('录音失败，请重试', 'danger');
    }
  }

  cancelRecording() {
    if (this.isRecordingVoice) {
      VoiceRecorder.stopRecording();
      this.isRecordingVoice = false;
      this.showToast('已取消', 'warning');
      this.cdr.detectChanges();
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  async uploadAndSendAudio(audioBlob: Blob, duration: number) {
    const formData = new FormData();
    formData.append('audio', audioBlob, `audio_${Date.now()}.webm`);
    
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      fromUserId: this.currentUser.id,
      toUserId: this.targetUserId,
      content: URL.createObjectURL(audioBlob),
      type: 'audio',
      duration: duration,
      timestamp: new Date(),
      isMine: true,
      isTemp: true,
      isPlaying: false
    };
    this.messages.push(tempMessage);
    this.scrollToBottom();
    
    this.http.post(`${this.apiUrl}/upload/audio`, formData).subscribe({
      next: (res: any) => {
        if (res.success && res.data?.url) {
          this.sendAudioMessageToServer(res.data.url, duration, tempId);
        } else {
          this.showToast('上传失败', 'danger');
          const index = this.messages.findIndex(m => m.id === tempId);
          if (index !== -1) {
            this.messages[index].isFailed = true;
          }
        }
      },
      error: (err) => {
        console.error('上传失败', err);
        this.showToast('上传失败，请重试', 'danger');
        const index = this.messages.findIndex(m => m.id === tempId);
        if (index !== -1) {
          this.messages[index].isFailed = true;
        }
      }
    });
  }

  sendAudioMessageToServer(audioUrl: string, duration: number, tempId: number) {
    this.http.post(`${this.apiUrl}/send-audio`, {
      toUserId: this.targetUserId,
      audioUrl: audioUrl,
      duration: duration
    }, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        if (res.success) {
          const index = this.messages.findIndex(m => m.id === tempId);
          if (index !== -1) {
            this.messages[index] = {
              id: res.data.id,
              fromUserId: res.data.from_user_id,
              toUserId: res.data.to_user_id,
              content: audioUrl,
              type: 'audio',
              duration: duration,
              timestamp: new Date(res.data.timestamp),
              isMine: true,
              isPlaying: false
            };
          }
        } else {
          this.showToast('发送失败', 'danger');
        }
      },
      error: (err) => {
        console.error('发送失败', err);
        this.showToast('发送失败，请重试', 'danger');
      }
    });
  }

  async playAudioMessage(message: any) {
    if (this.currentlyPlayingId === message.id && message.isPlaying) {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      message.isPlaying = false;
      this.currentlyPlayingId = null;
      return;
    }
    
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    this.messages.forEach(msg => {
      msg.isPlaying = false;
    });
    
    message.isPlaying = true;
    this.currentlyPlayingId = message.id;
    
    const audio = new Audio(message.content);
    this.currentAudio = audio;
    
    audio.onended = () => {
      message.isPlaying = false;
      this.currentlyPlayingId = null;
      this.currentAudio = null;
    };
    
    audio.onerror = () => {
      message.isPlaying = false;
      this.currentlyPlayingId = null;
      this.currentAudio = null;
      this.showToast('播放失败', 'danger');
    };
    
    await audio.play();
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (this.showEmojiPicker) {
      this.isVoiceMode = false;
    }
    this.cdr.detectChanges();
  }

  addEmoji(emoji: string) {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
  }

  async showMoreActions() {
    const actionSheet = await this.actionSheetController.create({
      header: '选择操作',
      buttons: [
        {
          text: '拍照',
          icon: 'camera-outline',
          handler: () => {
            this.takePhoto();
          }
        },
        {
          text: '从相册选择',
          icon: 'images-outline',
          handler: () => {
            this.selectImage();
          }
        },
        {
          text: '取消',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  // 压缩图片方法
  private compressImage(base64String: string, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 确保base64字符串有正确的data:image前缀
    let imgSrc = base64String;
    if (!base64String.startsWith('data:image')) {
      imgSrc = 'data:image/jpeg;base64,' + base64String;
    }
    
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('压缩失败'));
        }
      }, 'image/jpeg', quality);
    };
    img.onerror = (err) => reject(err);
  });
}

  async takePhoto() {
  try {
    // 先请求权限（某些平台需要）
    const permission = await Camera.requestPermissions();
    if (permission.camera !== 'granted') {
      this.showToast('需要相机权限才能拍照', 'danger');
      return;
    }
      
      const photo = await Camera.getPhoto({
      quality: 70,           // 提高一点质量
      allowEditing: false,
      resultType: CameraResultType.Base64,  // 保持Base64格式
      source: CameraSource.Camera,
      width: 1024,           // 稍微加大宽度
      height: 1024
    });
    
    if (photo.base64String) {
      const loading = await this.loadingController.create({
        message: '处理图片中...'
      });
      await loading.present();
      
      try {
        // 直接传入base64String，不要加前缀（压缩函数会处理）
        const compressedBlob = await this.compressImage(photo.base64String, 1024, 0.7);
        await loading.dismiss();
        await this.uploadAndSendImageFromBlob(compressedBlob);
      } catch (compressError) {
        await loading.dismiss();
        console.error('压缩失败:', compressError);
        this.showToast('图片处理失败', 'danger');
      }
    } else {
      this.showToast('拍照失败，未获取到图片', 'danger');
    }
  } catch (error: any) {
    console.error('拍照失败:', error);
    // 用户取消拍照不算错误
    if (error?.message !== 'User cancelled photos app') {
      this.showToast('拍照失败: ' + (error?.message || '请重试'), 'danger');
    }
  }
}

  async selectImage() {
  try {
    const photo = await Camera.getPhoto({
      quality: 60,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: 800,
      height: 800
    });
      
      if (photo.base64String) {
      const loading = await this.loadingController.create({
        message: '处理图片中...'
      });
      await loading.present();
      
      try {
        const compressedBlob = await this.compressImage(photo.base64String, 1024, 0.7);
        await loading.dismiss();
        await this.uploadAndSendImageFromBlob(compressedBlob);
      } catch (compressError) {
        await loading.dismiss();
        this.showToast('图片处理失败', 'danger');
      }
    }
  } catch (error: any) {
    console.error('选择图片失败:', error);
    if (error?.message !== 'User cancelled photos app') {
      this.showToast('选择图片失败', 'danger');
    }
  }
}

  async uploadAndSendImageFromBlob(blob: Blob) {
  const formData = new FormData();
  // 注意：这里的文件扩展名可能因为压缩而变成jpg
  formData.append('image', blob, `image_${Date.now()}.jpg`);
  
  const tempId = Date.now();
  // 创建本地预览URL
  const previewUrl = URL.createObjectURL(blob);
  const tempMessage = {
    id: tempId,
    fromUserId: this.currentUser.id,
    toUserId: this.targetUserId,
    content: previewUrl,
    type: 'image',
    timestamp: new Date(),
    isMine: true,
    isTemp: true
  };
  this.messages.push(tempMessage);
  this.scrollToBottom();
  
  // 强制触发变更检测
  this.cdr.detectChanges();
  
  this.http.post(`${this.apiUrl}/upload/image`, formData).subscribe({
    next: (res: any) => {
      if (res.success && res.data?.url) {
        this.sendImageMessageToServer(res.data.url, tempId);
      } else {
        this.showToast('上传失败', 'danger');
        const index = this.messages.findIndex(m => m.id === tempId);
        if (index !== -1) {
          this.messages[index].isFailed = true;
          this.cdr.detectChanges();
        }
      }
    },
    error: (err) => {
      console.error('上传失败', err);
      this.showToast('上传失败，请重试', 'danger');
      const index = this.messages.findIndex(m => m.id === tempId);
      if (index !== -1) {
        this.messages[index].isFailed = true;
        this.cdr.detectChanges();
      }
    }
  });
}

  async uploadAndSendImage(imageDataUrl: string) {
    const blob = this.dataURLToBlob(imageDataUrl);
    const formData = new FormData();
    formData.append('image', blob, `image_${Date.now()}.jpg`);
    
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      fromUserId: this.currentUser.id,
      toUserId: this.targetUserId,
      content: imageDataUrl,
      type: 'image',
      timestamp: new Date(),
      isMine: true,
      isTemp: true
    };
    this.messages.push(tempMessage);
    this.scrollToBottom();
    
    this.http.post(`${this.apiUrl}/upload/image`, formData).subscribe({
      next: (res: any) => {
        if (res.success && res.data?.url) {
          this.sendImageMessageToServer(res.data.url, tempId);
        } else {
          this.showToast('上传失败', 'danger');
          const index = this.messages.findIndex(m => m.id === tempId);
          if (index !== -1) {
            this.messages[index].isFailed = true;
          }
        }
      },
      error: (err) => {
        console.error('上传失败', err);
        this.showToast('上传失败，请重试', 'danger');
        const index = this.messages.findIndex(m => m.id === tempId);
        if (index !== -1) {
          this.messages[index].isFailed = true;
        }
      }
    });
  }

  sendImageMessageToServer(imageUrl: string, tempId: number) {
    this.http.post(`${this.apiUrl}/send-image`, {
      toUserId: this.targetUserId,
      imageUrl: imageUrl
    }, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        if (res.success) {
          const index = this.messages.findIndex(m => m.id === tempId);
          if (index !== -1) {
            // 清理临时URL
            if (this.messages[index].content?.startsWith('blob:')) {
              URL.revokeObjectURL(this.messages[index].content);
            }
            this.messages[index] = {
              id: res.data.id,
              fromUserId: res.data.from_user_id,
              toUserId: res.data.to_user_id,
              content: imageUrl,
              type: 'image',
              timestamp: new Date(res.data.timestamp),
              isMine: true
            };
          }
        } else {
          this.showToast('发送失败', 'danger');
        }
      },
      error: (err) => {
        console.error('发送失败', err);
        this.showToast('发送失败，请重试', 'danger');
      }
    });
  }

  private dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

async previewImage(imageUrl: string) {
  const modal = await this.modalController.create({
    component: ImagePreviewModalComponent,
    componentProps: {
      imageUrl: imageUrl
    },
    cssClass: 'image-preview-modal',
    backdropDismiss: false,
    keyboardClose: true,
    mode: 'ios',
    animated: true
  });
  
  await modal.present();
}

  sendMessage() {
    if (this.isVoiceMode) return;
    if (!this.newMessage.trim()) return;
    
    const content = this.newMessage.trim();
    const tempId = Date.now();
    
    const tempMessage = {
      id: tempId,
      fromUserId: this.currentUser.id,
      toUserId: this.targetUserId,
      content: content,
      type: 'text',
      timestamp: new Date(),
      isMine: true,
      isTemp: true
    };
    this.messages.push(tempMessage);
    this.newMessage = '';
    this.scrollToBottom();
    
    this.http.post(`${this.apiUrl}/send-message`, {
      toUserId: this.targetUserId,
      content: content
    }, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const index = this.messages.findIndex(m => m.id === tempId);
          if (index !== -1) {
            this.messages[index] = {
              id: res.data.id,
              fromUserId: res.data.from_user_id,
              toUserId: res.data.to_user_id,
              content: res.data.content,
              type: 'text',
              timestamp: new Date(res.data.timestamp),
              isMine: true
            };
          }
        }
      },
      error: (err) => {
        console.error('发送失败', err);
        const index = this.messages.findIndex(m => m.id === tempId);
        if (index !== -1) {
          this.messages[index].isFailed = true;
        }
        this.showToast('发送失败，请重试');
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messageContent) {
        this.messageContent.nativeElement.scrollTop = this.messageContent.nativeElement.scrollHeight;
      }
    }, 100);
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async showMoreOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: '更多选项',
      buttons: [
        {
          text: '清空聊天记录',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.confirmClearHistory();
          }
        },
        {
          text: '举报用户',
          icon: 'flag-outline',
          handler: () => {
            this.reportUser();
          }
        },
        {
          text: '取消',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async confirmClearHistory() {
    const alert = await this.alertController.create({
      header: '清空聊天记录',
      message: `确定要清空与 <strong>${this.targetUserName}</strong> 的聊天记录吗？此操作不可恢复。`,
      buttons: [
        {
          text: '取消',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: '确定清空',
          role: 'destructive',
          handler: () => {
            this.clearChatHistory();
          }
        }
      ]
    });
    await alert.present();
  }

  async clearChatHistory() {
    this.http.delete(`${this.apiUrl}/messages/clear/${this.targetUserId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.messages = [];
          this.notifiedMessageIds.clear();
          this.scrollToBottom();
          this.showToast('聊天记录已清空', 'success');
        } else {
          this.showToast('清空失败', 'danger');
        }
      },
      error: (err) => {
        console.error('清空失败', err);
        this.showToast('清空失败，请重试', 'danger');
      }
    });
  }

  async reportUser() {
    const alert = await this.alertController.create({
      header: '举报用户',
      message: `确定要举报 ${this.targetUserName} 吗？`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: '请填写举报原因...'
        }
      ],
      buttons: [
        {
          text: '取消',
          role: 'cancel'
        },
        {
          text: '提交',
          handler: (data) => {
            console.log('举报用户:', this.targetUserName, '原因:', data.reason);
            this.showToast('举报已提交，我们会尽快处理', 'success');
          }
        }
      ]
    });
    await alert.present();
  }
}