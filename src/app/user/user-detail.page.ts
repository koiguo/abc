import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController, NavController, LoadingController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { CropperService } from '../services/cropper.service';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.page.html',
  styleUrls: ['./user-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class UserDetailPage implements OnInit {
  // 基本信息
  avatar: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  username: string = '';
  phone: string = '';
  email: string = '';
  userId: string = '';
  
  // 编辑字段
  editName: string = '';
  editEmail: string = '';
  editGender: string = '';
  editBirthday: string = '';
  editBio: string = '';
  hasChanges: boolean = false;
  
  // 原始数据备份（用于判断是否有修改）
  private originalData: any = {};
  
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private toastController: ToastController,
    private alertController: AlertController,
    private navController: NavController,
    private loadingController: LoadingController,
    private cropperService: CropperService
  ) {}

  ngOnInit() {
    this.loadUserInfo();
  }

  ionViewWillEnter() {
    this.loadUserInfo();
  }

  // 加载用户信息
  loadUserInfo() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.avatar = user.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg';
      this.username = user.name || user.username || '';
      this.phone = user.phone || '';
      this.email = user.email || '';
      this.userId = user.id || '';
      
      this.editName = this.username;
      this.editEmail = this.email;
      this.editGender = user.gender || 'secret';
      this.editBirthday = user.birthday || '';
      this.editBio = user.bio || '';
      
      // 保存原始数据备份
      this.originalData = {
        name: this.username,
        email: this.email,
        gender: user.gender || 'secret',
        birthday: user.birthday || '',
        bio: user.bio || ''
      };
    }
  }

  // 获取请求头
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // 表单变化
  onFormChange() {
    this.hasChanges = 
      this.editName !== this.originalData.name || 
      this.editEmail !== this.originalData.email ||
      this.editGender !== this.originalData.gender ||
      this.editBirthday !== this.originalData.birthday ||
      this.editBio !== this.originalData.bio;
  }

  // 保存个人资料
  async saveProfile() {
    if (!this.editName.trim()) {
      this.showToast('昵称不能为空', 'warning');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const updates: any = {};
    
    if (this.editName !== this.originalData.name) updates.name = this.editName.trim();
    if (this.editEmail !== this.originalData.email) updates.email = this.editEmail;
    if (this.editGender !== this.originalData.gender) updates.gender = this.editGender;
    if (this.editBirthday !== this.originalData.birthday) updates.birthday = this.editBirthday;
    if (this.editBio !== this.originalData.bio) updates.bio = this.editBio;

    if (Object.keys(updates).length === 0) {
      this.showToast('没有修改内容', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: '保存中...'
    });
    await loading.present();

    this.http.put(`${this.apiUrl}/user/profile`, updates, {
      headers: this.getHeaders()
    }).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          // 更新本地存储
          const updatedUser = { ...this.authService.getCurrentUser(), ...updates };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          this.authService['currentUserSubject'].next(updatedUser);
          
          // 更新当前显示的属性
          this.username = this.editName;
          this.email = this.editEmail;
          
          // 更新原始数据备份
          this.originalData = {
            name: this.editName,
            email: this.editEmail,
            gender: this.editGender,
            birthday: this.editBirthday,
            bio: this.editBio
          };
          
          this.hasChanges = false;
          this.showToast('保存成功', 'success');
          
          // 通知其他页面更新
          window.dispatchEvent(new CustomEvent('userInfoUpdated', { 
            detail: { user: updatedUser } 
          }));
        } else {
          this.showToast(res.message || '保存失败', 'danger');
        }
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('保存失败', err);
        this.showToast('保存失败，请重试', 'danger');
      }
    });
  }

  // 返回上一页（带保存提示）
  async goBack() {
    // 检查是否有未保存的修改
    if (this.hasChanges) {
      const alert = await this.alertController.create({
        header: '提示',
        message: '您有未保存的修改，是否保存？',
        buttons: [
          {
            text: '不保存',
            role: 'destructive',
            handler: () => {
              // 直接返回，不保存
              this.navController.back();
            }
          },
          {
            text: '保存',
            handler: async () => {
              // 先保存，再返回
              await this.saveProfile();
              this.navController.back();
            }
          }
        ]
      });
      await alert.present();
    } else {
      // 没有修改，直接返回
      this.navController.back();
    }
  }

  // 修改头像
  async changeAvatar() {
    try {
      const croppedBlob = await this.cropperService.cropImage({
        aspectRatio: 1,
        width: 500,
        height: 500,
        quality: 0.9
      });
      
      if (croppedBlob) {
        await this.uploadImage(croppedBlob);
      }
    } catch (error) {
      console.error('裁剪失败:', error);
      this.showToast('裁剪失败，请重试', 'danger');
    }
  }

  // 上传图片
  async uploadImage(blob: Blob) {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    const loading = await this.loadingController.create({
      message: '上传中...'
    });
    await loading.present();
    
    try {
      const formData = new FormData();
      formData.append('avatar', blob, `avatar_${user.id}_${Date.now()}.jpg`);
      
      this.userService.uploadAvatar(formData).subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          if (res.success && res.data?.url) {
            this.avatar = res.data.url;
            
            // 更新本地存储
            const updatedUser = { ...user, avatar: res.data.url };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.authService['currentUserSubject'].next(updatedUser);
            
            // 保存到数据库
            this.userService.saveAvatarUrl(user.id, res.data.url).subscribe({
              next: () => {
                this.showToast('头像更新成功', 'success');
              },
              error: (err) => {
                console.error('保存到数据库失败:', err);
              }
            });
          } else {
            this.showToast(res.message || '上传失败', 'danger');
          }
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('上传失败:', err);
          this.showToast('上传失败，请重试', 'danger');
        }
      });
    } catch (error) {
      await loading.dismiss();
      this.showToast('处理图片失败', 'danger');
    }
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}