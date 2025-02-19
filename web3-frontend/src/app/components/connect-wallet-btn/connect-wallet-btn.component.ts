// connect-wallet-btn.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Web3Service, Web3Profile } from '../../services/web3/web3.service';
import { Subscription } from 'rxjs';
import { SelectWalletModalComponent } from '../select-wallet-modal/select-wallet-modal.component';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';

@Component({
  selector: 'app-connect-wallet-btn',
  standalone: true,
  imports: [CommonModule, SelectWalletModalComponent, EditProfileModalComponent],
  templateUrl: './connect-wallet-btn.component.html',
  styleUrls: ['./connect-wallet-btn.component.scss']
})
export class ConnectWalletBtnComponent implements OnInit {
  showWalletModal = false;  // классическая модалка
  showProfileDrawer = false; // боковая панель
  showMenu = false;

  profile: Web3Profile = { address: null, isConnected: false, walletName: null };
  sub?: Subscription;

  constructor(private web3: Web3Service) {}

  ngOnInit() {
    this.sub = this.web3.profile$.subscribe(p => {
      this.profile = p;
    });
  }

  get shortName() {
    if (this.profile.profileName) return this.profile.profileName;
    if (this.profile.address) {
      const start = this.profile.address.slice(0, 5);
      const end = this.profile.address.slice(-3);
      return `${start}...${end}`;
    }
    return 'Connect Wallet';
  }

  openWalletModal() {
    this.showMenu = false;
    this.showWalletModal = true;
  }
  closeWalletModal() {
    this.showWalletModal = false;
  }

  openProfileDrawer() {
    this.showMenu = false;
    this.showProfileDrawer = true;
  }
  closeProfileDrawer() {
    this.showProfileDrawer = false;
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  copyAddress() {
    if (this.profile.address) {
      navigator.clipboard.writeText(this.profile.address);
      console.log('Copied address:', this.profile.address);
    }
    this.showMenu = false;
  }

  disconnect() {
    this.web3.disconnectWallet();
    this.showMenu = false;
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
