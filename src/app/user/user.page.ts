import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from './user.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
  standalone: true,  // ✅ 添加这一行
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, IonicModule]  // ✅ 添加这一行
})
export class UserPage implements OnInit {
  account: string = '';
  password: string = '';
  username: string = '';
  email: string = '';
  avatar: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  phone: string = '';
  functionButtons: any[] = [];
  isLoggedIn: boolean = false;

  constructor(
    private alertController: AlertController,
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    console.log('UserPage 读取的用户信息:', user);

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    
    // 显示用户信息
    this.username = user.name || '用户';
    this.phone = user.phone || '';
    this.email = user.email || '暂无邮箱';

    console.log('显示的用户名:', this.username);
    console.log('显示的手机号:', this.phone);
    
    this.loadFunctions();
  }

  loadFunctions() {
    this.userService.getFunctions().subscribe({
      next: (data: any) => {
        this.functionButtons = data;
      },
      error: (error) => {
        console.error('获取功能列表失败', error);
        this.functionButtons = [
          { id: 1, name: '优惠券', icon: 'ticket-outline' },
          { id: 2, name: '订单', icon: 'bag-check-outline' },
          { id: 3, name: '购物车', icon: 'cart-outline' },
          { id: 4, name: '更多', icon: 'ellipsis-horizontal-outline' }
        ];
      }
    });
  }

  // 处理功能按钮点击
  handleFunctionClick(func: any) {
    console.log('点击了功能:', func.name);
    
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
    console.log('点击图标');
    this.router.navigate(['/login']);
  }

  // 显示弹窗
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['确定']
    });
    await alert.present();
  }

  // 显示二维码
  async showQRCode() {
    this.userService.getQRCode().subscribe({
      next: async (data: any) => {
        const alert = await this.alertController.create({
          header: '我的二维码',
          message: `用户名：${data.userName}\n用户ID: ${data.userId}`,
          buttons: ['关闭']
        });
        await alert.present();
      },
      error: async (error: any) => {
        const alert = await this.alertController.create({
          header: '我的二维码',
          message: '二维码功能开发中',
          buttons: ['关闭']
        });
        await alert.present();
      }
    });
  }
} // ← 这个闭合大括号结束类，所有方法必须在这个括号之前