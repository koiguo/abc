import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CropperOptions {
  aspectRatio?: number;
  width?: number;
  height?: number;
  quality?: number;
  outputType?: 'image/jpeg' | 'image/png';
}

@Injectable({
  providedIn: 'root'
})
export class CropperService {
  
  private cropperInstance: any = null;
  private modalElement: HTMLDivElement | null = null;

  constructor() {}

  async cropImage(options?: CropperOptions): Promise<Blob | null> {
    const config: CropperOptions = {
      aspectRatio: 1,
      width: 500,
      height: 500,
      quality: 0.9,
      outputType: 'image/jpeg',
      ...options
    };

    try {
      const imagePath = await this.selectImageSource();
      if (!imagePath) return null;
      
      return await this.showCropper(imagePath, config);
    } catch (error) {
      console.error('裁剪图片失败:', error);
      return null;
    }
  }

  async cropExistingImage(imagePath: string, options?: CropperOptions): Promise<Blob | null> {
    const config: CropperOptions = {
      aspectRatio: 1,
      width: 500,
      height: 500,
      quality: 0.9,
      outputType: 'image/jpeg',
      ...options
    };
    
    return await this.showCropper(imagePath, config);
  }

  private async showCropper(imagePath: string, options: CropperOptions): Promise<Blob | null> {
    return new Promise((resolve) => {
      // 创建模态框
      this.modalElement = this.createModal();
      document.body.appendChild(this.modalElement);
      
      // 获取图片元素
      const img = this.modalElement.querySelector('#crop-image') as HTMLImageElement;
      
      // 图片加载完成后初始化 Cropper
      img.onload = () => {
        this.initCropper(img, options, resolve);
      };
      
      img.src = imagePath;
      
      // 如果图片已缓存
      if (img.complete) {
        img.onload(null as any);
      }
    });
  }

  private initCropper(img: HTMLImageElement, options: CropperOptions, resolve: (value: Blob | null) => void) {
    // 动态加载 Cropper.js
    this.loadCropperJS(() => {
      // 确保图片元素有父元素
      if (!img.parentElement) return;
      
      // 销毁旧实例
      if (this.cropperInstance) {
        this.cropperInstance.destroy();
      }
      
      // 创建新实例
      this.cropperInstance = new (window as any).Cropper(img, {
        viewMode: 1,
        dragMode: 'move',
        aspectRatio: options.aspectRatio || 1,
        autoCropArea: 0.8,
        cropBoxMovable: true,
        cropBoxResizable: true,
        movable: true,
        zoomable: true,
        rotatable: true,
        scalable: true,
        zoomOnWheel: true,
        guides: true,
        center: true,
        highlight: true,
        background: true
      });
      
      // 绑定按钮事件
      this.bindEvents(options, resolve);
    });
  }

  private loadCropperJS(callback: () => void) {
    // 如果已经加载
    if ((window as any).Cropper) {
      callback();
      return;
    }
    
    // 加载 CSS
    if (!document.querySelector('#cropper-style')) {
      const link = document.createElement('link');
      link.id = 'cropper-style';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
      document.head.appendChild(link);
    }
    
    // 加载 JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
    script.onload = () => {
      setTimeout(callback, 100);
    };
    document.body.appendChild(script);
  }

  private bindEvents(options: CropperOptions, resolve: (value: Blob | null) => void) {
    if (!this.modalElement) return;
    
    // 放大
    const zoomIn = this.modalElement.querySelector('#btn-zoom-in') as HTMLElement;
    if (zoomIn) {
      zoomIn.onclick = () => this.cropperInstance?.zoom(0.1);
    }
    
    // 缩小
    const zoomOut = this.modalElement.querySelector('#btn-zoom-out') as HTMLElement;
    if (zoomOut) {
      zoomOut.onclick = () => this.cropperInstance?.zoom(-0.1);
    }
    
    // 左旋
    const rotateLeft = this.modalElement.querySelector('#btn-rotate-left') as HTMLElement;
    if (rotateLeft) {
      rotateLeft.onclick = () => this.cropperInstance?.rotate(-90);
    }
    
    // 右旋
    const rotateRight = this.modalElement.querySelector('#btn-rotate-right') as HTMLElement;
    if (rotateRight) {
      rotateRight.onclick = () => this.cropperInstance?.rotate(90);
    }
    
    // 重置
    const reset = this.modalElement.querySelector('#btn-reset') as HTMLElement;
    if (reset) {
      reset.onclick = () => this.cropperInstance?.reset();
    }
    
    // 1:1 比例
    const ratio1 = this.modalElement.querySelector('#btn-ratio-1') as HTMLElement;
    if (ratio1) {
      ratio1.onclick = () => this.cropperInstance?.setAspectRatio(1);
    }
    
    // 16:9 比例
    const ratio169 = this.modalElement.querySelector('#btn-ratio-169') as HTMLElement;
    if (ratio169) {
      ratio169.onclick = () => this.cropperInstance?.setAspectRatio(16/9);
    }
    
    // 确认
    const confirmBtn = this.modalElement.querySelector('#btn-confirm') as HTMLElement;
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        if (this.cropperInstance) {
          const canvas = this.cropperInstance.getCroppedCanvas({
            width: options.width || 500,
            height: options.height || 500,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
          });
          
          if (canvas) {
            canvas.toBlob((blob: Blob | null) => {
              this.destroy();
              resolve(blob);
            }, options.outputType || 'image/jpeg', options.quality || 0.9);
          } else {
            this.destroy();
            resolve(null);
          }
        } else {
          this.destroy();
          resolve(null);
        }
      };
    }
    
    // 取消
    const cancelBtn = this.modalElement.querySelector('#btn-cancel') as HTMLElement;
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        this.destroy();
        resolve(null);
      };
    }
    
    // 关闭
    const closeBtn = this.modalElement.querySelector('#btn-close') as HTMLElement;
    if (closeBtn) {
      closeBtn.onclick = () => {
        this.destroy();
        resolve(null);
      };
    }
  }

  private createModal(): HTMLDivElement {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      z-index: 10000;
      display: flex;
      flex-direction: column;
    `;
    
    // 头部
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      background: #1a1a1a;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #333;
    `;
    
    const title = document.createElement('span');
    title.textContent = '裁剪图片';
    title.style.cssText = 'font-size: 18px; font-weight: 500;';
    
    const closeBtn = document.createElement('button');
    closeBtn.id = 'btn-close';
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0 8px;
    `;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // 图片容器
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      overflow: hidden;
    `;
    
    const img = document.createElement('img');
    img.id = 'crop-image';
    img.style.cssText = 'max-width: 100%; max-height: 100%;';
    imgContainer.appendChild(img);
    
    // 底部按钮
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px;
      background: #1a1a1a;
      border-top: 1px solid #333;
    `;
    
    // 按钮行 1 - 使用按钮元素创建避免 innerHTML 类型问题
    const row1 = document.createElement('div');
    row1.style.cssText = 'display: flex; gap: 12px; margin-bottom: 12px;';
    
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.id = 'btn-zoom-out';
    zoomOutBtn.textContent = '缩小';
    zoomOutBtn.style.cssText = 'flex:1; padding: 10px; background: #444; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;';
    
    const zoomInBtn = document.createElement('button');
    zoomInBtn.id = 'btn-zoom-in';
    zoomInBtn.textContent = '放大';
    zoomInBtn.style.cssText = 'flex:1; padding: 10px; background: #444; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;';
    
    const rotateLeftBtn = document.createElement('button');
    rotateLeftBtn.id = 'btn-rotate-left';
    rotateLeftBtn.textContent = '左旋';
    rotateLeftBtn.style.cssText = 'flex:1; padding: 10px; background: #444; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;';
    
    const rotateRightBtn = document.createElement('button');
    rotateRightBtn.id = 'btn-rotate-right';
    rotateRightBtn.textContent = '右旋';
    rotateRightBtn.style.cssText = 'flex:1; padding: 10px; background: #444; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;';
    
    row1.appendChild(zoomOutBtn);
    row1.appendChild(zoomInBtn);
    row1.appendChild(rotateLeftBtn);
    row1.appendChild(rotateRightBtn);
    
    // 按钮行 2
    const row2 = document.createElement('div');
    row2.style.cssText = 'display: flex; gap: 12px; margin-bottom: 12px;';
    
    const resetBtn = document.createElement('button');
    resetBtn.id = 'btn-reset';
    resetBtn.textContent = '重置';
    resetBtn.style.cssText = 'flex:1; padding: 10px; background: #444; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;';
    
    const ratio1Btn = document.createElement('button');
    ratio1Btn.id = 'btn-ratio-1';
    ratio1Btn.textContent = '1:1';
    ratio1Btn.style.cssText = 'flex:1; padding: 10px; background: #444; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;';
    
    const ratio169Btn = document.createElement('button');
    ratio169Btn.id = 'btn-ratio-169';
    ratio169Btn.textContent = '16:9';
    ratio169Btn.style.cssText = 'flex:1; padding: 10px; background: #444; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;';
    
    row2.appendChild(resetBtn);
    row2.appendChild(ratio1Btn);
    row2.appendChild(ratio169Btn);
    
    // 按钮行 3
    const row3 = document.createElement('div');
    row3.style.cssText = 'display: flex; gap: 12px;';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'btn-confirm';
    confirmBtn.textContent = '确认裁剪';
    confirmBtn.style.cssText = 'flex:1; padding: 12px; background: #3880ff; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer;';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'btn-cancel';
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = 'flex:1; padding: 12px; background: #dc3545; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer;';
    
    row3.appendChild(confirmBtn);
    row3.appendChild(cancelBtn);
    
    footer.appendChild(row1);
    footer.appendChild(row2);
    footer.appendChild(row3);
    
    modal.appendChild(header);
    modal.appendChild(imgContainer);
    modal.appendChild(footer);
    
    return modal;
  }

  private destroy() {
    if (this.cropperInstance) {
      this.cropperInstance.destroy();
      this.cropperInstance = null;
    }
    if (this.modalElement && this.modalElement.parentNode) {
      this.modalElement.parentNode.removeChild(this.modalElement);
      this.modalElement = null;
    }
  }

  private async selectImageSource(): Promise<string | null> {
    return new Promise(async (resolve) => {
      const modal = this.createSourceModal();
      
      modal.cameraBtn.onclick = async () => {
        this.removeModal(modal.element);
        const result = await this.takePhoto();
        resolve(result);
      };
      
      modal.galleryBtn.onclick = async () => {
        this.removeModal(modal.element);
        const result = await this.selectFromGallery();
        resolve(result);
      };
      
      modal.cancelBtn.onclick = () => {
        this.removeModal(modal.element);
        resolve(null);
      };
    });
  }

  private createSourceModal() {
    const modalDiv = document.createElement('div');
    modalDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.6);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      width: 280px;
      text-align: center;
    `;
    
    const title = document.createElement('h3');
    title.textContent = '选择图片来源';
    title.style.cssText = 'margin: 0 0 20px 0; font-size: 18px;';
    
    const cameraBtn = document.createElement('button');
    cameraBtn.textContent = '📷 拍照';
    cameraBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      margin-bottom: 12px;
      background: #3880ff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    `;
    
    const galleryBtn = document.createElement('button');
    galleryBtn.textContent = '🖼️ 从相册选择';
    galleryBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      margin-bottom: 12px;
      background: #3880ff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    `;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      background: #f4f5f8;
      color: #333;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    `;
    
    container.appendChild(title);
    container.appendChild(cameraBtn);
    container.appendChild(galleryBtn);
    container.appendChild(cancelBtn);
    modalDiv.appendChild(container);
    document.body.appendChild(modalDiv);
    
    return { element: modalDiv, cameraBtn, galleryBtn, cancelBtn };
  }

  private async takePhoto(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: false
      });
      return image.webPath || null;
    } catch (error) {
      console.error('拍照失败:', error);
      return null;
    }
  }

  private async selectFromGallery(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        saveToGallery: false
      });
      return image.webPath || null;
    } catch (error) {
      console.error('选择图片失败:', error);
      return null;
    }
  }

  private removeModal(element: HTMLElement) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}