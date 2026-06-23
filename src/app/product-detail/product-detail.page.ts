import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController, NavController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ProductDetailPage {

  product: any = {};
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private http: HttpClient,
    private alertController: AlertController,
    private navController: NavController
  ) {}

  ionViewWillEnter() {
    console.log('页面每次进入时执行');
    this.loadProductData();
  }

  loadProductData() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.product = navigation.extras.state['product'];
      console.log('从 state 获取商品:', this.product);
    } else {
      this.route.queryParams.subscribe(params => {
        if (params['product']) {
          this.product = JSON.parse(params['product']);
          console.log('从 queryParams 获取商品:', this.product);
        }
      });
    }
  }

  async addToCart() {
  console.log('=== 加入购物车按钮被点击 ===');
  console.log('商品ID:', this.product.id);
  console.log('商品名称:', this.product.name);
  
  const userStr = localStorage.getItem('user');
  console.log('当前用户:', userStr);
  
  if (!userStr) {
    console.log('用户未登录，显示提示弹窗');
    const alert = await this.alertController.create({
      header: '提示',
      message: '请先登录后再添加购物车',
      buttons: [
        {
          text: '取消',
          role: 'cancel',
          handler: () => {
            console.log('用户点击了取消');
          }
        },
        {
          text: '去登录',
          handler: () => {
            window.location.href = '/login';
          }
        }
      ]
    });
    await alert.present();
    return;
  }
  
  const user = JSON.parse(userStr);
  
  console.log('用户已登录，发送添加购物车请求');
  this.http.post(`${this.apiUrl}/cart/add`, { 
    user_id: user.id,          // ✅ 添加用户ID
    product_id: this.product.id, 
    quantity: 1 
  }).subscribe({
    next: async (res: any) => {
      console.log('添加购物车响应:', res);
      if (res.success) {
        const toast = await this.toastController.create({
          message: `已添加 ${this.product.name} 到购物车`,
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
    error: async (error) => {
      console.error('添加购物车错误:', error);
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

  goBack() {
    console.log('返回上一页');
    this.navController.back();
  }
}