import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonImg,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonImg,
    IonButton,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonFab,
    IonFabButton,
    CommonModule,
    FormsModule
  ]
})
export class CameraPage implements OnInit {

  // 存储拍好的照片
  capturedPhoto: string | null = null;  

  constructor(
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { photo?: string; source?: string };
    
    if (state?.photo) {
      this.capturedPhoto = state.photo;
      console.log('接收到照片:', state.source);
      this.showToast('照片已加载', 'success');
    }
  }

  // 拍照按钮点击事件
  async takePhoto() {
    try {
      // 检查相机权限
      const permission = await Camera.checkPermissions();
      if (permission.camera !== 'granted') {
        const result = await Camera.requestPermissions();
        if (result.camera !== 'granted') {
          this.showToast('需要相机权限才能拍照', 'danger');
          return;
        }
      }

      // 打开相机拍照
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false
      });

      // 拍照成功，保存照片
      if (photo.dataUrl) {
        this.capturedPhoto = photo.dataUrl;
        this.showToast('拍照成功！', 'success');
      }

    } catch (error: any) {
      if (!error.message?.includes('cancel')) {
        console.error('拍照失败:', error);
        this.showToast('拍照失败，请重试', 'danger');
      }
    }
  }

  // 相册按钮点击事件
  async selectFromGallery() {
    try {
      // 打开相册选择照片
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos  // 从相册选择
      });

      // 选择成功，保存照片
      if (photo.dataUrl) {
        this.capturedPhoto = photo.dataUrl;
        this.showToast('已从相册选择', 'success');
      }

    } catch (error: any) {
      if (!error.message?.includes('cancel')) {
        console.error('选择照片失败:', error);
        this.showToast('选择照片失败', 'danger');
      }
    }
  }

  // 确认使用照片
  confirmPhoto() {
    if (this.capturedPhoto) {
      // 跳转到搜索结果页面
      this.router.navigate(['/search-result'], {
        state: { photo: this.capturedPhoto }
      });
    } else {
      this.showToast('请先拍照或选择照片', 'warning');
    }
  }

  // 重新选择照片
  resetPhoto() {
    this.capturedPhoto = null;
  }

  // 显示提示消息
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}