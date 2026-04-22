import { Component, OnInit } from '@angular/core';  // ✅ 添加 OnInit
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController, LoadingController, NavController  } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,    // 提供 ngIf, ngFor 等
    FormsModule,     // 提供 ngModel
    IonicModule      // ✅ 提供 ion-button, ion-input 等 Ionic 组件
  ]
})
export class LoginPage implements OnInit {  // ✅ 添加 implements OnInit
  
  loginData = {
    account: '',  // 用户名或手机号
    password: ''
  };
  rememberMe = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private navController: NavController
  ) {}

  goBack() {
    console.log('返回按钮被点击');
    this.navController.back();
  }
  
  // ✅ 添加 ngOnInit 方法
  ngOnInit() {
    console.log('LoginPage 初始化');
    // 可以在这里添加检查是否已登录的逻辑
    // 例如：如果已登录，直接跳转到首页
    // if (this.authService.isLoggedIn()) {
    //   this.router.navigate(['/home']);
    // }
  }

  async login() {
    // 表单验证
    if (!this.loginData.account || !this.loginData.password) {
      this.showToast('请填写完整信息', 'warning');
      return;
    }

    // 显示加载动画
    const loading = await this.loadingController.create({
      message: '登录中...',
      spinner: 'crescent'
    });
    await loading.present();

    // 调用登录API
    this.authService.login(this.loginData.account, this.loginData.password)
      .subscribe({
        next: async (response: any) => {
          await loading.dismiss();
          
          if (response.success) {
            console.log('登录成功，保存的用户信息:', response.data.user);
            this.showToast('登录成功！', 'success');
            // 跳转到用户主页
            this.router.navigate(['/home']);
          } else {
            this.showToast(response.message || '登录失败', 'danger');
          }
        },
        error: async (error) => {
          await loading.dismiss();
          console.error('登录错误:', error);
          this.showToast('网络错误，请稍后重试', 'danger');
        }
      });
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top',
      color: color
    });
    await toast.present();
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}