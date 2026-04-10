// feature-category-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// import { FeatureCategoryPage } from './category.page';

const routes: Routes = [
  {
    path: '',
    // component: FeatureCategoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeatureCategoryPageRoutingModule {}