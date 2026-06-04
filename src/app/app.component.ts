import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';  // ✅ 添加 OnDestroy
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, appsOutline, cameraOutline, chatbubblesOutline, personOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { ToastController, AlertController, ActionSheetController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';  // ✅ 添加 HttpClient

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit, OnDestroy {  // ✅ 添加 implements OnDestroy
  // 控制底部导航栏的显示/隐藏
  showTabs = false;
  currentUrl: string = '';
  
  // ✅ 未读数量相关
  totalUnreadCount: number = 0;
  private pollingInterval: any;
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private http: HttpClient  // ✅ 添加 HttpClient
  ) {
    // 注册图标
    addIcons({
      'home-outline': homeOutline,
      'apps-outline': appsOutline,
      'camera-outline': cameraOutline,
      'chatbubbles-outline': chatbubblesOutline,
      'person-outline': personOutline
    });
  }

  // ✅ 初始化
  ngOnInit() {
    // 监听路由变化，控制导航栏显示/隐藏
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.urlAfterRedirects;
        this.showTabs = !(this.currentUrl.includes('/login') || this.currentUrl.includes('/register'));
        console.log('当前路由:', this.currentUrl, '显示导航栏:', this.showTabs);
      }
    });

    // ✅ 加载未读数量
    this.loadTotalUnreadCount();
    
    // ✅ 启动轮询（每5秒更新未读数）
    this.startPolling();
    
    // ✅ 监听未读数量更新事件
    window.addEventListener('unreadCountUpdated', this.handleUnreadUpdate.bind(this));
  }

  // ✅ 组件销毁时清理
  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    window.removeEventListener('unreadCountUpdated', this.handleUnreadUpdate.bind(this));
  }

  // ✅ 启动轮询
  startPolling() {
    this.pollingInterval = setInterval(() => {
      this.loadTotalUnreadCount();
    }, 5000);
  }

  // ✅ 处理未读数量更新事件
  handleUnreadUpdate(event: any) {
    if (event.detail && typeof event.detail.unreadCount === 'number') {
      this.totalUnreadCount = event.detail.unreadCount;
    }
  }

  // ✅ 获取请求头
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ 加载总未读数量
  loadTotalUnreadCount() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // 获取消息未读数
    this.http.get(`${this.apiUrl}/contacts`, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const messageUnread = res.data.reduce((total: number, contact: any) => total + (contact.unread || 0), 0);
          
          // 获取好友申请未读数
          this.http.get(`${this.apiUrl}/contact-requests/pending-count`, { headers: this.getHeaders() }).subscribe({
            next: (reqRes: any) => {
              if (reqRes.success) {
                const requestUnread = reqRes.count || 0;
                this.totalUnreadCount = messageUnread + requestUnread;
                localStorage.setItem('totalUnreadCount', this.totalUnreadCount.toString());
                console.log(`总未读: 消息${messageUnread} + 申请${requestUnread} = ${this.totalUnreadCount}`);
              }
            },
            error: (err) => console.error('获取申请未读数失败', err)
          });
        }
      },
      error: (err) => console.error('获取未读消息数失败', err)
    });
  }

  // ✅ 获取显示用的未读数字符串
  getDisplayUnreadCount(): string {
    if (this.totalUnreadCount === 0) return '';
    return this.totalUnreadCount > 99 ? '99+' : this.totalUnreadCount.toString();
  }

  // ========== 页面跳转方法 ==========
  goToHome() {
    this.router.navigate(['/home']);
  }

  goToCategory() {
    this.router.navigate(['/category']);
  }

  goToMessages() {
    this.router.navigate(['/messages']);
  }

  goToUser() {
    console.log('点击跳转到用户页面');
    this.router.navigate(['/user']).then(success => {
      console.log('跳转结果:', success);
    }).catch(err => {
      console.error('跳转失败:', err);
    });
  }

  // ========== 相机功能 ==========
  async openCamera() {
    if (Capacitor.isNativePlatform()) {
      await this.showActionSheet();
    } else {
      await this.takePhotoWeb();
    }
  }

  private async showActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: '选择照片',
      buttons: [
        {
          text: '拍照',
          icon: 'camera-outline',
          handler: () => {
            this.takePhotoFromCamera();
          }
        },
        {
          text: '从相册选择',
          icon: 'images-outline',
          handler: () => {
            this.selectFromGallery();
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

  private async takePhotoFromCamera() {
    try {
      const permission = await Camera.checkPermissions();
      if (permission.camera !== 'granted') {
        const result = await Camera.requestPermissions();
        if (result.camera !== 'granted') {
          this.showToast('需要相机权限才能拍照', 'danger');
          return;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: true
      });

      if (photo.dataUrl) {
        await this.showToast('拍照成功！', 'success');
        this.router.navigate(['/camera'], {
          state: { photo: photo.dataUrl, source: 'camera' }
        });
      }

    } catch (error: any) {
      if (!error.message?.includes('cancel')) {
        console.error('拍照失败:', error);
        this.showToast('拍照失败，请重试', 'danger');
      }
    }
  }

  private async selectFromGallery() {
    try {
      const permission = await Camera.checkPermissions();
      if (permission.photos !== 'granted') {
        const result = await Camera.requestPermissions();
        if (result.photos !== 'granted') {
          this.showToast('需要相册权限才能选择照片', 'danger');
          return;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      if (photo.dataUrl) {
        await this.showToast('照片已选择！', 'success');
        this.router.navigate(['/camera'], {
          state: { photo: photo.dataUrl, source: 'gallery' }
        });
      }

    } catch (error: any) {
      if (!error.message?.includes('cancel')) {
        console.error('选择照片失败:', error);
        this.showToast('选择照片失败，请重试', 'danger');
      }
    }
  }

  private async takePhotoWeb() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const photoDataUrl = e.target.result;
            this.showToast('拍照成功！', 'success');
            this.router.navigate(['/camera'], {
              state: { photo: photoDataUrl, source: 'camera' }
            });
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
      
    } catch (error) {
      console.error('PC端拍照失败:', error);
      this.showToast('无法打开相机，请检查权限', 'danger');
    }
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}