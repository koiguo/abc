import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { cartOutline, trashOutline, addOutline, removeOutline, arrowBackOutline } from 'ionicons/icons';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CartPage implements OnInit {
  
  cartItems: CartItem[] = [];
  total: number = 0;
  isLoading = false;
  
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router
  ) {
    addIcons({ cartOutline, trashOutline, addOutline, removeOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.loadCart();
  }

  ionViewWillEnter() {
    this.loadCart();
  }

  // ✅ 修改：加载购物车时传递 user_id
  loadCart() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('用户未登录');
      this.cartItems = [];
      this.total = 0;
      return;
    }
    
    const user = JSON.parse(userStr);
    console.log('加载购物车，用户ID:', user.id);
    
    this.isLoading = true;
    this.http.get<{ success: boolean; data: CartItem[]; total: number }>(
      `${this.apiUrl}/cart?user_id=${user.id}`
    ).subscribe({
      next: (res) => {
        console.log('购物车响应:', res);
        if (res.success) {
          this.cartItems = res.data || [];
          this.total = typeof res.total === 'number' ? res.total : Number(res.total) || 0;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('加载购物车失败:', err);
        this.showToast('加载失败', 'danger');
        this.isLoading = false;
      }
    });
  }

  // ✅ 修改：更新数量时传递 user_id
  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      this.removeItem(item);
      return;
    }
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    
    this.http.put(`${this.apiUrl}/cart/update`, { 
      user_id: user.id,
      cart_id: item.id, 
      quantity: newQuantity 
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          item.quantity = newQuantity;
          this.calculateTotal();
        } else {
          this.showToast(res.message || '更新失败', 'danger');
        }
      },
      error: () => {
        this.showToast('更新失败', 'danger');
      }
    });
  }

  // ✅ 修改：删除商品时传递 user_id
  removeItem(item: CartItem) {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    
    this.http.delete(`${this.apiUrl}/cart/remove`, { 
      body: { user_id: user.id, cart_id: item.id } 
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          const index = this.cartItems.indexOf(item);
          this.cartItems.splice(index, 1);
          this.calculateTotal();
          this.showToast('已删除', 'success');
        } else {
          this.showToast('删除失败', 'danger');
        }
      },
      error: () => {
        this.showToast('删除失败', 'danger');
      }
    });
  }

  calculateTotal() {
    let sum = 0;
    for (const item of this.cartItems) {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
      sum += price * quantity;
    }
    this.total = sum;
  }

  async checkout() {
    if (this.cartItems.length === 0) {
      this.showToast('购物车是空的', 'warning');
      return;
    }
    this.showToast(`共 ${this.cartItems.length} 件商品，总计 ¥${this.total.toFixed(2)}`, 'primary');
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
  goToUser() {
    this.router.navigate(['./user'])
  }
}