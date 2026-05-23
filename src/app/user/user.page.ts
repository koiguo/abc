import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CropperService } from '../services/cropper.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserPage implements OnInit {
  
  username: string = '';
  email: string = '';
  avatar: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  phone: string = '';
  functionButtons: any[] = [];
  cartCount: number = 0;
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private alertController: AlertController,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private userService: UserService,
    private loadingController: LoadingController,
    private cropperService: CropperService,
    private navController: NavController
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
      this.username = '点击登录';
      this.phone = '点击头像登录';
      this.email = '立即登录享受更多功能';
      this.avatar = 'https://ionicframework.com/docs/img/demos/avatar.svg';
      return;
    }
    
    this.username = user.name || user.username || '用户';
    this.phone = user.phone || '未绑定';
    this.email = user.email || '暂无邮箱';
    this.avatar = user.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg';
  }

  /**
   * 检查登录状态，未登录则跳转登录页
   * @returns 返回当前用户，未登录返回 null 并已跳转
   */
  private async checkLoginAndRedirect(): Promise<any | null> {
  const user = this.authService.getCurrentUser();
  if (!user) {
    // 使用 window.location.href 强制刷新页面，确保登录页正常显示
    window.location.href = '/login';
    return null;
  }
  return user;
}

  // 修改头像
  async changeAvatar() {
    const user = await this.checkLoginAndRedirect();
    if (!user) return;
    
    console.log('开始裁剪头像');
    
    try {
      const croppedBlob = await this.cropperService.cropImage({
        aspectRatio: 1,
        width: 500,
        height: 500,
        quality: 0.9
      });
      
      console.log('裁剪结果:', croppedBlob);
      
      if (croppedBlob) {
        await this.uploadImage(croppedBlob);
      } else {
        console.log('用户取消了裁剪');
      }
    } catch (error) {
      console.error('裁剪失败:', error);
      this.showAlert('错误', '裁剪失败，请重试');
    }
  }

  // 上传图片
  async uploadImage(blob: Blob) {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    const loading = await this.loadingController.create({
      message: '上传中...'
    });
    await loading.present();
    
    try {
      const formData = new FormData();
      formData.append('avatar', blob, `avatar_${user.id}_${Date.now()}.jpg`);
      
      this.userService.uploadAvatar(formData).subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          if (res.success && res.data?.url) {
            this.avatar = res.data.url;
            user.avatar = res.data.url;
            localStorage.setItem('user', JSON.stringify(user));
            this.userService.saveAvatarUrl(user.id, res.data.url).subscribe();
            this.showAlert('成功', '头像更新成功');
          } else {
            this.showAlert('错误', res.message || '上传失败');
          }
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('上传失败:', err);
          this.showAlert('错误', '上传失败，请重试');
        }
      });
    } catch (error) {
      await loading.dismiss();
      this.showAlert('错误', '处理图片失败');
    }
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

  goToCart() {
    this.checkLoginAndRedirect();  // 检查登录，会自动跳转
    // 注意：上面这行不会等待，需要修改
  }

  // 修正版 goToCart
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

  // 点击头像显示个人资料
  async showProfile() {
    const user = await this.checkLoginAndRedirect();
    if (!user) return;
    
    this.showAlert('个人资料', `用户名：${this.username}\n手机：${this.phone}\n邮箱：${this.email}`);
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
        // 使用 window.location.href 强制跳转
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