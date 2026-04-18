import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule) },
  { path: 'register', loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule) },
  { path: 'home', loadComponent: () => import('./home/home.page').then(m => m.HomePage) },
  { path: 'messages', loadComponent: () => import('./messages/messages.page').then(m => m.MessagesPage) },
  { path: 'user', loadComponent: () => import('./user/user.page').then(m => m.UserPage) },
  {
    path: 'category',
    loadComponent: () => import('./category/category.page').then( m => m.CategoryPage)
  },
  {
    path: 'camera',
    loadComponent: () => import('./camera/camera.page').then( m => m.CameraPage)
  },
  // {
  //   path: 'camera',
  //   loadComponent: () => import('./camera/camera.page').then( m => m.CameraPage)
  // },
];