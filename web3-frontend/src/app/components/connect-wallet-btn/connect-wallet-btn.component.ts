import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { Web3Service, Web3Profile } from '../../services/web3/web3.service';
import { SelectWalletModalComponent } from '../select-wallet-modal/select-wallet-modal.component';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';

@Component({
  selector: 'app-connect-wallet-btn',
  standalone: true,
  imports: [CommonModule, SelectWalletModalComponent, EditProfileModalComponent],
  templateUrl: './connect-wallet-btn.component.html',
  styleUrls: ['./connect-wallet-btn.component.scss'],
})
export class ConnectWalletBtnComponent implements OnInit, OnDestroy {
  /** Модалка выбора кошелька */
  showWalletModal = false;

  /** Флаг «панель профиля открыта» */
  showProfileDrawer = false;

  /** Меню (Copy Address / Edit Profile / Disconnect) */
  showMenu = false;

  /** Профиль от Web3Service (адрес, имя, баланс) */
  profile: Web3Profile = {
    address: null,
    isConnected: false,
    walletName: null,
  };

  private sub?: Subscription;

  constructor(private web3: Web3Service) {}

  ngOnInit(): void {
    this.sub = this.web3.profile$.subscribe((p) => {
      this.profile = p;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get shortName(): string {
    if (this.profile.profileName) return this.profile.profileName;
    if (this.profile.address) {
      const start = this.profile.address.slice(0, 5);
      const end = this.profile.address.slice(-3);
      return `${start}...${end}`;
    }
    return 'Connect Wallet';
  }

  openWalletModal(): void {
    this.showMenu = false;
    this.showWalletModal = true;
  }

  closeWalletModal(): void {
    this.showWalletModal = false;
  }

  openProfileDrawer(): void {
    this.showMenu = false;
    this.showProfileDrawer = true;

    document.body.classList.add('no-scroll');
  }

  closeProfileDrawer(): void {
    this.showProfileDrawer = false;

    document.body.classList.remove('no-scroll');
  }

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  copyAddress(): void {
    if (this.profile.address) {
      navigator.clipboard.writeText(this.profile.address);
      console.log('Copied address:', this.profile.address);
    }
    this.showMenu = false;
  }

  disconnect(): void {
    this.web3.disconnectWallet();
    this.showMenu = false;
  }
}
