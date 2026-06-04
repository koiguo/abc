import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { homeOutline, addCircleOutline, createOutline, trashOutline, cubeOutline, searchOutline, gridOutline } from 'ionicons/icons';
import { CropperService } from '../services/cropper.service';
import { PriceUnitService } from '../services/price-unit.service';

// ==================== 接口定义 ====================
interface FunctionItem {
  id: number;
  name: string;
  icon: string;
  icon_type?: string;
  sort_order: number;
  is_active: boolean;
}

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url?: string;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  original_price: number | null;
  image: string;
  description: string;
  category: string;
  stock: number;
  is_hot: boolean;
  is_new: boolean;
  sales_count?: number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})

export class AdminPage implements OnInit {
  // ==================== 常量配置 ====================
  private readonly apiUrl = 'https://guoguo.pythonanywhere.com/api';

  // ==================== Tab 切换 ====================
  activeTab: 'products' | 'functions' | 'banners' | 'settings' = 'products';

  // ==================== 商品管理 ====================
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchKeyword: string = '';
  isLoading = false;
  showForm = false;
  isEditing = false;
  
  currentProduct: Product = { 
    id: 0,
    name: '', 
    price: 0, 
    original_price: null,
    image: '',
    description: '',
    category: '',
    stock: 0,
    is_hot: false,
    is_new: false
  };

  // ==================== 功能管理 ====================
  functions: FunctionItem[] = [];
  showFunctionForm = false;
  isEditingFunction = false;
  currentFunction: FunctionItem = {
    id: 0,
    name: '',
    icon: 'apps-outline',
    sort_order: 0,
    is_active: true
  };

  // ==================== 轮播图管理 ====================
  banners: Banner[] = [];
  isLoadingBanners = false;
  showBannerForm = false;
  isEditingBanner = false;
  currentBanner: Banner = {
    id: 0,
    title: '',
    image_url: '',
    link_url: '',
    sort_order: 0,
    is_active: true
  };

  // ==================== 价格单位设置 ====================
  priceUnit: string = '¥';
  priceUnitOptions = [
    { label: '人民币 (¥)', value: '¥' },
    { label: '美元 ($)', value: '$' },
    { label: '欧元 (€)', value: '€' },
    { label: '英镑 (£)', value: '£' },
    { label: '日元 (¥)', value: '¥' },
    { label: '韩元 (₩)', value: '₩' },
    { label: '港元 (HK$)', value: 'HK$' },
    { label: '新台币 (NT$)', value: 'NT$' },
    { label: '自定义', value: 'custom' }
  ];
  customPriceUnit: string = '';
  showCustomUnitInput: boolean = false;

  // ==================== 构造函数 ====================
  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router,
    private cropperService: CropperService,
    private priceUnitService: PriceUnitService
  ) {
    addIcons({ 
      homeOutline, 
      addCircleOutline, 
      createOutline, 
      trashOutline, 
      cubeOutline,
      searchOutline,
      gridOutline
    });
  }

  // ==================== 生命周期 ====================
  ngOnInit() {
    this.loadPriceUnitSettings();
    this.loadAllData();
  }

  // 加载所有数据
  private loadAllData() {
    this.loadProducts();
    this.loadFunctions();
    this.loadBanners();
  }

  // ==================== 价格单位管理 ====================
  private loadPriceUnitSettings() {
    const savedUnit = localStorage.getItem('price_unit');
    const savedCustomUnit = localStorage.getItem('custom_price_unit');
    
    if (savedUnit) {
      this.priceUnit = savedUnit;
      if (this.priceUnit === 'custom' && savedCustomUnit) {
        this.customPriceUnit = savedCustomUnit;
        this.showCustomUnitInput = true;
      }
    }
  }

  savePriceUnit() {
    this.priceUnitService.setPriceUnit(this.priceUnit, this.customPriceUnit);
    this.showToast('价格单位已保存', 'success');
  }

  onPriceUnitChange() {
    if (this.priceUnit === 'custom') {
      this.showCustomUnitInput = true;
    } else {
      this.showCustomUnitInput = false;
      this.customPriceUnit = '';
    }
  }

  getCurrentPriceUnit(): string {
    return this.priceUnitService.getPriceUnit();
  }

  formatPrice(price: number): string {
    return this.priceUnitService.formatPrice(price);
  }

  // ==================== 商品管理 - CRUD ====================
  loadProducts() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/products`).subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data.map((product: any) => ({
            ...product,
            price: parseFloat(product.price) || 0,
            original_price: product.original_price ? parseFloat(product.original_price) : null
          }));
          this.filteredProducts = [...this.products];
        }
        this.isLoading = false;
      },
      error: () => {
        this.showToast('加载失败', 'danger');
        this.isLoading = false;
      }
    });
  }

  filterProducts() {
    const keyword = this.searchKeyword.toLowerCase().trim();
    if (keyword === '') {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(product => 
        product.name.toLowerCase().includes(keyword) ||
        (product.category && product.category.toLowerCase().includes(keyword))
      );
    }
  }

  showAddForm() {
    this.isEditing = false;
    this.resetCurrentProduct();
    this.showForm = true;
  }

  editProduct(product: Product) {
    this.isEditing = true;
    this.currentProduct = { 
      ...product,
      price: product.price ? parseFloat(product.price as any) : 0,
      original_price: product.original_price ? parseFloat(product.original_price as any) : null
    };
    this.showForm = true;
  }

  private resetCurrentProduct() {
    this.currentProduct = { 
      id: 0,
      name: '', 
      price: 0, 
      original_price: null,
      image: '',
      description: '',
      category: '',
      stock: 0,
      is_hot: false,
      is_new: false
    };
  }

  async saveProduct() {
    if (!this.currentProduct.name) {
      this.showToast('请填写商品名称', 'warning');
      return;
    }
    
    if (!this.currentProduct.price || this.currentProduct.price <= 0) {
      this.showToast('请输入有效的价格', 'warning');
      return;
    }
    
    const loading = await this.loadingController.create({ message: '保存中...' });
    await loading.present();
    
    const productData = {
      name: this.currentProduct.name,
      price: parseFloat(this.currentProduct.price as any),
      original_price: this.currentProduct.original_price ? parseFloat(this.currentProduct.original_price as any) : null,
      image: this.currentProduct.image,
      description: this.currentProduct.description,
      category: this.currentProduct.category,
      stock: this.currentProduct.stock || 0,
      is_hot: this.currentProduct.is_hot || false,
      is_new: this.currentProduct.is_new || false
    };
    
    if (this.isEditing) {
      Object.assign(productData, { id: this.currentProduct.id });
    }
    
    const url = this.isEditing 
      ? `${this.apiUrl}/products/${this.currentProduct.id}` 
      : `${this.apiUrl}/products/add`;
    const method = this.isEditing ? 'put' : 'post';
    
    this.http[method](url, productData).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.showToast(this.isEditing ? '更新成功' : '添加成功', 'success');
          this.showForm = false;
          this.loadProducts();
        } else {
          this.showToast(res.message || '操作失败', 'danger');
        }
      },
      error: async () => {
        await loading.dismiss();
        this.showToast('操作失败', 'danger');
      }
    });
  }

  async deleteProduct(id: number) {
    const loading = await this.loadingController.create({ message: '删除中...' });
    await loading.present();
    
    this.http.delete(`${this.apiUrl}/products/${id}`).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.showToast('删除成功', 'success');
          this.loadProducts();
        }
      },
      error: async () => {
        await loading.dismiss();
        this.showToast('删除失败', 'danger');
      }
    });
  }

  cancelForm() {
    this.showForm = false;
  }

  // ==================== 商品管理 - 价格处理 ====================
  onPriceChange(event: any) {
    let value = event.detail.value;
    if (value === null || value === undefined || value === '') {
      this.currentProduct.price = 0;
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        this.currentProduct.price = numValue;
      } else {
        this.currentProduct.price = 0;
      }
    }
  }

  onOriginalPriceChange(event: any) {
    let value = event.detail.value;
    if (value === null || value === undefined || value === '') {
      this.currentProduct.original_price = null;
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        this.currentProduct.original_price = numValue;
      } else {
        this.currentProduct.original_price = null;
      }
    }
  }

  // ==================== 商品管理 - 图片处理 ====================
  async selectAndCropImage() {
    try {
      const croppedBlob = await this.cropperService.cropImage({
        aspectRatio: 1,
        width: 500,
        height: 500,
        quality: 0.9
      });
      
      if (croppedBlob) {
        await this.uploadProductImage(croppedBlob);
      }
    } catch (error) {
      console.error('取消或失败:', error);
      if (error instanceof Error && error.message !== 'User cancelled photos') {
        this.showToast('操作失败', 'danger');
      }
    }
  }

  async cropExistingImage() {
    if (!this.currentProduct.image) {
      this.showToast('没有可裁剪的图片', 'warning');
      return;
    }
    
    const loading = await this.loadingController.create({ message: '加载图片中...' });
    await loading.present();
    
    try {
      const croppedBlob = await this.cropperService.cropExistingImage(
        this.currentProduct.image,
        {
          aspectRatio: 1,
          width: 500,
          height: 500,
          quality: 0.9
        }
      );
      
      await loading.dismiss();
      
      if (croppedBlob) {
        await this.uploadProductImage(croppedBlob);
      }
    } catch (error) {
      await loading.dismiss();
      console.error('裁剪取消或失败:', error);
      if (error instanceof Error && !error.message.includes('cancel')) {
        this.showToast('裁剪失败', 'danger');
      }
    }
  }

  private async uploadProductImage(blob: Blob) {
    const loading = await this.loadingController.create({ 
      message: '上传中...',
      spinner: 'crescent'
    });
    await loading.present();
    
    const formData = new FormData();
    formData.append('image', blob, 'product_' + Date.now() + '.jpg');
    
    this.http.post<{ success: boolean; data: { url: string } }>(`${this.apiUrl}/upload`, formData)
      .subscribe({
        next: async (res) => {
          await loading.dismiss();
          if (res.success && res.data?.url) {
            this.currentProduct.image = res.data.url;
            this.showToast('图片上传成功', 'success');
          } else {
            this.showToast('上传失败', 'danger');
          }
        },
        error: async () => {
          await loading.dismiss();
          this.showToast('上传失败，请重试', 'danger');
        }
      });
  }

  // ==================== 轮播图管理 ====================
  loadBanners() {
    this.isLoadingBanners = true;
    this.http.get<any>(`${this.apiUrl}/admin/banners`).subscribe({
      next: (res) => {
        if (res.success) {
          this.banners = res.data;
          console.log('轮播图加载成功:', this.banners);
        }
        this.isLoadingBanners = false;
      },
      error: () => {
        this.showToast('加载失败', 'danger');
        this.isLoadingBanners = false;
      }
    });
  }

  showAddBannerForm() {
    this.isEditingBanner = false;
    this.currentBanner = {
      id: 0,
      title: '',
      image_url: '',
      link_url: '',
      sort_order: this.banners.length + 1,
      is_active: true
    };
    this.showBannerForm = true;
  }

  editBanner(banner: Banner) {
    this.isEditingBanner = true;
    this.currentBanner = { ...banner };
    this.showBannerForm = true;
  }

  async uploadBannerImage() {
    try {
      const croppedBlob = await this.cropperService.cropImage({
        aspectRatio: 16/9,
        width: 1200,
        height: 675,
        quality: 0.8
      });
      
      if (croppedBlob) {
        await this.uploadBannerImageToServer(croppedBlob);
      }
    } catch (error) {
      console.error('取消或失败:', error);
    }
  }

  private async uploadBannerImageToServer(blob: Blob) {
    const loading = await this.loadingController.create({ message: '上传中...' });
    await loading.present();
    
    const formData = new FormData();
    formData.append('image', blob, 'banner_' + Date.now() + '.jpg');
    
    this.http.post<{ success: boolean; data: { url: string } }>(`${this.apiUrl}/upload`, formData)
      .subscribe({
        next: async (res) => {
          await loading.dismiss();
          if (res.success && res.data?.url) {
            this.currentBanner.image_url = res.data.url;
            this.showToast('图片上传成功', 'success');
          } else {
            this.showToast('上传失败', 'danger');
          }
        },
        error: async () => {
          await loading.dismiss();
          this.showToast('上传失败，请重试', 'danger');
        }
      });
  }

  async saveBanner() {
    if (!this.currentBanner.image_url) {
      this.showToast('请上传图片', 'warning');
      return;
    }
    
    const loading = await this.loadingController.create({ message: '保存中...' });
    await loading.present();
    
    const url = this.isEditingBanner 
      ? `${this.apiUrl}/admin/banners/${this.currentBanner.id}` 
      : `${this.apiUrl}/admin/banners/add`;
    const method = this.isEditingBanner ? 'put' : 'post';
    
    this.http[method](url, this.currentBanner).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.showToast(this.isEditingBanner ? '更新成功' : '添加成功', 'success');
          this.showBannerForm = false;
          this.loadBanners();
        } else {
          this.showToast(res.message || '操作失败', 'danger');
        }
      },
      error: async () => {
        await loading.dismiss();
        this.showToast('操作失败', 'danger');
      }
    });
  }

  async deleteBanner(id: number) {
    const loading = await this.loadingController.create({ message: '删除中...' });
    await loading.present();
    
    this.http.delete(`${this.apiUrl}/admin/banners/${id}`).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.showToast('删除成功', 'success');
          this.loadBanners();
        }
      },
      error: async () => {
        await loading.dismiss();
        this.showToast('删除失败', 'danger');
      }
    });
  }

  cancelBannerForm() {
    this.showBannerForm = false;
  }

  // ==================== 功能管理 ====================
  loadFunctions() {
    this.http.get<any>(`${this.apiUrl}/admin/functions`).subscribe({
      next: (res) => {
        if (res.success) {
          this.functions = res.data;
          console.log('功能列表加载成功:', this.functions);
        }
      },
      error: (err) => {
        console.error('加载功能列表失败:', err);
      }
    });
  }

  showAddFunctionForm() {
    this.isEditingFunction = false;
    this.currentFunction = {
      id: 0,
      name: '',
      icon: 'apps-outline',
      sort_order: this.functions.length + 1,
      is_active: true
    };
    this.showFunctionForm = true;
  }

  editFunction(func: FunctionItem) {
    this.isEditingFunction = true;
    this.currentFunction = { ...func };
    this.showFunctionForm = true;
  }

  async saveFunction() {
    if (!this.currentFunction.name) {
      this.showToast('功能名称不能为空', 'warning');
      return;
    }
    
    const loading = await this.loadingController.create({ message: '保存中...' });
    await loading.present();
    
    const url = this.isEditingFunction 
      ? `${this.apiUrl}/admin/functions/${this.currentFunction.id}` 
      : `${this.apiUrl}/admin/functions/add`;
    const method = this.isEditingFunction ? 'put' : 'post';
    
    this.http[method](url, this.currentFunction).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.showToast(this.isEditingFunction ? '更新成功' : '添加成功', 'success');
          this.showFunctionForm = false;
          this.loadFunctions();
        }
      },
      error: async () => {
        await loading.dismiss();
        this.showToast('操作失败', 'danger');
      }
    });
  }

  async deleteFunction(id: number) {
    const loading = await this.loadingController.create({ message: '删除中...' });
    await loading.present();
    
    this.http.delete(`${this.apiUrl}/admin/functions/${id}`).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.showToast('删除成功', 'success');
          this.loadFunctions();
        }
      },
      error: async () => {
        await loading.dismiss();
        this.showToast('删除失败', 'danger');
      }
    });
  }

  toggleFunctionStatus(func: FunctionItem) {
    func.is_active = !func.is_active;
    this.http.put(`${this.apiUrl}/admin/functions/${func.id}`, func).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToast(func.is_active ? '已启用' : '已禁用', 'success');
        }
      },
      error: () => {
        func.is_active = !func.is_active;
        this.showToast('操作失败', 'danger');
      }
    });
  }

  cancelFunctionForm() {
    this.showFunctionForm = false;
  }

  // ==================== 通用方法 ====================
  goToHome() {
    this.router.navigate(['/home']);
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}