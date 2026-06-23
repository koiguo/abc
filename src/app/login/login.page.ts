import { Component, OnInit, NgZone } from '@angular/core';  // ✅ 添加 NgZone
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController, LoadingController, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class LoginPage implements OnInit {
  
  loginData = {
    account: '',
    password: ''
  };
  rememberMe = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private navController: NavController,
    private zone: NgZone  // ✅ 添加 NgZone
  ) {}

  ngOnInit() {
    console.log('LoginPage 初始化');
  }

  // ✅ 添加这个方法 - 每次进入页面时触发
  ionViewWillEnter() {
    console.log('LoginPage 将要进入');
    this.zone.run(() => {
      // 确保页面在 Angular zone 中运行
      // 强制重新检查
    });
  }

  // ✅ 添加这个方法 - 页面完全进入后触发
  ionViewDidEnter() {
    console.log('LoginPage 已进入');
    // 强制重新渲染页面
    setTimeout(() => {
      const content = document.querySelector('ion-content');
      if (content) {
        content.style.opacity = '0.99';
        setTimeout(() => {
          content.style.opacity = '1';
        }, 50);
      }
    }, 50);
  }

  async login() {
  if (!this.loginData.account || !this.loginData.password) {
    this.showToast('请填写完整信息', 'warning');
    return;
  }

  const loading = await this.loadingController.create({
    message: '登录中...',
    spinner: 'crescent'
  });
  await loading.present();

  this.authService.login(this.loginData.account, this.loginData.password)
    .subscribe({
      next: async (response: any) => {
        await loading.dismiss();
        
        if (response.success) {
          console.log('登录成功，用户信息:', response.data.user);
          
          // ✅ 关键：手动保存 auth_token（用户ID）
          localStorage.setItem('auth_token', response.data.user.id.toString());
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('userRole', response.data.user.role || 'user');
          
          console.log('保存的auth_token:', localStorage.getItem('auth_token'));
          
          this.showToast('登录成功！', 'success');
          
          // ✅ 使用路由跳转
          if (response.data.user.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/messages']);
          }
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
    this.router.navigate(['/register'], { replaceUrl: true });
  }

  goBack() {
    console.log('返回按钮被点击');
    this.navController.back();
  }
}