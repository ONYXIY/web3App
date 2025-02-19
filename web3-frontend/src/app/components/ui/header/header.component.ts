import { Component, HostListener } from '@angular/core';
import { ConnectWalletBtnComponent } from '../../connect-wallet-btn/connect-wallet-btn.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ConnectWalletBtnComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  public scrolled: boolean = false;

  @HostListener('window:scroll')
  onScroll() {
    const scrollY = window.scrollY;
    this.scrolled = scrollY > 20;
  }
}
