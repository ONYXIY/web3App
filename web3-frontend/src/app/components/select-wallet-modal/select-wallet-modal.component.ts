import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Web3Service, DetectedWallet } from '../../services/web3/web3.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-select-wallet-modal',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './select-wallet-modal.component.html',
  styleUrls: ['./select-wallet-modal.component.scss']
})
export class SelectWalletModalComponent implements OnInit, OnDestroy {
  @Input() showModal = false;
  @Output() closeModal = new EventEmitter<void>();

  wallets: DetectedWallet[] = [];
  loading = false;
  private sub?: Subscription;

  constructor(private web3: Web3Service) {}

  ngOnInit() {
    this.wallets = this.web3.getAvailableWallets();
  }

  connect(wallet: DetectedWallet) {
    if (!wallet.installed) {
      alert(`${wallet.name} is not installed or not detected!`);
      return;
    }
    this.loading = true;
    this.sub = wallet.connect().subscribe({
      next: (res: string | null) => {
        this.loading = false;
        this.close();
      },
      error: (err: any) => {
        this.loading = false;
      }
    });
  }

  close() {
    this.closeModal.emit();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
