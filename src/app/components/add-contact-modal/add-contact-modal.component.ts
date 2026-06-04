import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, AlertController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-add-contact-modal',
  templateUrl: './add-contact-modal.component.html',
  styleUrls: ['./add-contact-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AddContactModalComponent implements OnInit {
  searchKeyword: string = '';
  searchResult: any = null;
  contacts: any[] = [];
  isLoading: boolean = false;
  currentUserName: string = '';
  
  activeTab: string = 'contacts';
  receivedRequests: any[] = [];
  sentRequests: any[] = [];
  
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private modalController: ModalController,
    private http: HttpClient,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadContacts();
    this.loadCurrentUser();
    this.loadContactRequests();
  }

  private loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserName = user.name || user.username || '用户';
      } catch(e) {
        this.currentUserName = '用户';
      }
    } else {
      this.currentUserName = '用户';
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    console.log('使用的token:', token);
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadContacts() {
    this.http.get(`${this.apiUrl}/contacts`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.contacts = res.data || [];
        }
      },
      error: (err) => {
        console.error('加载联系人失败', err);
        this.loadContactsFromLocal();
      }
    });
  }

  private loadContactsFromLocal() {
    const stored = localStorage.getItem('contacts');
    if (stored) {
      this.contacts = JSON.parse(stored);
    }
  }

  loadContactRequests() {
    this.http.get(`${this.apiUrl}/contact-requests`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          // ✅ 收到的申请：只显示 pending 状态
          this.receivedRequests = (res.data.received || []).filter((req: any) => req.status === 'pending');
          // ✅ 发出的申请：不显示 deleted 状态
          this.sentRequests = (res.data.sent || []).filter((req: any) => req.status !== 'deleted');
          
          console.log('收到的申请:', this.receivedRequests);
          console.log('发出的申请:', this.sentRequests);
        }
      },
      error: (err) => {
        console.error('加载申请列表失败', err);
      }
    });
  }

  // ✅ 处理申请（同意/拒绝）
  handleRequest(requestId: number, action: string) {
    this.http.put(`${this.apiUrl}/contact-requests/${requestId}/handle`, {
      action: action
    }, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToast(res.message, 'success');
          this.loadContactRequests();
          this.loadContacts();
          this.modalController.dismiss({ action: 'refresh' });
        } else {
          // ✅ 显示具体错误信息（如"申请已过期"）
          this.showToast(res.message || '操作失败', 'danger');
          if (res.message && (res.message.includes('撤销') || res.message.includes('过期'))) {
            this.loadContactRequests();
          }
        }
      },
      error: (err) => {
        console.error('操作失败', err);
        this.showToast('操作失败，请重试', 'danger');
      }
    });
  }

  // ✅ 左滑拒绝（等同于点击拒绝按钮）
  rejectRequest(req: any) {
    this.handleRequest(req.id, 'reject');
  }

  searchUser() {
    const keyword = this.searchKeyword.trim();
    if (!keyword) {
      this.showToast('请输入手机号或昵称');
      return;
    }

    this.isLoading = true;
    
    this.http.get(`${this.apiUrl}/users/search?keyword=${encodeURIComponent(keyword)}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data && res.data.length > 0) {
          this.searchResult = res.data[0];
        } else {
          this.searchResult = null;
          this.showToast('未找到用户');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('搜索失败', err);
        this.showToast('搜索失败，请重试');
        this.searchResult = null;
      }
    });
  }

  isAlreadyContact(userId: number): boolean {
    return this.contacts.some(c => (c.user_id === userId || c.contact_id === userId));
  }

  hasPendingRequest(userId: number): boolean {
    return this.sentRequests.some(req => req.to_user_id === userId && req.status === 'pending');
  }

  getButtonText(userId: number): string {
    if (this.isAlreadyContact(userId)) {
      return '已是好友';
    }
    if (this.hasPendingRequest(userId)) {
      return '申请中';
    }
    return '添加';
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      default: return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'pending': return '等待中';
      case 'accepted': return '已同意';
      case 'rejected': return '已拒绝';
      default: return status;
    }
  }

  onTabChange(event: any) {
    if (event.detail.value === 'received' || event.detail.value === 'sent') {
      this.loadContactRequests();
    }
  }

  addContact(user: any) {
    if (this.isAlreadyContact(user.id)) {
      this.showToast('该用户已是您的好友');
      return;
    }
    
    if (this.hasPendingRequest(user.id)) {
      this.showToast('已发送过好友申请，请等待对方处理');
      return;
    }

    this.http.post(`${this.apiUrl}/contact-requests/send`, {
      to_user_id: user.id,
      message: `您好，我是${this.currentUserName}，想加您为好友`
    }, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToast('好友申请已发送', 'success');
          this.searchResult = null;
          this.searchKeyword = '';
          this.loadContactRequests();
        } else {
          this.showToast(res.message || '发送失败', 'danger');
        }
      },
      error: (err) => {
        console.error('发送失败', err);
        this.showToast('发送失败，请重试', 'danger');
      }
    });
  }

  deleteContact(contact: any) {
    const contactId = contact.user_id || contact.contact_id;
    
    this.http.delete(`${this.apiUrl}/contacts/${contactId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToast('删除成功', 'success');
          this.loadContacts();
        } else {
          this.showToast(res.message || '删除失败', 'danger');
        }
      },
      error: (err) => {
        console.error('删除失败', err);
        this.contacts = this.contacts.filter(c => (c.user_id !== contactId && c.contact_id !== contactId));
        this.showToast('已删除', 'success');
      }
    });
  }

  startChat(contact: any) {
    this.modalController.dismiss({
      action: 'chat',
      userId: contact.user_id || contact.contact_id,
      userName: contact.remark_name || contact.name
    });
  }

  // ✅ 删除已发送的申请（支持所有状态）
  async deleteSentRequest(request: any) {
    let title = '删除申请';
    let message = `确定要删除向 ${request.to_user_name} 发送的好友申请吗？`;
    
    // 如果是已同意的申请，提示不影响联系人
    if (request.status === 'accepted') {
      message = `确定要删除向 ${request.to_user_name} 发送的好友申请记录吗？`;
    }
    
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: [
        {
          text: '取消',
          role: 'cancel'
        },
        {
          text: '删除',
          role: 'destructive',
          handler: () => {
            this.confirmDeleteSentRequest(request.id);
          }
        }
      ]
    });
    await alert.present();
  }

  // ✅ 确认删除
  confirmDeleteSentRequest(requestId: number) {
    this.http.delete(`${this.apiUrl}/contact-requests/${requestId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToast(res.message, 'success');
          this.loadContactRequests();
          this.loadContacts();
        } else {
          this.showToast(res.message || '删除失败', 'danger');
        }
      },
      error: (err) => {
        console.error('删除失败', err);
        this.showToast('删除失败，请重试', 'danger');
      }
    });
  }

  private async showToast(message: string, color: string = 'medium') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  dismiss() {
    this.modalController.dismiss();
  }
}