import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class CategoryPage implements OnInit {
  
  // 便民生活分类数据（11个功能）
  convenienceItems = [
    { name: '生活缴费', checked: false },
    { name: '政务服务', checked: false },
    { name: '医疗健康', checked: false },
    { name: '交通出行', checked: false },
    { name: '快递物流', checked: false },
    { name: '教育培训', checked: false },
    { name: '家政服务', checked: false },
    { name: '社区公告', checked: false },
    { name: '物业维修', checked: false },
    { name: '垃圾分类', checked: false },
    { name: '便民热线', checked: false }
  ];

  // 购物娱乐分类数据（9个功能）
  shoppingItems = [
    { name: '超市购物', checked: false },
    { name: '生鲜配送', checked: false },
    { name: '外卖点餐', checked: false },
    { name: '电影票务', checked: false },
    { name: '休闲娱乐', checked: false },
    { name: '酒店预订', checked: false },
    { name: '景点门票', checked: false },
    { name: '优惠券', checked: false },
    { name: '品牌特卖', checked: false }
  ];

  // 理财管理分类数据（9个功能）
  financeItems = [
    { name: '账户总览', checked: false },
    { name: '收支明细', checked: false },
    { name: '预算管理', checked: false },
    { name: '理财产品', checked: false },
    { name: '基金投资', checked: false },
    { name: '信用卡还款', checked: false },
    { name: '转账汇款', checked: false },
    { name: '账单管理', checked: false },
    { name: '积分兑换', checked: false }
  ];

  // 构造函数：注入弹窗和轻提示工具
  constructor(
    private alertController: AlertController,  // 弹窗控制器
    private toastController: ToastController  // 轻提示控制器
  ) {}

  // ✅ 添加 ngOnInit 方法
  ngOnInit() {
    console.log('CategoryPage 初始化');
    // 在这里添加初始化逻辑
    this.loadUserPreferences();  // 加载用户偏好设置
    this.loadSavedSelections();   // 加载之前保存的选择
  }

  // 加载用户偏好设置
  loadUserPreferences() {
    // 从 localStorage 读取用户设置
    const savedSettings = localStorage.getItem('categorySettings');
    if (savedSettings) {
      console.log('加载保存的设置:', savedSettings);
    }
  }

  // 加载之前保存的选择
  loadSavedSelections() {
    // 从 localStorage 读取之前勾选的功能
    const savedConvenience = localStorage.getItem('convenienceSelections');
    const savedShopping = localStorage.getItem('shoppingSelections');
    const savedFinance = localStorage.getItem('financeSelections');
    
    if (savedConvenience) {
      const selectedNames = JSON.parse(savedConvenience);
      this.convenienceItems.forEach(item => {
        item.checked = selectedNames.includes(item.name);
      });
    }
    
    if (savedShopping) {
      const selectedNames = JSON.parse(savedShopping);
      this.shoppingItems.forEach(item => {
        item.checked = selectedNames.includes(item.name);
      });
    }
    
    if (savedFinance) {
      const selectedNames = JSON.parse(savedFinance);
      this.financeItems.forEach(item => {
        item.checked = selectedNames.includes(item.name);
      });
    }
  }

  // 保存选择到 localStorage
  saveSelections() {
    const selectedConvenience = this.convenienceItems.filter(item => item.checked).map(item => item.name);
    const selectedShopping = this.shoppingItems.filter(item => item.checked).map(item => item.name);
    const selectedFinance = this.financeItems.filter(item => item.checked).map(item => item.name);
    
    localStorage.setItem('convenienceSelections', JSON.stringify(selectedConvenience));
    localStorage.setItem('shoppingSelections', JSON.stringify(selectedShopping));
    localStorage.setItem('financeSelections', JSON.stringify(selectedFinance));
    
    console.log('已保存选择');
  }

  goBack() {
    // 返回上一页
    window.history.back();
  }

  // 切换复选框状态,不可少
  toggleCheckbox(item: any) {   
    item.checked = !item.checked;
    this.saveSelections();  // ✅ 每次切换后自动保存
  }

// 查找功能
async openSearch() {
  const alert = await this.alertController.create({
    header: '查找功能',
    message: '请输入您要查找的功能名称',
    inputs: [
      {
        name: 'keyword',
        type: 'text',
        placeholder: '例如：生活缴费、电影票...'
      }
    ],
    buttons: [
      {
        text: '取消',
        role: 'cancel'
      },
      {
        text: '搜索',
        handler: (data) => {
          if (data.keyword && data.keyword.trim()) {
            this.searchFeature(data.keyword.trim());
          } else {
            this.presentToast('请输入搜索关键词');
          }
        }
      }
    ]
  });
  await alert.present();
}

// 搜索功能
searchFeature(keyword: string) {
  const allItems = [
    ...this.convenienceItems.map(item => ({ ...item, category: '便民生活' })),
    ...this.shoppingItems.map(item => ({ ...item, category: '购物娱乐' })),
    ...this.financeItems.map(item => ({ ...item, category: '理财管理' }))
  ];
  
  const results = allItems.filter(item => 
    item.name.includes(keyword)
  );
  
  if (results.length > 0) {
    const resultText = results.map(r => `${r.name} (${r.category})`).join('\n');
    this.showSearchResult(resultText);
  } else {
    this.presentToast(`未找到包含"${keyword}"的功能`);
  }
}

async showSearchResult(text: string) {
  const alert = await this.alertController.create({
    header: '搜索结果',
    message: `找到以下相关功能：\n\n${text}`,
    buttons: ['确定']
  });
  await alert.present();
}

// 设置功能
async openSettings() {
  const alert = await this.alertController.create({
    header: '设置',
    message: '功能分类设置',
    inputs: [
      {
        name: 'showCount',
        type: 'checkbox',
        label: '显示已选中的数量',
        value: 'showCount',
        checked: true
      },
      {
        name: 'autoSave',
        type: 'checkbox', 
        label: '自动保存选择',
        value: 'autoSave',
        checked: true
      }
    ],
    buttons: [
      {
        text: '取消',
        role: 'cancel'
      },
      {
        text: '保存',
        handler: () => {
          this.presentToast('设置已保存');
        }
      }
    ]
  });
  await alert.present();
}

  // 显示提示
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
  // 进入功能详情
async gotoFeature(featureName: string) {
  const alert = await this.alertController.create({
    header: featureName,
    message: `即将进入 ${featureName} 功能`,
    buttons: ['确定']
  });
  await alert.present();
}


}