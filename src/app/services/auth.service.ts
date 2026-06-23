import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private currentUserSubject = new BehaviorSubject<any>(null);
  
  constructor(private http: HttpClient) {
    // 初始化时加载用户数据
    this.loadUserFromStorage();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('user') && !!localStorage.getItem('auth_token');
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  get currentUser$(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  // 从本地存储加载用户数据
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        console.log('AuthService - 从存储加载用户:', user);
      } catch (e) {
        console.error('解析用户数据失败:', e);
        this.currentUserSubject.next(null);
      }
    } else {
      this.currentUserSubject.next(null);
    }
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    console.log('读取的用户信息:', userStr);
    return userStr ? JSON.parse(userStr) : null;
  }

  // 获取当前用户（响应式）
  getCurrentUser$(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  // ✅ 获取认证 token（用户ID）
  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

login(account: string, password: string): Observable<any> {
  return this.http.post(`https://guoguo.pythonanywhere.com/api/login`, { account, password })
    .pipe(
      tap((response: any) => {
        console.log('登录响应数据:', response);
        if (response && response.success) {
          const userData = {
            id: response.data.user.id,
            name: response.data.user.name,
            phone: response.data.user.phone,
            email: response.data.user.email || '',
            avatar: response.data.user.avatar || null
          };
          
          // ✅ 保存 auth_token
          localStorage.setItem('auth_token', response.data.user.id.toString());
          localStorage.setItem('user', JSON.stringify(userData));
          
          this.currentUserSubject.next(userData);
          this.isLoggedInSubject.next(true);
        }
      })
    );
}
  
  // 注册
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }
  
  // 获取用户信息
  getUserInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user-info`);
  }
  
  // 获取功能列表
  getFunctions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getfunctions`);
  }
  
  // 更新用户头像
  updateUserAvatar(avatarUrl: string): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      currentUser.avatar = avatarUrl;
      localStorage.setItem('user', JSON.stringify(currentUser));
      this.currentUserSubject.next(currentUser);
      console.log('AuthService - 头像已更新:', avatarUrl);
    }
  }

  // 更新用户信息
  updateUserInfo(userData: any): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
      console.log('AuthService - 用户信息已更新:', updatedUser);
    }
  }
  
  // 退出登录
  logout(): void {
    // ✅ 清除所有用户数据
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('unreadCount');
    localStorage.removeItem('pendingRequestCount');
    localStorage.removeItem('contacts');
    
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  
  }

  // 从服务器刷新用户信息
  refreshUserInfo(): Observable<any> {
    const user = this.getCurrentUser();
    if (!user || !user.id) {
      return new Observable(observer => observer.next(null));
    }
    
    return this.http.get(`${this.apiUrl}/users/${user.id}`).pipe(
      tap((response: any) => {
        if (response && response.success && response.data) {
          const userData = response.data;
          const updatedUser = {
            id: userData.id,
            name: userData.name,
            phone: userData.phone,
            email: userData.email || '',
            avatar: userData.avatar || null
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
          console.log('AuthService - 用户信息已从服务器刷新:', updatedUser);
        }
      })
    );
  }
}