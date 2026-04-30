import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController, ActionSheetController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';  // ✅ 添加 HttpClient

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
export class ChatModalComponent implements OnInit {
  @Input() targetUserId: number;
  @Input() targetUserName: string;
  
  @ViewChild('messageContent') messageContent: ElementRef;
  
  messages: any[] = [];
  newMessage: string = '';
  currentUser: any;
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';  // ✅ 添加后端地址

  constructor(
    private modalController: ModalController,
    private authService: AuthService,
    private actionSheetController: ActionSheetController,
    private http: HttpClient  // ✅ 添加 HttpClient
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadMessages();
    this.markMessagesAsRead();  // 进入聊天页面时，立即标记该会话的所有消息为已读
  }

  // ✅ 获取请求头
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ 添加标记已读的方法（直接用 HttpClient）
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

  // ✅ 加载消息（直接用 HttpClient）
  loadMessages() {
    this.http.get(`${this.apiUrl}/messages/${this.targetUserId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.messages = res.data || [];
          this.scrollToBottom();
        }
      },
      error: (err) => console.error('加载消息失败', err)
    });
  }

  // ✅ 发送消息（直接用 HttpClient）
  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    this.http.post(`${this.apiUrl}/send-message`, {
      toUserId: this.targetUserId,
      content: this.newMessage
    }, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.messages.push({
            id: res.data.id,
            fromUserId: this.currentUser.id,
            toUserId: this.targetUserId,
            content: this.newMessage,
            timestamp: new Date(),
            isMine: true
          });
          this.newMessage = '';
          this.scrollToBottom();
        }
      },
      error: (err) => console.error('发送失败', err)
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

  // 显示更多选项
  async showMoreOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: '更多选项',
      buttons: [
        {
          text: '清空聊天记录',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.clearChatHistory();
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

  async clearChatHistory() {
    this.messages = [];
    this.scrollToBottom();
    console.log('聊天记录已清空');
  }

  reportUser() {
    console.log('举报用户:', this.targetUserName);
  }
}