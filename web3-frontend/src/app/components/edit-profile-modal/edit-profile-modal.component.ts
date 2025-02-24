import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Web3Service, Web3Profile, SolanaTransaction } from '../../services/web3/web3.service';
import { AlertService } from '../../services/alert/alert.service';

// Кастомный слайдер-таб
import { SliderTabComponent } from '../shared/slider-tab/slider-tab/slider-tab.component';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SliderTabComponent],
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
})
export class EditProfileModalComponent implements OnInit, OnDestroy {
  @Input() showModal = false;
  @Output() closeModal = new EventEmitter<void>();

  profile: Web3Profile | null = null;
  private sub?: Subscription;

  activeTab = 'edit';
  transactions: SolanaTransaction[] = [];

  profileForm = {
    profileName: '',
    telegram: '',
    x: '',
    website: '',
  };

  constructor(
    private web3: Web3Service,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Подписываемся на обновления профиля
    this.sub = this.web3.profile$.subscribe((p) => {
      this.profile = p;
      if (p?.profileName) {
        this.profileForm.profileName = p.profileName;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  copyAddress(): void {
    if (this.profile?.address) {
      navigator.clipboard.writeText(this.profile.address);
      this.alertService.showAlert('The address has been copied', 'success', true);
    }
  }

  saveChanges(): void {
    this.web3.setProfileName(this.profileForm.profileName);
    this.alertService.showAlert('The changes are saved', 'success', true);
    this.close();
  }

  close(): void {
    this.closeModal.emit();
  }

  onTabChange(newTab: string): void {
    this.activeTab = newTab;
    if (newTab === 'tx') {
      this.loadTransactions();
    }
  }

  loadTransactions(): void {
    if (!this.profile?.address) {
      this.transactions = [];
      return;
    }
    this.web3.getTransactionsForAddress(this.profile.address, 10).subscribe({
      next: (txArray) => {
        this.transactions = txArray;
      },
      error: () => {
        this.transactions = [];
      },
    });
  }
}
