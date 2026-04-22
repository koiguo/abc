import { Component, OnInit } from '@angular/core';  // ✅ 删除 CUSTOM_ELEMENTS_SCHEMA
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  // ✅ 删除 schemas: [CUSTOM_ELEMENTS_SCHEMA]（IonicModule 已经提供了所有组件）
})
export class MessagesPage implements OnInit {
  searchTerm: string = '';
  messages: any[] = [];
  filteredMessages: any[] = [];

  constructor(private toastController: ToastController) {}

  ngOnInit() {
    // Mock 数据
    this.messages = [
      { id: 1, name: '产品', lastMessage: '加入我们的会员', unread: 8, avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg' },
      { id: 2, name: '小果', lastMessage: '东西已送达！', unread: 0, avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg' },
      { id: 3, name: '产品群', lastMessage: '晚上我们有优惠活动哦', unread: 15, avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg' }
    ];
    this.filteredMessages = [...this.messages];
    // 初始化时保存未读消息数量
    this.saveUnreadCount();
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
    // 模拟后端清理：将所有消息的 unread 置为 0
    this.messages.forEach(msg => msg.unread = 0);
    this.filterMessages(); // 刷新列表显示

    // 保存未读数量为 0 到 localStorage
    localStorage.setItem('unreadCount', '0');
    
    // 可选：触发一个自定义事件通知首页
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
    // 这里可以使用 Angular Router 跳转到通讯录页面
    // this.router.navigate(['/contacts']);
  }

  // 添加新聊天
  addNewChat() {
    console.log('添加新聊天');
    // 跳转到添加好友/群聊页面
  }
}