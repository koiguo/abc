import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RegisterPage {
  
  registerData = {
    name: '',
    phone: '',
    password: '',
    email: ''
  };
  confirmPassword = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  // 返回登录页
  goBack() {
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  // 跳转登录页
  goToLogin() {
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  async register() {
    // 表单验证
    if (!this.registerData.name || !this.registerData.phone || !this.registerData.password) {
      this.showToast('请填写完整信息', 'warning');
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(this.registerData.phone)) {
      this.showToast('请输入正确的手机号', 'warning');
      return;
    }

    // 验证密码长度
    if (this.registerData.password.length < 6) {
      this.showToast('密码长度至少6位', 'warning');
      return;
    }

    // 验证两次密码是否一致
    if (this.registerData.password !== this.confirmPassword) {
      this.showToast('两次输入的密码不一致', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: '注册中...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.register(this.registerData).subscribe({
      next: async (response: any) => {
        await loading.dismiss();
        
        if (response.success) {
          this.showToast('注册成功！请登录', 'success');
          this.router.navigate(['/login'], { replaceUrl: true });
        } else {
          this.showToast(response.message || '注册失败', 'danger');
        }
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('注册错误:', error);
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
}