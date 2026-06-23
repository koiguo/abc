// message.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'https://guoguo.pythonanywhere.com/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getMessages(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages/${userId}`, {
      headers: this.getHeaders()
    });
  }

  sendMessage(toUserId: number, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-message`, {
      toUserId,
      content
    }, {
      headers: this.getHeaders()
    });
  }
}