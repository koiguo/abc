import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { GestureController, Gesture } from '@ionic/angular';
import * as Hammer from 'hammerjs';

@Component({
  selector: 'app-image-preview-modal',
  templateUrl: './image-preview-modal.component.html',
  styleUrls: ['./image-preview-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ImagePreviewModalComponent implements AfterViewInit, OnDestroy {
  @Input() imageUrl: string = '';
  @ViewChild('previewContainer') previewContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;
  
  private hammerInstance: HammerManager | null = null;
  private leftSwipeGesture: Gesture | undefined;
  
  // 缩放相关变量
  private currentScale: number = 1;
  private currentTranslateX: number = 0;
  private currentTranslateY: number = 0;
  
  constructor(
    private modalController: ModalController,
    private gestureCtrl: GestureController
  ) {}
  
  ngAfterViewInit() {
    this.initPinchAndPanGesture();  // 双指缩放 + 拖拽
    this.initLeftSwipeGesture();     
    document.body.style.overflow = 'hidden';
  }
  
  ngOnDestroy() {
    document.body.style.overflow = '';
    if (this.hammerInstance) {
      this.hammerInstance.destroy();
    }
    if (this.leftSwipeGesture) {
      this.leftSwipeGesture.destroy();
    }
  }
  
  /**
   * 初始化双指缩放和拖拽手势
   */
  private initPinchAndPanGesture() {
    const container = this.previewContainer.nativeElement;
    const img = this.imageElement.nativeElement;
    
    this.hammerInstance = new Hammer.Manager(container);
    
    // 添加手势识别器
    const pinch = new Hammer.Pinch();
    const pan = new Hammer.Pan();
    
    this.hammerInstance.add([pinch, pan]);
    
    // 让双指缩放时也可以拖拽
    pinch.recognizeWith(pan);
    
    let lastScale = 1;
    let lastX = 0;
    let lastY = 0;
    
    // 双指缩放
    this.hammerInstance.on('pinchstart', (e: any) => {
      lastScale = this.currentScale;
      // 缩放时禁用左滑容器的过渡动画
      container.style.transition = 'none';
    });
    
    this.hammerInstance.on('pinchmove', (e: any) => {
      e.preventDefault();
      let newScale = lastScale * e.scale;
      newScale = Math.min(Math.max(newScale, 1), 3); // 限制缩放范围 1-3倍
      this.currentScale = newScale;
      this.updateImageTransform();
    });
    
    this.hammerInstance.on('pinchend', () => {
      container.style.transition = '';
      // 如果缩放恢复为1，重置位置
      if (this.currentScale === 1) {
        this.currentTranslateX = 0;
        this.currentTranslateY = 0;
        this.updateImageTransform();
      }
    });
    
    // 拖拽移动（仅当缩放大于1时）
    this.hammerInstance.on('panstart', (e: any) => {
      if (this.currentScale > 1) {
        lastX = this.currentTranslateX;
        lastY = this.currentTranslateY;
        container.style.transition = 'none';
      }
    });
    
    this.hammerInstance.on('panmove', (e: any) => {
      if (this.currentScale > 1) {
        this.currentTranslateX = lastX + e.deltaX;
        this.currentTranslateY = lastY + e.deltaY;
        this.updateImageTransform();
      }
    });
    
    this.hammerInstance.on('panend', () => {
      container.style.transition = '';
    });
  }
  
  /**
   * 更新图片的 transform 样式
   */
  private updateImageTransform() {
    const img = this.imageElement.nativeElement;
    img.style.transform = `translate(${this.currentTranslateX}px, ${this.currentTranslateY}px) scale(${this.currentScale})`;
  }
  
  /**
   * 初始化左滑退出手势
   */
  private initLeftSwipeGesture() {
    const element = this.previewContainer.nativeElement;
    
    this.leftSwipeGesture = this.gestureCtrl.create({
      el: element,
      direction: 'x',
      gestureName: 'left-swipe',
      threshold: 50,
      onStart: (ev) => {
        // 只有在未缩放时才能左滑退出
        if (this.currentScale === 1) {
          this.isSwiping = true;
          this.swipeStartX = ev.currentX;
          element.style.transition = 'none';
        }
      },
      onMove: (ev) => {
        if (!this.isSwiping) return;
        const deltaX = ev.currentX - this.swipeStartX;
        if (deltaX > 0) {
          const opacity = 1 + deltaX / 300;
          element.style.transform = `translateX(${deltaX}px)`;
          element.style.opacity = Math.max(0, Math.min(1, opacity)).toString();
        }
      },
      onEnd: (ev) => {
        if (!this.isSwiping) {
          this.isSwiping = false;
          return;
        }
        this.isSwiping = false;
        const deltaX = ev.currentX - this.swipeStartX;
        const velocity = ev.velocityX;
        
        if (deltaX < -100 || (deltaX < -50 && velocity > 0.5)) {
          this.dismiss();
        } else {
          element.style.transform = '';
          element.style.opacity = '';
          element.style.transition = '';
        }
      }
    });
    
    this.leftSwipeGesture.enable();
  }
  
  private isSwiping: boolean = false;
  private swipeStartX: number = 0;
  
  /**
   * 点击背景关闭
   */
  onBackgroundClick(event: MouseEvent | TouchEvent) {
    if (event.target === this.previewContainer.nativeElement) {
      this.dismiss();
    }
  }
  
  /**
   * 重置缩放（双击重置）
   */
  onDoubleTap() {
    this.currentScale = 1;
    this.currentTranslateX = 0;
    this.currentTranslateY = 0;
    this.updateImageTransform();
  }
  
  /**
   * 关闭 Modal
   */
  dismiss() {
    this.modalController.dismiss();
  }
}