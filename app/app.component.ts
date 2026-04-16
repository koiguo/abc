import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, appsOutline, cameraOutline, chatbubblesOutline, personOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule]
})

export class AppComponent {
  
  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) {
    // 注册图标
    addIcons({
      'home-outline': homeOutline,
      'apps-outline': appsOutline,
      'camera-outline': cameraOutline,
      'chatbubbles-outline': chatbubblesOutline,
      'person-outline': personOutline
    });
  }

  // 打开相机或相册选择
  async openCamera() {
    // 移动端使用 Capacitor
    if (Capacitor.isNativePlatform()) {
      await this.showActionSheet();
    } else {
      // PC端使用浏览器相机
      await this.takePhotoWeb();
    }
  }

  // 显示选择菜单（拍照/相册）
  private async showActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: '选择照片',
      buttons: [
        {
          text: '拍照',
          icon: 'camera-outline',
          handler: () => {
            this.takePhotoFromCamera();
          }
        },
        {
          text: '从相册选择',
          icon: 'images-outline',
          handler: () => {
            this.selectFromGallery();
          }
        },
        {
          text: '取消',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  // 从相机拍照
  private async takePhotoFromCamera() {
    try {
      // 检查权限
      const permission = await Camera.checkPermissions();
      if (permission.camera !== 'granted') {
        const result = await Camera.requestPermissions();
        if (result.camera !== 'granted') {
          this.showToast('需要相机权限才能拍照', 'danger');
          return;
        }
      }

      // 拍照
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,      // 允许编辑/裁剪
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: true      // 保存到系统相册
      });

      // 拍照成功
      if (photo.dataUrl) {
        await this.showToast('拍照成功！', 'success');
        
        // 跳转到预览页面显示照片
        this.router.navigate(['/camera'], {
          state: { photo: photo.dataUrl, source: 'camera' }
        });
      }

    } catch (error: any) {
      if (!error.message?.includes('cancel')) {
        console.error('拍照失败:', error);
        this.showToast('拍照失败，请重试', 'danger');
      }
    }
  }

  // 从相册选择
  private async selectFromGallery() {
    try {
      // 检查权限
      const permission = await Camera.checkPermissions();
      if (permission.photos !== 'granted') {
        const result = await Camera.requestPermissions();
        if (result.photos !== 'granted') {
          this.showToast('需要相册权限才能选择照片', 'danger');
          return;
        }
      }

      // 从相册选择照片
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,      // 允许编辑/裁剪
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos  // 从相册选择
      });

      // 选择成功
      if (photo.dataUrl) {
        await this.showToast('照片已选择！', 'success');
        
        // 跳转到预览页面显示照片
        this.router.navigate(['/camera'], {
          state: { photo: photo.dataUrl, source: 'gallery' }
        });
      }

    } catch (error: any) {
      if (!error.message?.includes('cancel')) {
        console.error('选择照片失败:', error);
        this.showToast('选择照片失败，请重试', 'danger');
      }
    }
  }

  // PC端拍照（浏览器）
  private async takePhotoWeb() {
    try {
      // 创建文件选择器
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // 直接打开相机
      
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const photoDataUrl = e.target.result;
            this.showToast('拍照成功！', 'success');
            this.router.navigate(['/camera'], {
              state: { photo: photoDataUrl, source: 'camera' }
            });
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
      
    } catch (error) {
      console.error('PC端拍照失败:', error);
      this.showToast('无法打开相机，请检查权限', 'danger');
    }
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