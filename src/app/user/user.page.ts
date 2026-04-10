import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';  // ← 添加 OnInit
import { AlertController } from '@ionic/angular';
import { UserService } from '../services/user.service';  // ← 添加这行（导入服务）

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserPage implements OnInit {  // ← 添加 implements OnInit

  // ← 添加这些变量
  username: string = '加载中...';
  email: string = '加载中...';
  avatar: string = '';
  functionButtons: any[] = [];

  constructor(
    private alertController: AlertController,
    private userService: UserService  // ← 添加这行（注入服务）
  ) {}

  // ← 添加这个方法（页面加载时自动执行）
  ngOnInit() {
    this.loadUserInfo();
    this.loadFunctions();
  }

  // ← 添加这个方法（获取用户信息）
  loadUserInfo() {
    this.userService.getUserInfo().subscribe({
      next: (data) => {
        this.username = data.username;
        this.email = data.email;
        this.avatar = data.avatar;
      },
      error: (error) => {
        console.error('获取用户信息失败', error);
        this.username = '果果';
        this.email = 'guo123123@life.com';
      }
    });
  }

  // ← 获取功能列表
  loadFunctions() {
    this.userService.getFunctions().subscribe({
      next: (data) => {
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

  // 原有方法保留
  async showQRCode() {
    //从后端获取数据
    this.userService.getQRCode().subscribe({
      next: async (data) => {
        const alert = await this.alertController.create({
          header: '我的二维码',
          message: `用户名：${data.userName}\n用户ID:${data.userId}`,
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
}