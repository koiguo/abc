import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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
export class MessagesPage implements OnInit, OnDestroy {
  searchTerm: string = '';
  messages: any[] = [];
  filteredMessages: any[] = [];
  pendingRequestCount: number = 0;
  totalUnreadCount: number = 0;
  isLoading: boolean = false;  // 改为 false，首次加载不显示 loading
  isRefreshing: boolean = false;
  isError: boolean = false;
  isLoggedIn: boolean = true;
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';
  
  private pollingInterval: any;
  private isPageActive: boolean = true;
  private isUpdating: boolean = false;

  constructor(
    private toastController: ToastController,
    private modalController: ModalController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.isLoggedIn = false;
      this.isLoading = false;
      return;
    }
    this.isLoggedIn = true;

    // 首次加载不显示 loading，直接静默加载
    this.loadContactsFromApi(true);  // 改为 true，静默加载
    this.loadPendingRequestCount(true);
    this.startSmartPolling();
  }

  goToLogin() {
    window.location.href = '/login';
  }

  ngOnDestroy() {
    this.stopPolling();
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
    this.refreshAll();
  }

  @HostListener('window:blur', [])
  onWindowBlur() {
    this.isPageActive = false;
    this.restartPolling();
  }

  startSmartPolling() {
    this.adjustPollingRate();
  }

  adjustPollingRate() {
    this.stopPolling();
    
    let interval = 5000;
    
    if (this.isPageActive && !document.hidden) {
      interval = 3000;
    } else {
      interval = 15000;
    }
    
    this.pollingInterval = setInterval(() => {
      this.refreshAll();
    }, interval);
  }

  restartPolling() {
    this.adjustPollingRate();
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  refreshAll() {
    this.loadContactsFromApi(true);
    this.loadPendingRequestCount(true);
  }

  loadPendingRequestCount(silent: boolean = false) {
    this.http.get(`${this.apiUrl}/contact-requests/pending-count`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          const newCount = res.count || 0;
          if (this.pendingRequestCount !== newCount) {
            this.pendingRequestCount = newCount;
            localStorage.setItem('pendingRequestCount', this.pendingRequestCount.toString());
            this.updateTotalBadge();
          }
        }
      },
      error: (err) => {
        if (!silent) {
          console.error('加载申请数量失败', err);
          this.pendingRequestCount = 0;
        }
      }
    });
  }

  // 格式化最后一条消息的显示内容
  private formatLastMessage(contact: any): string {
    const lastMessage = contact.last_message || '';
    const lastMessageType = contact.last_message_type || 'text';
    const duration = contact.last_message_duration || 0;
    
    if (lastMessageType === 'image') {
      return '[图片]';
    } else if (lastMessageType === 'audio') {
      return `[语音 ${duration}'']`;
    } else {
      return lastMessage;
    }
  }

  // 加载联系人
  loadContactsFromApi(silent: boolean = false) {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    
    // 只有非静默模式才显示加载状态（但首次加载已改为静默，所以不会显示）
    if (!silent) {
      this.isLoading = true;
    }
    this.isError = false;
    
    this.http.get(`${this.apiUrl}/contacts`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        this.isUpdating = false;
        
        if (!silent) {
          this.isLoading = false;
        }
        
        if (res.success && res.data) {
          const newMessages = res.data.map((contact: any) => ({
            id: contact.id,
            user_id: contact.user_id,
            name: contact.remark_name || contact.name,
            lastMessage: this.formatLastMessage(contact),
            unread: contact.unread || 0,
            avatar: contact.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg',
            last_message_time: contact.last_message_time,
            raw_last_message: contact.last_message,
            last_message_type: contact.last_message_type
          }));
          
          this.mergeMessagesSilently(newMessages);
          this.saveUnreadCount();
          this.updateTotalBadge();
        } else {
          if (res.data && res.data.length === 0) {
            this.messages = [];
            this.filteredMessages = [];
          }
        }
      },
      error: (err) => {
        console.error('加载联系人失败', err);
        this.isUpdating = false;
        if (!silent) {
          this.isLoading = false;
          this.isError = true;
        }
      }
    });
  }

  // 静默合并消息（无控制台日志，无额外动画）
  private mergeMessagesSilently(newMessages: any[]) {
    let hasChanges = false;
    const existingMap = new Map(this.messages.map(m => [m.user_id, m]));
    
    for (const newMsg of newMessages) {
      const existing = existingMap.get(newMsg.user_id);
      if (existing) {
        if (newMsg.unread !== existing.unread) {
          hasChanges = true;
          existing.unread = newMsg.unread;
        }
        
        existing.lastMessage = newMsg.lastMessage;
        existing.last_message_time = newMsg.last_message_time;
        existing.name = newMsg.name;
        existing.avatar = newMsg.avatar;
      } else {
        hasChanges = true;
        this.messages.push(newMsg);
        existingMap.set(newMsg.user_id, newMsg);
      }
    }
    
    const newUserIds = new Set(newMessages.map(m => m.user_id));
    const removedCount = this.messages.filter(m => !newUserIds.has(m.user_id)).length;
    if (removedCount > 0) hasChanges = true;
    this.messages = this.messages.filter(m => newUserIds.has(m.user_id));
    
    this.messages.sort((a, b) => {
      const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
      const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
      return timeB - timeA;
    });
    
    this.filterMessages();
    
    if (hasChanges) {
      this.saveUnreadCount();
      this.updateTotalBadge();
    }
  }

  updateTotalBadge() {
    const totalUnread = this.messages.reduce((total, msg) => total + (msg.unread || 0), 0);
    this.totalUnreadCount = totalUnread + this.pendingRequestCount;
    localStorage.setItem('totalUnreadCount', this.totalUnreadCount.toString());
    window.dispatchEvent(new CustomEvent('unreadCountUpdated', { 
      detail: { unreadCount: this.totalUnreadCount } 
    }));
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  markMessagesAsRead(userId: number) {
    this.http.post(`${this.apiUrl}/messages/mark-read`, {
      targetUserId: userId
    }, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {},
      error: (err) => {
        console.error('标记已读失败', err);
      }
    });
  }

  async openChat(userId: number, userName: string) {
    this.markMessagesAsRead(userId);
    
    const message = this.messages.find(m => m.user_id === userId);
    if (message && message.unread > 0) {
      message.unread = 0;
      this.filterMessages();
      this.saveUnreadCount();
      this.updateTotalBadge();
    }

    const userAvatar = message?.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg';
    
    const tabBar = document.querySelector('ion-tab-bar');
    if (tabBar) {
      tabBar.style.display = 'none';
    }
   
    const modal = await this.modalController.create({
      component: ChatModalComponent,
      componentProps: {
        targetUserId: userId,
        targetUserName: userName,
        targetUserAvatar: userAvatar
      },
      cssClass: 'chat-modal-fullscreen'
    });
    
    modal.onDidDismiss().then(() => {
      if (tabBar) {
        tabBar.style.display = '';
      }
      this.loadContactsFromApi(true);
      this.loadPendingRequestCount(true);
    });
    
    await modal.present();
  }

  saveUnreadCount() {
    const totalUnread = this.messages.reduce((total, msg) => total + (msg.unread || 0), 0);
    localStorage.setItem('unreadCount', totalUnread.toString());
  }

  filterMessages() {
    const term = this.searchTerm.trim().toLowerCase();
    if (term === '') {
      this.filteredMessages = [...this.messages];
    } else {
      this.filteredMessages = this.messages.filter(msg => 
        (msg.name && msg.name.toLowerCase().includes(term)) || 
        (msg.lastMessage && msg.lastMessage.toLowerCase().includes(term))
      );
    }
  }

  async clearAllMessages() {
    this.messages.forEach(msg => msg.unread = 0);
    this.filterMessages();
    localStorage.setItem('unreadCount', '0');
    this.updateTotalBadge();
    window.dispatchEvent(new CustomEvent('messagesCleared'));
    
    const toast = await this.toastController.create({
      message: '所有未读消息已清扫',
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    toast.present();
  }

  async openContacts() {
    try {
      const { AddContactModalComponent } = await import('../components/add-contact-modal/add-contact-modal.component');
      
      const modal = await this.modalController.create({
        component: AddContactModalComponent,
        componentProps: {}
      });
      
      modal.onDidDismiss().then((result) => {
        if (result.data && result.data.action === 'chat') {
          this.openChat(result.data.userId, result.data.userName);
        } else if (result.data && result.data.action === 'refresh') {
          this.refreshAll();
        }
        this.updateTotalBadge();
      });
      
      await modal.present();
    } catch (error) {
      console.error('加载联系人组件失败', error);
      const toast = await this.toastController.create({
        message: '通讯录功能开发中...',
        duration: 1500,
        position: 'bottom'
      });
      toast.present();
    }
  }

  async addNewChat() {
    try {
      const { AddContactModalComponent } = await import('../components/add-contact-modal/add-contact-modal.component');
      
      const modal = await this.modalController.create({
        component: AddContactModalComponent,
        componentProps: {}
      });
      
      modal.onDidDismiss().then((result) => {
        if (result.data && result.data.action === 'chat') {
          this.openChat(result.data.userId, result.data.userName);
        } else if (result.data && result.data.action === 'refresh') {
          this.refreshAll();
        }
        this.updateTotalBadge();
      });
      
      await modal.present();
    } catch (error) {
      console.error('加载联系人组件失败', error);
      const toast = await this.toastController.create({
        message: '添加联系人功能开发中...',
        duration: 1500,
        position: 'bottom'
      });
      toast.present();
    }
  }
}