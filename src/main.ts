import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { addIcons } from 'ionicons';
import { 
  mailOutline, chevronForwardOutline,trendingUpOutline,cartOutline,arrowBackOutline,searchOutline,settingsOutline,
  locationOutline,heartOutline,cameraOutline,trashOutline,addOutline,peopleOutline,ticketOutline,bagCheckOutline,ellipsisHorizontalOutline,
  qrCodeOutline,personCircleOutline,lockClosedOutline,callOutline,arrowDownOutline,closeOutline,sendOutline,ellipsisVerticalOutline,flagOutline,
  
} from 'ionicons/icons';


// ========== 新增：导入 PWA Elements ==========
import { defineCustomElements } from '@ionic/pwa-elements/loader';


// ========== 新增：在应用启动前注册 Web 组件 ==========
// 这行代码必须在 bootstrapApplication 之前执行
defineCustomElements(window);

addIcons({
  'mail-outline': mailOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'trending-up-outline': trendingUpOutline,
  'cart-outline': cartOutline,
  'arrow-back-outline': arrowBackOutline,
  'search-outline': searchOutline,
  'settings-outline': settingsOutline,
  'location-outline': locationOutline,
  'heart-outline':heartOutline,
  'camera-outline':cameraOutline,
  'trash-outline':trashOutline,
  'add-outline':addOutline,
  'people-outline':peopleOutline,
  'ticket-outline':ticketOutline,
  'bag-check-outline':bagCheckOutline,
  'ellipsis-horizontal-outline':ellipsisHorizontalOutline,
  'qr-code-outline':qrCodeOutline,
  'person-circle-outline':personCircleOutline,
  'lock-closed-outline':lockClosedOutline,
  'call-outline':callOutline,
  'arrow-down-outline':arrowDownOutline,
  'close-outline':closeOutline,
  'send-outline':sendOutline,
  'ellipsis-vertical-outline':ellipsisVerticalOutline,
  'flag-outline':flagOutline,
})

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
        provideIonicAngular({
      mode: 'md',
      innerHTMLTemplatesEnabled: true
    }),
    provideHttpClient()
  ]
}).catch(err => console.error(err));