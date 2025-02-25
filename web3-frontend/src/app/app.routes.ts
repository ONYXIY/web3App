import { Routes } from '@angular/router';
import { MainPageComponent } from './components/main-page/main-page.component';
import {TokenInfoComponent} from './components/token-info/token-info/token-info.component';

export const routes: Routes = [
  { path: '', component: MainPageComponent },
  { path: '**', component: MainPageComponent,
    children: [{path: 'token-info', component: TokenInfoComponent}]
    }
];
