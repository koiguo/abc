import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { UserPage } from './user.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,      
    RouterModule.forChild([
      { path: '', component: UserPage }
    ])
  ],
  declarations: [UserPage]
})
export class UserPageModule {}