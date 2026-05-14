import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,          
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class HomePage implements OnInit {
  // 搜索
  searchText = '';
  hasUnreadMessage = false;  // 有未读消息显示红点
  
  // 当前轮播图索引
  currentSlideIndex = 0;
  
  // 功能按钮（8个）
  functionButtons = [
    { name: '外卖', icon: 'assets/icon/functionButtons/外卖.png' },
    { name: '打车', icon: 'assets/icon/functionButtons/打车.png' },
    { name: '充值', icon: 'assets/icon/functionButtons/充值.png' },
    { name: '快递', icon: 'assets/icon/functionButtons/快递.png' },
    { name: '水电', icon: 'assets/icon/functionButtons/水电.png' },
    { name: '医疗', icon: 'assets/icon/functionButtons/医疗.png' },
    { name: '宠物', icon: 'assets/icon/functionButtons/宠物.png' },
    { name: '更多', icon: 'assets/icon/functionButtons/更多.png' },
  ];
  
  // 产品列表
  products = [];
  
  isLoading = false;

  private apiUrl = 'https://guoguo.pythonanywhere.com/api';// API 地址
  
  constructor(
    private router: Router,
    private toastController: ToastController,
    private http: HttpClient
  ) {}

   ngOnInit() {
    console.log('HomePage ngOnInit - 组件初始化');
    // 在这里放置组件初始化逻辑
    this.checkUnreadMessages();
    // 其他初始化逻辑可以加在这里
    this.loadProducts();
  }

   // ✅ 添加：每次进入页面时检查未读消息
  ionViewWillEnter() {
    console.log('HomePage ionViewWillEnter - 每次进入页面');
    // 每次进入页面时刷新数据
    this.checkUnreadMessages();
    this.loadProducts();
  }
  // 从后端加载商品数据
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
  
  // 轮播图切换事件
  onSlideChange(event: any) {
    this.currentSlideIndex = event.detail[0].activeIndex;
  }

  // ✅ 添加：检查未读消息
  checkUnreadMessages() {
    const unreadCount = localStorage.getItem('unreadCount');
    this.hasUnreadMessage = unreadCount ? parseInt(unreadCount) > 0 : false;
    console.log('未读消息数量:', unreadCount);
  }
  
  // 搜索
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
  
  // 图片搜索
  async openImageSearch() {
    const toast = await this.toastController.create({
      message: '打开图片搜索',
      duration: 1500,
      position: 'bottom'
    });
    await toast.present();
  }
  
  // 打开功能
  async openFunction(func: any) {
    const toast = await this.toastController.create({
      message: `打开 ${func.name}`,
      duration: 1000,
      position: 'bottom'
    });
    await toast.present();
  }
  
  // 查看产品
viewProduct(product: any) {
  console.log('点击商品:', product.name);
  // 将商品数据转为 JSON 字符串，通过 URL 传递
  this.router.navigate(['/product-detail'], {
    queryParams: { product: JSON.stringify(product) }
  });
}

  // 判断是否是管理员
showAdminEntry(): boolean {
  const userRole = localStorage.getItem('userRole');
  return userRole === 'admin';
}
  
  
  // 跳转消息页
  goToMessages() {
    this.router.navigate(['/messages']);
  }
  
  // 跳转用户页
  goToUser() {
    this.router.navigate(['/user']);
  }
  // 跳转分类页
  goToCategory() {
     this.router.navigate(['/category']);
  }
  goToAdmin() {
  this.router.navigate(['/admin']);
}
}