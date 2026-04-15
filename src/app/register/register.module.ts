import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // ← 必须有这一行
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { RegisterPage } from './register.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,      // ← 确保有这一行（支持双向绑定）
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: RegisterPage
      }
    ]),
    RegisterPage
  ],
})
export class RegisterPageModule {}