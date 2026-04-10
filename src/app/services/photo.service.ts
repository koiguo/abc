import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  dataUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: UserPhoto[] = [];
  
  // PC 端相关变量
  private webStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private modalElement: HTMLElement | null = null;

  constructor() {}

  /**
   * 统一拍照接口 - 自动适配 PC 和移动端
   */
  async takePhoto(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      // 移动端：使用 Capacitor 相机
      await this.takePhotoMobile();
    } else {
      // PC 端：使用浏览器相机
      await this.takePhotoWeb();
    }
  }

  /**
   * 移动端拍照
   */
  private async takePhotoMobile(): Promise<void> {
    try {
      // 拍照
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: false
      });

      // 保存照片
      const fileName = new Date().getTime() + '.jpeg';
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: await this.readAsBase64(photo),
        directory: Directory.Data
      });

      // 添加到照片列表
      this.photos.unshift({
        filepath: fileName,
        webviewPath: photo.webPath
      });

    } catch (error) {
      console.error('移动端拍照失败:', error);
      throw error;
    }
  }

  /**
   * PC 端拍照（使用浏览器相机）
   */
  private async takePhotoWeb(): Promise<void> {
    try {
      // 创建相机预览模态框
      await this.createCameraModal();
      
    } catch (error) {
      console.error('PC端拍照失败:', error);
      alert('无法打开相机，请检查权限设置');
    }
  }

  /**
   * 创建相机预览模态框
   */
  private async createCameraModal(): Promise<void> {
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    // 创建视频元素
    const video = document.createElement('video');
    video.style.width = '100%';
    video.style.maxHeight = '70vh';
    video.style.objectFit = 'cover';
    video.style.borderRadius = '10px';
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '20px';

    // 拍照按钮
    const captureBtn = document.createElement('button');
    captureBtn.innerHTML = '拍照';
    captureBtn.style.padding = '12px 24px';
    captureBtn.style.fontSize = '18px';
    captureBtn.style.backgroundColor = '#ffffff';
    captureBtn.style.color = 'black';
    captureBtn.style.border = 'none';
    captureBtn.style.borderRadius = '5px';
    captureBtn.style.cursor = 'pointer';

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '关闭';
    closeBtn.style.padding = '12px 24px';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.backgroundColor = '#ffffff';
    closeBtn.style.color = 'black';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '5px';
    closeBtn.style.cursor = 'pointer';

    buttonContainer.appendChild(captureBtn);
    buttonContainer.appendChild(closeBtn);
    modal.appendChild(video);
    modal.appendChild(buttonContainer);
    document.body.appendChild(modal);

    // 打开相机
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      video.srcObject = stream;
      await video.play();
      this.webStream = stream;
      this.videoElement = video;
      this.modalElement = modal;

      // 拍照按钮事件
      captureBtn.onclick = () => {
        this.captureFromVideo(video);
        this.closeWebCamera();
      };

      // 关闭按钮事件
      closeBtn.onclick = () => {
        this.closeWebCamera();
      };

    } catch (err) {
      console.error('无法打开相机:', err);
      alert('无法访问相机，请检查权限设置');
      document.body.removeChild(modal);
    }
  }

  /**
   * 从视频流截图
   */
  private captureFromVideo(video: HTMLVideoElement): void {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 转换为 DataURL
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // 添加到照片列表
      this.photos.unshift({
        filepath: Date.now().toString(),
        webviewPath: photoDataUrl,
        dataUrl: photoDataUrl
      });
      
      console.log('拍照成功！');
    }
  }

  /**
   * 关闭 PC 端相机
   */
  private closeWebCamera(): void {
    if (this.webStream) {
      this.webStream.getTracks().forEach(track => track.stop());
      this.webStream = null;
    }
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    this.videoElement = null;
  }

  /**
   * 移动端辅助方法：读取照片为 Base64
   */
  private async readAsBase64(photo: any): Promise<string> {
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    return await this.convertBlobToBase64(blob) as string;
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 删除照片
   */
  async deletePhoto(photo: UserPhoto): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Filesystem.deleteFile({
        path: photo.filepath,
        directory: Directory.Data
      });
    }
    
    const index = this.photos.indexOf(photo);
    if (index > -1) {
      this.photos.splice(index, 1);
    }
  }
}