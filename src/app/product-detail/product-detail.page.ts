import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ProductDetailPage {

  product: any = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController
  ) {}

  ionViewWillEnter() {
    console.log('页面每次进入时执行');
    this.loadProductData();
  }

  loadProductData() {
    // 获取路由传递的数据
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.product = navigation.extras.state['product'];
      console.log('从 state 获取商品:', this.product);
    } else {
      // 备用方案：从 queryParams 获取
      this.route.queryParams.subscribe(params => {
        if (params['product']) {
          this.product = JSON.parse(params['product']);
          console.log('从 queryParams 获取商品:', this.product);
        }
      });
    }
  }

  async addToCart() {
    const toast = await this.toastController.create({
      message: `已添加 ${this.product.name} 到购物车`,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    toast.present();
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}