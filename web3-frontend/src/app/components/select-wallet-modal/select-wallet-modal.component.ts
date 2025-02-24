import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Subscription } from 'rxjs';

import { Web3Service, DetectedWallet } from '../../services/web3/web3.service';
import { AlertService } from '../../services/alert/alert.service';

@Component({
  selector: 'app-select-wallet-modal',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './select-wallet-modal.component.html',
  styleUrls: ['./select-wallet-modal.component.scss'],
})
export class SelectWalletModalComponent implements OnInit, OnDestroy {
  @Input() showModal = false;
  @Output() closeModal = new EventEmitter<void>();

  wallets: DetectedWallet[] = [];
  loading = false;
  private sub?: Subscription;

  constructor(
    private web3: Web3Service,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    // Получаем список
    this.wallets = this.web3.getAvailableWallets();
  }

  connect(wallet: DetectedWallet) {
    if (!wallet.installed) {
      this.alertService.showAlert(`${wallet.name} is not installed or not detected!`, 'warning', true);
      return;
    }

    this.loading = true;
    console.log(`[SelectWalletModal] Connecting to ${wallet.name}...`);

    this.sub = wallet.connect().subscribe({
      next: (res: string | null) => {
        console.log('[SelectWalletModal] connect => result:', res);
        this.loading = false;
        this.alertService.showAlert('The wallet has been successfully connected', 'success', true);
        this.close();
      },
      error: (err: any) => {
        console.error('[SelectWalletModal] connect => error:', err);
        this.loading = false;
        this.alertService.showAlert('Something went wrong during wallet connect', 'warning', true);
      },
    });
  }

  close() {
    this.closeModal.emit();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
