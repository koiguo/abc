import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // 后端地址
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(private http: HttpClient) { }

  // 获取用户信息
  getUserInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user-info`);
  }

  // 获取功能列表（从后端动态加载）
  getFunctions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/functions`);
  }

  // 获取用户已选择的功能
  getUserSelectedFunctions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/selected-functions`);
  }

  // 保存用户选择的功能
  saveSelectedFunctions(functionIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/selected-functions`, { function_ids: functionIds });
  }

  // 更新头像
 uploadAvatar(formData: FormData): Observable<{ success: boolean; data: { url: string } }> {
    return this.http.post<{ success: boolean; data: { url: string } }>(
      `${this.apiUrl}/upload/avatar`, 
      formData
    );
  }

  //保存头像URL到用户信息
  saveAvatarUrl(userId: number, avatarUrl: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/avatar`, { user_id: userId, avatar_url: avatarUrl });
  }

  // 获取二维码（如果后端有）
  getQRCode(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/qrcode`);
  }
}