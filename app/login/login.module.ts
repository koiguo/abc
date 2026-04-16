import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // ← 必须有这一行
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { LoginPage } from './login.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,      // ← 确保有这一行（支持双向绑定）
    IonicModule,
    LoginPage,
    RouterModule.forChild([
      {
        path: '',
        component: LoginPage
      }
    ]),
   LoginPage
  ],
})
export class LoginPageModule {}