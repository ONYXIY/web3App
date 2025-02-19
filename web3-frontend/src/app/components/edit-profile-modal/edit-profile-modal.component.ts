// src/app/components/edit-profile-modal/edit-profile-modal.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Web3Service, Web3Profile } from '../../services/web3/web3.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss']
})
export class EditProfileModalComponent implements OnInit {
  @Input() showModal = false;
  @Output() closeModal = new EventEmitter<void>();

  profile: Web3Profile | null = null;
  sub?: Subscription;

  // единая форма
  profileForm = {
    profileName: '',
    telegram: '',
    x: '',
    website: ''
  };

  constructor(private web3: Web3Service) {}

  ngOnInit() {
    this.sub = this.web3.profile$.subscribe(p => {
      this.profile = p;
      if (p?.profileName) {
        this.profileForm.profileName = p.profileName;
      }
    });
  }

  copyAddress() {
    if (this.profile?.address) {
      navigator.clipboard.writeText(this.profile.address);
      console.log('Copied address:', this.profile.address);
    }
  }

  saveChanges() {
    // сохраняем имя
    this.web3.setProfileName(this.profileForm.profileName);
    // telegram, x, website — можно хранить локально или на бэке.
    this.close();
  }

  close() {
    this.closeModal.emit();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
