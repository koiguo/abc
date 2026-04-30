import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ToastController, ModalController } from '@ionic/angular';  
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChatModalComponent } from '../components/chat-modal/chat-modal.component';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class MessagesPage implements OnInit {
  searchTerm: string = '';
  messages: any[] = [];
  filteredMessages: any[] = [];
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private toastController: ToastController,
    private modalController: ModalController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.messages = [
      { id: 1, user_id: 2, name: '产品', lastMessage: '加入我们的会员', unread: 8, avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg' },
      { id: 2, user_id: 3, name: '小果', lastMessage: '东西已送达！', unread: 0, avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg' },
      { id: 3, user_id: 4, name: '产品群', lastMessage: '晚上我们有优惠活动哦', unread: 15, avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg' }
    ];
    this.filteredMessages = [...this.messages];
    this.saveUnreadCount();
  }

  // 获取请求头
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // 标记消息为已读
  markMessagesAsRead(userId: number) {
    this.http.post(`${this.apiUrl}/messages/mark-read`, {
      targetUserId: userId
    }, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        console.log('标记已读成功');
      },
      error: (err) => {
        console.error('标记已读失败', err);
      }
    });
  }

  // 打开聊天对话框
  async openChat(userId: number, userName: string) {
    // 先标记已读
    this.markMessagesAsRead(userId);
    
    // 更新前端未读数
    const message = this.messages.find(m => m.user_id === userId);
    if (message && message.unread > 0) {
      message.unread = 0;
      this.filterMessages();
      this.saveUnreadCount();
    }
    
    // 打开聊天对话框
    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: {
        targetUserId: userId,
        targetUserName: userName
      }
    });
    await modal.present();
  }

  // 计算并保存未读消息数量
  saveUnreadCount() {
    const totalUnread = this.messages.reduce((total, msg) => total + msg.unread, 0);
    localStorage.setItem('unreadCount', totalUnread.toString());
  }

  // 搜索过滤逻辑
  filterMessages() {
    const term = this.searchTerm.trim().toLowerCase();
    if (term === '') {
      this.filteredMessages = [...this.messages];
    } else {
      this.filteredMessages = this.messages.filter(msg => 
        msg.name.toLowerCase().includes(term) || 
        msg.lastMessage.toLowerCase().includes(term)
      );
    }
  }

  // 一键清扫未读
  async clearAllMessages() {
    this.messages.forEach(msg => msg.unread = 0);
    this.filterMessages();
    localStorage.setItem('unreadCount', '0');
    window.dispatchEvent(new CustomEvent('messagesCleared'));
    
    const toast = await this.toastController.create({
      message: '所有未读消息已清扫',
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    toast.present();
  }

  // 打开通讯录页
  openContacts() {
    console.log('打开通讯录');
  }

  // 添加新聊天
  addNewChat() {
    console.log('添加新聊天');
  }
}