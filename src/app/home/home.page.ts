import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { RouterModule } from '@angular/router';

register();


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
  products = [
    { name: '智能保温杯', price: '¥89', imageUrl: 'https://picsum.photos/id/20/200/200' },
    { name: '无线耳机', price: '¥199', imageUrl: 'https://picsum.photos/id/1/200/200' },
    { name: '便携充电宝', price: '¥69', imageUrl: 'https://picsum.photos/id/2/200/200' },
    { name: '香薰加湿器', price: '¥129', imageUrl: 'https://picsum.photos/id/3/200/200' },
    { name: '运动手环', price: '¥159', imageUrl: 'https://picsum.photos/id/4/200/200' },
    { name: '护眼台灯', price: '¥99', imageUrl: 'https://picsum.photos/id/5/200/200' }
  ];
  
  isLoading = false;
  
  constructor(
    private router: Router,
    private toastController: ToastController
  ) {}
   ngOnInit() {
    console.log('HomePage ngOnInit - 组件初始化');
    // 在这里放置组件初始化逻辑
    this.checkUnreadMessages();
    // 其他初始化逻辑可以加在这里
  }

   // ✅ 添加：每次进入页面时检查未读消息
  ionViewWillEnter() {
    console.log('HomePage ionViewWillEnter - 每次进入页面');
    // 每次进入页面时刷新数据
    this.checkUnreadMessages();
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
  async viewProduct(product: any) {
    const toast = await this.toastController.create({
      message: `查看 ${product.name}`,
      duration: 1500,
      position: 'bottom'
    });
    await toast.present();
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
}