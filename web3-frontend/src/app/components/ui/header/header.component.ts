import { Component, HostListener } from '@angular/core';
import { ConnectWalletBtnComponent } from '../../connect-wallet-btn/connect-wallet-btn.component';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ConnectWalletBtnComponent, MatButton],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  public scrolled: boolean = false;

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 20;
  }

  openBuyNow() {
    window.open('https://gmgn.ai/sol/token/DMTMGwE2QDKipVxyzw31K2fBxhn83qAmgpvtQeSmxEyK', '_blank');
  }
}
