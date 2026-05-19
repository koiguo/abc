import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline, addOutline, trashOutline, reorderThreeOutline } from 'ionicons/icons';

interface FunctionItem {
  id: number;
  name: string;
  icon: string;
  selected?: boolean;
}

@Component({
  selector: 'app-select-functions',
  templateUrl: './select-functions.page.html',
  styleUrls: ['./select-functions.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SelectFunctionsPage implements OnInit {

  allFunctions: FunctionItem[] = [];      // 管理员添加的所有功能
  selectedFunctions: FunctionItem[] = []; // 用户已选择的功能
  maxSelect = 8;
  isLoading = false;

  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router
  ) {
    addIcons({ closeOutline, checkmarkOutline, addOutline, trashOutline, reorderThreeOutline });
  }

  ngOnInit() {
    this.loadAllFunctions();
    this.loadUserSelectedFunctions();
  }

  // 加载管理员添加的所有功能
  loadAllFunctions() {
    this.http.get<{ success: boolean; data: FunctionItem[] }>(`${this.apiUrl}/functions`)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.allFunctions = res.data;
          }
        },
        error: (err) => {
          console.error('加载功能列表失败:', err);
        }
      });
  }

  // 加载用户已选择的功能
  loadUserSelectedFunctions() {
    this.http.get<{ success: boolean; data: FunctionItem[] }>(`${this.apiUrl}/user/selected-functions`)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.selectedFunctions = res.data;
            // 标记已选中的功能
            const selectedIds = this.selectedFunctions.map(f => f.id);
            this.allFunctions.forEach(f => {
              f.selected = selectedIds.includes(f.id);
            });
          }
        },
        error: (err) => {
          console.error('加载用户选择失败:', err);
        }
      });
  }

  // 切换选择功能
  toggleFunction(func: FunctionItem) {
    const index = this.selectedFunctions.findIndex(f => f.id === func.id);
    
    if (index > -1) {
      // 已选中，取消选择
      this.selectedFunctions.splice(index, 1);
      func.selected = false;
    } else {
      // 未选中，检查是否超过最大数量
      if (this.selectedFunctions.length >= this.maxSelect) {
        this.showToast(`最多只能选择${this.maxSelect}个功能`, 'warning');
        return;
      }
      this.selectedFunctions.push(func);
      func.selected = true;
    }
  }

  // 移除已选中的功能
  removeSelected(func: FunctionItem) {
    const index = this.selectedFunctions.findIndex(f => f.id === func.id);
    if (index > -1) {
      this.selectedFunctions.splice(index, 1);
      const originalFunc = this.allFunctions.find(f => f.id === func.id);
      if (originalFunc) {
        originalFunc.selected = false;
      }
    }
  }

  // 保存用户选择
  async saveSelection() {
    const loading = await this.loadingController.create({ message: '保存中...' });
    await loading.present();

    this.http.post(`${this.apiUrl}/user/selected-functions`, {
      function_ids: this.selectedFunctions.map(f => f.id)
    }).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          this.showToast('保存成功', 'success');
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1000);
        } else {
          this.showToast(res.message || '保存失败', 'danger');
        }
      },
      error: async () => {
        await loading.dismiss();
        this.showToast('保存失败', 'danger');
      }
    });
  }

  goBack() {
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