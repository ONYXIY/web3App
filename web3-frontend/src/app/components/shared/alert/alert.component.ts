import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertConfig, AlertService } from '../../../services/alert/alert.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit, OnDestroy {
  alertConfigs: AlertConfig[] = [];
  private subscription!: Subscription;

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    this.subscription = this.alertService.alert$.subscribe(alertConfig => {
      if (alertConfig) {
        this.showNewAlert(alertConfig);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  showNewAlert(alertConfig: AlertConfig) {
    if (this.alertConfigs.length >= 2) {
      this.removeOldestAlert();
    }

    this.alertConfigs.unshift({ ...alertConfig, visible: false });

    setTimeout(() => {
      this.alertConfigs[0].visible = true;
    }, 10);

    if (alertConfig.autoClose) {
      setTimeout(() => {
        this.hideAlert(alertConfig.id);
      }, alertConfig.duration);
    }
  }

  removeOldestAlert() {
    this.alertConfigs[this.alertConfigs.length - 1].visible = false;
    setTimeout(() => {
      this.alertConfigs.pop();
    }, 500);
  }

  hideAlert(id: number) {
    const index = this.alertConfigs.findIndex(alert => alert.id === id);
    if (index !== -1) {
      this.alertConfigs[index].visible = false;
      setTimeout(() => {
        this.alertConfigs.splice(index, 1);
      }, 500);
    }
  }

  closeAlert(id: number) {
    this.hideAlert(id);
  }
}
