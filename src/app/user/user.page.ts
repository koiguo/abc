import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserPage {
  username: string = '';
  email: string = '';
  avatar: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  phone: string = '';
  functionButtons: any[] = [];

  constructor(
    private alertController: AlertController,
    private authService: AuthService,
    private router: Router
  ) {}

  // 使用 Ionic 的生命周期钩子，每次进入页面都会执行 不可随意删除！
  ionViewWillEnter() {
    console.log('进入用户页面，刷新数据');
    this.loadUserInfo();
    this.loadFunctions();
  }

  loadUserInfo() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.username = user.name || user.username || '用户';
    this.phone = user.phone || '未绑定';
    this.email = user.email || '暂无邮箱';
  }

  loadFunctions() {
    this.functionButtons = [
      { id: 1, name: '优惠券', icon: 'ticket-outline' },
      { id: 2, name: '订单', icon: 'bag-check-outline' },
      { id: 3, name: '购物车', icon: 'cart-outline' },
      { id: 4, name: '更多', icon: 'ellipsis-horizontal-outline' }
    ];
  }

  // 设置按钮点击弹窗
  async openSettings() {
    const alert = await this.alertController.create({
      header: '设置',
      message: '选择要设置的选项',
      buttons: [
        {
          text: '个人资料',
          handler: () => {
            this.showAlert('个人资料', '编辑个人信息功能开发中');
          }
        },
        {
          text: '修改密码',
          handler: () => {
            this.showAlert('修改密码', '修改密码功能开发中');
          }
        },
        {
          text: '通知设置',
          handler: () => {
            this.showAlert('通知设置', '通知设置功能开发中');
          }
        },
        {
          text: '关于我们',
          handler: () => {
            this.showAlert('关于我们', '版本 1.0.0');
          }
        },
        {
          text: '退出登录',
          role: 'destructive',
          handler: () => {
            this.confirmLogout();
          }
        },
        {
          text: '取消',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  // 确认退出登录
  async confirmLogout() {
    const alert = await this.alertController.create({
      header: '确认退出',
      message: '确定要退出登录吗？',
      buttons: [
        {
          text: '取消',
          role: 'cancel'
        },
        {
          text: '退出',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
            this.showAlert('提示', '已退出登录');
          }
        }
      ]
    });
    await alert.present();
  }

  // ⭐ 只有一个 showAlert 函数，放在这里
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
      case '优惠券':
        this.showAlert('优惠券', '您有3张优惠券待使用');
        break;
      case '订单':
        this.showAlert('我的订单', '查看订单历史');
        break;
      case '购物车':
        this.showAlert('购物车', '您的购物车是空的');
        break;
      default:
        this.showAlert(func.name, '功能开发中');
    }
  }

  async checkLogin() {
    console.log('点击头像');
    this.showAlert('个人资料', this.username);
  }

  async showQRCode() {
    const user = this.authService.getCurrentUser();
    this.showAlert('我的二维码', `用户名：${this.username}\n用户ID: ${user?.id || '123456'}`);
  }
} // ← 这个闭合大括号结束类，所有方法必须在这个括号之前