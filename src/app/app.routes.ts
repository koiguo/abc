import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home/home.page').then(m => m.HomePage) },
  { path: 'messages', loadComponent: () => import('./messages/messages.page').then(m => m.MessagesPage) },
  { path: 'user', loadComponent: () => import('./user/user.page').then(m => m.UserPage) },
  { path: 'login', loadComponent: () => import('./login/login.page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./register/register.page').then(m => m.RegisterPage) },
  { path: 'category', loadComponent: () => import('./category/category.page').then(m => m.CategoryPage) },
  { path: 'camera', loadComponent: () => import('./camera/camera.page').then(m => m.CameraPage) },
  { path: 'admin', loadComponent: () => import('./admin/admin.page').then( m => m.AdminPage)},
  { path: 'product-detail', loadComponent: () => import('./product-detail/product-detail.page').then( m => m.ProductDetailPage)},
  { path: '**', redirectTo: '/home' }
];
