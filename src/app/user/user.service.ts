import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  getUserInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user-info`);
  }

  getFunctions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getfunctions`);
  }

  getQRCode(): Observable<any> {
    return this.http.get(`${this.apiUrl}/qrcode`);
  }
}