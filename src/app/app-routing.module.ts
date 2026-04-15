import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // 默认跳转到登录页（改这里）
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // 登录和注册页面（新增）
  { path: 'login', loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule) },
  { path: 'register', loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule) },
  
  // 原有的页面
  { path: 'home', loadChildren: () => import('./home/home.page').then(m => m.HomePage) },
  { path: 'messages', loadChildren: () => import('./messages/messages.page').then(m => m.MessagesPage) },
  { path: 'user', loadChildren: () => import('./user/user.module').then(m => m.UserPageModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }