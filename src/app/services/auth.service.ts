import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  
  constructor(private http: HttpClient) { }

  private hasToken(): boolean {
    return !!localStorage.getItem('user');
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    console.log('读取的用户信息:', userStr);
    return userStr ? JSON.parse(userStr) : null;
  }
   login(account: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { account, password })
      .pipe(
        tap((response: any) => {
            console.log('登录响应数据:', response);
            if (response && response.success) {
            const userData = {
              id: response.data.user.id,
            name: response.data.user.name,      // 注意字段名
            phone: response.data.user.phone,
            email: response.data.user.email || ''
          };
           console.log('AuthService - 保存到 localStorage:', userData);  // 添加日志
            localStorage.setItem('user', JSON.stringify(userData));
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
  
  // 退出登录
  logout(): void {
    localStorage.removeItem('user');
    this.isLoggedInSubject.next(false);
  }
}