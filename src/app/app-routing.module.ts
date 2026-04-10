import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: () => import('./home/home.page').then(m => m.HomePage) },
  { path: 'messages', loadChildren: () => import('./messages/messages.page').then(m => m.MessagesPage) },
  { path: 'user', loadChildren: () => import('./user/user.module').then(m => m.UserPageModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }