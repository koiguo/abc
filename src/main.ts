import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { addIcons } from 'ionicons';
import { 
  mailOutline, chevronForwardOutline, trendingUpOutline, cartOutline, arrowBackOutline, searchOutline, settingsOutline,
  locationOutline, heartOutline, cameraOutline, trashOutline, addOutline, peopleOutline, ticketOutline, bagCheckOutline,
  ellipsisHorizontalOutline, qrCodeOutline, personCircleOutline, lockClosedOutline, callOutline, arrowDownOutline,
  closeOutline, ellipsisVerticalOutline, flagOutline, addCircleOutline, cropOutline, gridOutline, pawOutline,
  closeCircleOutline, waterOutline, fastFoodOutline, medkitOutline, cashOutline, carOutline, cubeOutline,
  personAddOutline, checkmarkOutline, chatbubbleOutline, chatbubblesOutline, happyOutline, micOutline, arrowUpOutline,
  playCircleOutline, keypadOutline, imagesOutline, pauseCircleOutline
} from 'ionicons/icons';

import { defineCustomElements } from '@ionic/pwa-elements/loader';

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
  'heart-outline': heartOutline,
  'camera-outline': cameraOutline,
  'trash-outline': trashOutline,
  'add-outline': addOutline,
  'people-outline': peopleOutline,
  'ticket-outline': ticketOutline,
  'bag-check-outline': bagCheckOutline,
  'ellipsis-horizontal-outline': ellipsisHorizontalOutline,
  'qr-code-outline': qrCodeOutline,
  'person-circle-outline': personCircleOutline,
  'lock-closed-outline': lockClosedOutline,
  'call-outline': callOutline,
  'arrow-down-outline': arrowDownOutline,
  'close-outline': closeOutline,
  'ellipsis-vertical-outline': ellipsisVerticalOutline,
  'flag-outline': flagOutline,
  'add-circle-outline': addCircleOutline,
  'crop-outline': cropOutline,
  'grid-outline': gridOutline,
  'paw-outline': pawOutline,
  'close-circle-outline': closeCircleOutline,
  'water-outline': waterOutline,
  'fast-food-outline': fastFoodOutline,
  'medkit-outline': medkitOutline,
  'cash-outline': cashOutline,
  'car-outline': carOutline,
  'cube-outline': cubeOutline,
  'person-add-outline': personAddOutline,
  'checkmark-outline': checkmarkOutline,
  'chatbubble-outline': chatbubbleOutline,
  'chatbubbles-outline': chatbubblesOutline,
  'happy-outline': happyOutline,
  'mic-outline': micOutline,
  'keyboard-outline': keypadOutline,  // 使用 keypadOutline
  'arrow-up-outline': arrowUpOutline,
  'play-circle-outline': playCircleOutline,
  'pause-circle-outline': pauseCircleOutline,
  'images-outline': imagesOutline
});

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