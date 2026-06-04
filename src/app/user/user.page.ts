import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserPage implements OnInit {
  user: any = {};
  
  username: string = '';
  email: string = '';
  avatar: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  phone: string = '';
  bio: string = '';
  functionButtons: any[] = [];
  cartCount: number = 0;
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private alertController: AlertController,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    console.log('UserPage ngOnInit');
    this.preloadData();
  }

  preloadData() {
    console.log('预加载用户页面数据');
  }

  ionViewWillEnter() {
    console.log('进入用户页面，刷新数据');
    this.loadUserInfo();
    this.loadFunctions();
    this.loadCartCount();
  }

  loadUserInfo() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.user = {
        name: '点击头像登录',
        phone: '点击头像登录',
        avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
        bio: '立即登录享受更多功能'
      };
      this.username = '点击头像登录';
      this.phone = '点击头像登录';
      this.avatar = 'https://ionicframework.com/docs/img/demos/avatar.svg';
      this.bio = '立即登录享受更多功能';
      return;
    }

    this.user = user;
    this.username = user.name || user.username || '用户';
    this.phone = user.phone || '未绑定';
    this.avatar = user.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg';
    this.bio = user.bio || '这个人很懒，什么都没写';
  }

  private async checkLoginAndRedirect(): Promise<any | null> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      window.location.href = '/login';
      return null;
    }
    return user;
  }

  // 跳转到用户详细页（未登录则跳转登录页）
  async goToUserDetail() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    this.router.navigate(['/user-detail']);
  }

  loadCartCount() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.cartCount = 0;
      return;
    }
    
    this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/cart?user_id=${user.id}`)
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.cartCount = res.data.reduce((sum, item) => sum + (item.quantity || 1), 0);
          } else {
            this.cartCount = 0;
          }
        },
        error: () => {
          this.cartCount = 0;
        }
      });
  }

  async goToCartAsync() {
    const user = await this.checkLoginAndRedirect();
    if (!user) return;
    this.router.navigate(['/cart']);
  }

  loadFunctions() {
    this.functionButtons = [
      { id: 1, name: '优惠券', icon: 'ticket-outline' },
      { id: 2, name: '订单', icon: 'bag-check-outline' },
      { id: 3, name: '购物车', icon: 'cart-outline' },
      { id: 4, name: '更多', icon: 'ellipsis-horizontal-outline' }
    ];
  }

  async openSettings() {
    const user = await this.checkLoginAndRedirect();
    if (!user) return;
    
    const alert = await this.alertController.create({
      header: '设置',
      message: '选择要设置的选项',
      buttons: [
        { text: '个人资料', handler: () => this.showAlert('个人资料', '编辑个人信息功能开发中') },
        { text: '修改密码', handler: () => this.showAlert('修改密码', '修改密码功能开发中') },
        { text: '通知设置', handler: () => this.showAlert('通知设置', '通知设置功能开发中') },
        { text: '关于我们', handler: () => this.showAlert('关于我们', '版本 1.0.0') },
        { text: '退出登录', role: 'destructive', handler: () => this.confirmLogout() },
        { text: '取消', role: 'cancel' }
      ]
    });
    await alert.present();
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: '确认退出',
      message: '确定要退出登录吗？',
      buttons: [
        { text: '取消', role: 'cancel' },
        { text: '退出', handler: () => { 
          this.authService.logout(); 
          window.location.href = '/home';
          this.showAlert('提示', '已退出登录'); 
        }}
      ]
    });
    await alert.present();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['确定']
    });
    await alert.present();
  }

  handleFunctionClick(func: any) {
    if (!func || !func.name) return;
    switch(func.name) {
      case '优惠券': this.showAlert('优惠券', '您有3张优惠券待使用'); break;
      case '订单': this.showAlert('我的订单', '查看订单历史'); break;
      case '购物车': this.goToCartAsync(); break;
      default: this.showAlert(func.name, '功能开发中');
    }
  }

  async showQRCode() {
    const user = this.authService.getCurrentUser();
    this.showAlert('我的二维码', `用户名：${this.username}\n用户ID: ${user?.id || '123456'}`);
  }
}