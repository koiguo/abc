import { Component, OnInit, inject  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { homeOutline, addCircleOutline, createOutline, trashOutline, cubeOutline, searchOutline } from 'ionicons/icons';
import { ImageCropperService } from '@bitforgehq/angular-ionic-image-cropper';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  providers: [ImageCropperService]
})
export class AdminPage implements OnInit {
  
  products: any[] = [];
  filteredProducts: any[] = [];  // 筛选后的商品
  searchKeyword: string = '';    // 搜索关键词
  isLoading = false;
  showForm = false;
  isEditing = false;
  
  currentProduct: any = { 
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

  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router,
    private imageCropperService: ImageCropperService
  ) {
    addIcons({ 
      homeOutline, 
      addCircleOutline, 
      createOutline, 
      trashOutline, 
      cubeOutline,
      searchOutline
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  // 加载商品列表
  loadProducts() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/products`).subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data;
          this.filteredProducts = [...this.products];  // 复制到筛选列表
        }
        this.isLoading = false;
      },
      error: () => {
        this.showToast('加载失败', 'danger');
        this.isLoading = false;
      }
    });
  }

  // 搜索商品
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

  // ========== 图片选择（拍照/相册）+ 裁剪 ==========
async selectAndCropImage() {
  try {
    // 使用 takeAndCropPhoto 直接拍照并裁剪
    const croppedBlob = await this.imageCropperService.takeAndCropPhoto({
      aspectRatio: 1,
      quality: 0.9,
      outputFormat: 'image/jpeg',
      cancelText: '取消',
      doneText: '完成'
    });
    
    if (croppedBlob) {
      await this.uploadCroppedImage(croppedBlob);
    }
  } catch (error) {
    console.error('取消或失败:', error);
    if (error instanceof Error && error.message !== 'User cancelled photos') {
      this.showToast('操作失败', 'danger');
    }
  }
}

// 裁剪现有图片（针对已有商品图片）
async cropExistingImage() {
  if (!this.currentProduct.image) {
    this.showToast('没有可裁剪的图片', 'warning');
    return;
  }
  
  const loading = await this.loadingController.create({ message: '加载图片中...' });
  await loading.present();
  
  try {
    // openCropper 第一个参数是图片路径（字符串）
    const croppedBlob = await this.imageCropperService.openCropper(
      this.currentProduct.image,  // 直接传 URL 字符串
      {
        aspectRatio: 1,
        quality: 0.7,
        outputFormat: 'image/jpeg',
        cancelText: '取消',
        doneText: '完成'
      }
    );
    
    await loading.dismiss();
    
    if (croppedBlob) {
      await this.uploadCroppedImage(croppedBlob);
    }
  } catch (error) {
    await loading.dismiss();
    console.error('裁剪取消或失败:', error);
    if (error instanceof Error && !error.message.includes('cancel')) {
      this.showToast('裁剪失败', 'danger');
    }
  }
}

// 上传裁剪后的图片
async uploadCroppedImage(blob: Blob) {
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

// ========== 商品管理方法 ==========
  showAddForm() {
    this.isEditing = false;
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
    this.showForm = true;
  }

  editProduct(product: any) {
    this.isEditing = true;
    this.currentProduct = { ...product };
    this.showForm = true;
  }

  async saveProduct() {
    if (!this.currentProduct.name || !this.currentProduct.price) {
      this.showToast('请填写名称和价格', 'warning');
      return;
    }
    
    const loading = await this.loadingController.create({ message: '保存中...' });
    await loading.present();
    
    const url = this.isEditing 
      ? `${this.apiUrl}/products/${this.currentProduct.id}` 
      : `${this.apiUrl}/products/add`;
    const method = this.isEditing ? 'put' : 'post';
    
    this.http[method](url, this.currentProduct).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.showToast(this.isEditing ? '更新成功' : '添加成功', 'success');
          this.showForm = false;
          this.loadProducts();  // 重新加载列表
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