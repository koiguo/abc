import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, ActionSheetController } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import * as ionIcons from 'ionicons/icons';

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
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class HomePage implements OnInit {
  searchText = '';
  hasUnreadMessage = false;
  currentSlideIndex = 0;
  
  // 用户已选择的功能按钮
  functionButtons: FunctionButton[] = [];
  isLoadingFunctions = false;
  
  // 所有可用功能（管理员添加的）
  availableFunctions: FunctionButton[] = [];
  maxSelect = 8;  // 最多可选8个
  
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
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    console.log('HomePage ngOnInit');
    this.checkUnreadMessages();
    this.loadProducts();
    this.loadUserFunctions();
    this.loadAvailableFunctions();
    this.loadBanners();  // 加载轮播图
  }

  ionViewWillEnter() {
    console.log('HomePage ionViewWillEnter');
    this.checkUnreadMessages();
    this.loadProducts();
    this.loadUserFunctions();
    this.loadBanners();  // 刷新轮播图
  }

  // 加载轮播图
  loadBanners() {
    this.isLoadingBanners = true;
    this.http.get<{ success: boolean; data: Banner[] }>(`${this.apiUrl}/banners`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.banners = response.data;
            console.log('轮播图加载成功:', this.banners);
          }
          this.isLoadingBanners = false;
        },
        error: (error) => {
          console.error('轮播图加载失败:', error);
          this.isLoadingBanners = false;
        }
      });
  }

  // 加载用户已选择的功能
  loadUserFunctions() {
    this.isLoadingFunctions = true;
    this.http.get<{ success: boolean; data: FunctionButton[] }>(`${this.apiUrl}/user/selected-functions`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.functionButtons = response.data;
            this.registerIcons();
            console.log('用户功能加载成功:', this.functionButtons);
          } else {
            // 如果没有数据，尝试加载默认功能
            this.loadDefaultFunctions();
          }
          this.isLoadingFunctions = false;
        },
        error: (error) => {
          console.error('功能加载失败:', error);
          this.loadDefaultFunctions();
          this.isLoadingFunctions = false;
        }
      });
  }

  // 加载默认功能（备用）
  loadDefaultFunctions() {
    this.http.get<{ success: boolean; data: FunctionButton[] }>(`${this.apiUrl}/functions`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.functionButtons = response.data.slice(0, this.maxSelect);
            this.registerIcons();
          }
        },
        error: (err) => {
          console.error('默认功能加载失败:', err);
        }
      });
  }

  // 加载所有可用功能（管理员添加的）
  loadAvailableFunctions() {
    this.http.get<{ success: boolean; data: FunctionButton[] }>(`${this.apiUrl}/functions/available`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.availableFunctions = response.data;
            console.log('可用功能加载成功:', this.availableFunctions);
          }
        },
        error: (error) => {
          console.error('可用功能加载失败:', error);
        }
      });
  }

  // 动态注册图标
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
    
    this.functionButtons.push(func);
    this.saveUserFunctions();
    this.registerIcons();
    this.showToast(`已添加 ${func.name}`, 'success');
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

  // 保存用户功能到服务器
  saveUserFunctions() {
    const functionIds = this.functionButtons.map(f => f.id);
    
    this.http.post(`${this.apiUrl}/user/selected-functions`, { function_ids: functionIds })
      .subscribe({
        next: (res: any) => {
          if (!res.success) {
            console.error('保存失败:', res.message);
          }
        },
        error: (error) => {
          console.error('保存失败:', error);
        }
      });
  }

  loadProducts() {
    this.isLoading = true;
    this.http.get<{ success: boolean; data: Product[] }>(`${this.apiUrl}/products`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.products = response.data;
            console.log('商品加载成功:', this.products);
          } else {
            console.error('商品加载失败:', response);
            this.showToast('商品加载失败', 'danger');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('网络错误:', error);
          this.showToast('网络错误，请稍后重试', 'danger');
          this.isLoading = false;
        }
      });
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