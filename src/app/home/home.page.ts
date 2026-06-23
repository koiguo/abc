import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, ActionSheetController, AlertController } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { NavController } from '@ionic/angular';
import * as ionIcons from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

register();

interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  image?: string;
  description?: string;
  category?: string;
  sales_count?: number;
  is_hot?: boolean;
  is_new?: boolean;
}

interface FunctionButton {
  id: number;
  name: string;
  icon: string;
  icon_type: string;
}

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,          
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})

export class HomePage implements OnInit, OnDestroy {
  searchText = '';
  hasUnreadMessage = false;
  currentSlideIndex = 0;
  
  // 用户头像
  userAvatar: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  
  // 用户已选择的功能按钮
  functionButtons: FunctionButton[] = [];
  isLoadingFunctions = false;
  
  // 所有可用功能（管理员添加的）
  availableFunctions: FunctionButton[] = [];
  maxSelect = 8;
  
  // 轮播图
  banners: Banner[] = [];
  isLoadingBanners = false;
  
  products: Product[] = [];
  isLoading = false;

  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private router: Router,
    private toastController: ToastController,
    private http: HttpClient,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private navController: NavController,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('HomePage ngOnInit');
    
    window.addEventListener('avatar-updated', this.handleAvatarUpdate.bind(this));
    
    // 先显示缓存数据（无加载动画）
    this.loadCachedData();
    
    // 后台静默更新（不显示加载动画）
    this.loadBannersSilent();
    this.loadUserFunctionsSilent();
    this.loadProductsSilent();
    this.loadAvailableFunctionsSilent();
    
    this.checkUnreadMessages();
    this.loadUserAvatar();
  }

  ngOnDestroy() {
    window.removeEventListener('avatar-updated', this.handleAvatarUpdate.bind(this));
  }

  ionViewWillEnter() {
    console.log('HomePage ionViewWillEnter');
    this.checkUnreadMessages();
    this.loadUserAvatar();
    // 每次进入时静默刷新
    this.loadBannersSilent();
    this.loadUserFunctionsSilent();
    this.loadProductsSilent();
  }

  // 获取请求头
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  handleAvatarUpdate(event: any) {
    if (event.detail.avatarUrl) {
      this.userAvatar = event.detail.avatarUrl;
      console.log('主页头像已更新:', this.userAvatar);
    }
  }

  loadUserAvatar() {
    const user = this.authService.getCurrentUser();
    if (user && user.avatar) {
      this.userAvatar = user.avatar;
    } else {
      this.userAvatar = 'https://ionicframework.com/docs/img/demos/avatar.svg';
    }
  }

  // ========== 缓存加载（无动画） ==========
  loadCachedData() {
    // 缓存轮播图
    const cachedBanners = localStorage.getItem('cachedBanners');
    if (cachedBanners) {
      this.banners = JSON.parse(cachedBanners);
      console.log('使用缓存轮播图');
    }
    
    // 缓存功能按钮
    const cachedFunctions = localStorage.getItem('cachedUserFunctions');
    if (cachedFunctions) {
      this.functionButtons = JSON.parse(cachedFunctions);
      this.registerIcons();
      console.log('使用缓存功能按钮');
    }
    
    // 缓存商品
    const cachedProducts = localStorage.getItem('cachedProducts');
    if (cachedProducts) {
      this.products = JSON.parse(cachedProducts);
      console.log('使用缓存商品');
    }
  }

  // ========== 静默加载（无加载动画） ==========
  loadBannersSilent() {
    this.http.get<{ success: boolean; data: Banner[] }>(`${this.apiUrl}/banners`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.banners = response.data;
            localStorage.setItem('cachedBanners', JSON.stringify(this.banners));
            console.log('轮播图静默更新成功');
          }
        },
        error: (error) => {
          console.error('轮播图加载失败:', error);
        }
      });
  }

  loadUserFunctionsSilent() {
    this.http.get<{ success: boolean; data: FunctionButton[] }>(`${this.apiUrl}/user/selected-functions`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.functionButtons = response.data;
          this.registerIcons();
          localStorage.setItem('cachedUserFunctions', JSON.stringify(this.functionButtons));
          console.log('用户功能静默更新成功');
        } else {
          this.loadDefaultFunctionsSilent();
        }
      },
      error: (error) => {
        console.error('功能加载失败:', error);
        const stored = localStorage.getItem('cachedUserFunctions');
        if (stored && this.functionButtons.length === 0) {
          this.functionButtons = JSON.parse(stored);
          this.registerIcons();
        } else {
          this.loadDefaultFunctionsSilent();
        }
      }
    });
  }

  loadDefaultFunctionsSilent() {
    this.http.get<{ success: boolean; data: FunctionButton[] }>(`${this.apiUrl}/functions`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.functionButtons = response.data.slice(0, this.maxSelect);
            this.registerIcons();
            localStorage.setItem('cachedUserFunctions', JSON.stringify(this.functionButtons));
          }
        },
        error: (err) => {
          console.error('默认功能加载失败:', err);
        }
      });
  }

  loadAvailableFunctionsSilent() {
    this.http.get<{ success: boolean; data: FunctionButton[] }>(`${this.apiUrl}/functions/available`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableFunctions = response.data;
          console.log('可用功能静默更新成功');
        }
      },
      error: (error) => {
        console.error('可用功能加载失败:', error);
      }
    });
  }

  loadProductsSilent() {
    this.http.get<{ success: boolean; data: Product[] }>(`${this.apiUrl}/products`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.products = response.data;
            localStorage.setItem('cachedProducts', JSON.stringify(this.products));
            console.log('商品静默更新成功');
          }
        },
        error: (error) => {
          console.error('商品加载失败:', error);
        }
      });
  }

  // ========== 保存用户功能到服务器 ==========
  saveUserFunctions() {
    const functionIds = this.functionButtons.map(f => f.id);
    
    this.http.post(`${this.apiUrl}/user/selected-functions`, 
      { function_ids: functionIds },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res: any) => {
        if (res.success) {
          console.log('功能保存成功');
          localStorage.setItem('cachedUserFunctions', JSON.stringify(this.functionButtons));
        } else {
          console.error('保存失败:', res.message);
        }
      },
      error: (error) => {
        console.error('保存失败:', error);
      }
    });
  }

  registerIcons() {
    const iconsToRegister: { [key: string]: any } = {};
    
    this.functionButtons.forEach(func => {
      if (func.icon_type === 'ionicon' && func.icon) {
        const camelCaseName = this.toCamelCase(func.icon);
        if (ionIcons[camelCaseName]) {
          iconsToRegister[func.icon] = ionIcons[camelCaseName];
        }
      }
    });
    
    if (Object.keys(iconsToRegister).length > 0) {
      addIcons(iconsToRegister);
      console.log('已注册图标:', Object.keys(iconsToRegister));
    }
  }

  toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  // 显示添加功能的选择面板
  async showAddFunctionSheet() {
    const selectedIds = this.functionButtons.map(f => f.id);
    const available = this.availableFunctions.filter(f => !selectedIds.includes(f.id));
    
    if (available.length === 0) {
      this.showToast('没有更多可添加的功能', 'warning');
      return;
    }
    
    const buttons = available.map(func => ({
      text: func.name,
      icon: func.icon,
      handler: () => {
        this.addFunction(func);
      }
    }));
    
    buttons.push({
      text: '取消',
      icon: 'close-outline',
      handler: () => {}
    });
    
    const actionSheet = await this.actionSheetController.create({
      header: '选择要添加的功能',
      buttons: buttons,
      mode: 'ios'
    });
    
    await actionSheet.present();
  }

  // 添加功能
  addFunction(func: FunctionButton) {
    if (this.functionButtons.length >= this.maxSelect) {
      this.showToast(`最多只能添加${this.maxSelect}个功能`, 'warning');
      return;
    }
    
    if (!this.functionButtons.find(f => f.id === func.id)) {
      this.functionButtons.push(func);
      this.saveUserFunctions();
      this.registerIcons();
      this.showToast(`已添加 ${func.name}`, 'success');
    }
  }

  // 删除功能
  removeFunction(event: Event, func: FunctionButton) {
    event.stopPropagation();
    const index = this.functionButtons.findIndex(f => f.id === func.id);
    if (index > -1) {
      this.functionButtons.splice(index, 1);
      this.saveUserFunctions();
      this.showToast(`已移除 ${func.name}`, 'success');
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  onSlideChange(event: any) {
    this.currentSlideIndex = event.detail[0].activeIndex;
  }

  checkUnreadMessages() {
    const unreadCount = localStorage.getItem('unreadCount');
    this.hasUnreadMessage = unreadCount ? parseInt(unreadCount) > 0 : false;
  }

  async onSearch() {
    if (this.searchText.trim()) {
      const toast = await this.toastController.create({
        message: `搜索: ${this.searchText}`,
        duration: 1500,
        position: 'bottom'
      });
      await toast.present();
    }
  }

  async openImageSearch() {
    const toast = await this.toastController.create({
      message: '打开图片搜索',
      duration: 1500,
      position: 'bottom'
    });
    await toast.present();
  }

  async openFunction(func: FunctionButton) {
    const toast = await this.toastController.create({
      message: `打开 ${func.name}`,
      duration: 1000,
      position: 'bottom'
    });
    await toast.present();
  }

  viewProduct(product: Product) {
    console.log('点击商品:', product.name);
    this.router.navigate(['/product-detail'], {
      queryParams: { product: JSON.stringify(product) }
    });
  }

  async addToCart(product: Product) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      const alert = await this.alertController.create({
        header: '提示',
        message: '请先登录后再添加购物车',
        buttons: [
          { text: '取消', role: 'cancel' },
          { text: '去登录', handler: () => { window.location.href = '/login'; } }
        ]
      });
      await alert.present();
      return;
    }
    
    const user = JSON.parse(userStr);
    
    this.http.post(`${this.apiUrl}/cart/add`, { 
      user_id: user.id,
      product_id: product.id, 
      quantity: 1 
    }).subscribe({
      next: async (res: any) => {
        if (res.success) {
          const toast = await this.toastController.create({
            message: `已添加 ${product.name} 到购物车`,
            duration: 1500,
            position: 'middle',
            color: 'dark'
          });
          toast.present();
        } else {
          const toast = await this.toastController.create({
            message: res.message || '添加失败',
            duration: 1500,
            position: 'middle',
            color: 'dark'
          });
          toast.present();
        }
      },
      error: async () => {
        const toast = await this.toastController.create({
          message: '添加失败，请重试',
          duration: 1500,
          position: 'middle',
          color: 'dark'
        });
        toast.present();
      }
    });
  }

  showAdminEntry(): boolean {
    const userRole = localStorage.getItem('userRole');
    return userRole === 'admin';
  }

  goToMessages() {
    this.router.navigate(['/messages']);
  }

  goToUser() {
    this.router.navigate(['/user']);
  }

  goToCategory() {
    this.router.navigate(['/category']);
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }
}