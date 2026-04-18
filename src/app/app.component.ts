import { Component } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, appsOutline, cameraOutline, chatbubblesOutline, personOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { ToastController, AlertController, ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule]
})

export class AppComponent {
  // 控制底部导航栏的显示/隐藏
  showTabs = false;

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

    // 监听路由变化，控制导航栏显示/隐藏
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const currentUrl = event.urlAfterRedirects;
        // 在登录页和注册页隐藏导航栏，其他页面显示
        this.showTabs = !(currentUrl.includes('/login') || currentUrl.includes('/register'));
        console.log('当前路由:', currentUrl, '显示导航栏:', this.showTabs);
      }
    });
  }

  // ========== 页面跳转方法 ==========
  goToHome() {
    this.router.navigate(['/home']);
  }

  goToCategory() {
    this.router.navigate(['/category']);
  }

  goToMessages() {
    this.router.navigate(['/messages']);
  }

  goToUser() {
    this.router.navigate(['/user']);
  }

  // ========== 相机功能（你原有的代码，保持不变）==========
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
      const permission = await Camera.checkPermissions();
      if (permission.camera !== 'granted') {
        const result = await Camera.requestPermissions();
        if (result.camera !== 'granted') {
          this.showToast('需要相机权限才能拍照', 'danger');
          return;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: true
      });

      if (photo.dataUrl) {
        await this.showToast('拍照成功！', 'success');
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
      const permission = await Camera.checkPermissions();
      if (permission.photos !== 'granted') {
        const result = await Camera.requestPermissions();
        if (result.photos !== 'granted') {
          this.showToast('需要相册权限才能选择照片', 'danger');
          return;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      if (photo.dataUrl) {
        await this.showToast('照片已选择！', 'success');
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
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
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