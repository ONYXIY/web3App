import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AlertConfig {
  id: number;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  autoClose: boolean;
  duration?: number;
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new BehaviorSubject<AlertConfig | null>(null);
  public alert$ = this.alertSubject.asObservable();
  private alertId = 0;

  showAlert(
    message: string,
    type: 'success' | 'danger' | 'warning' | 'info' = 'info',
    autoClose: boolean = true,
    duration: number = 5000
  ) {
    this.alertId++;
    const alertConfig: AlertConfig = {
      id: this.alertId,
      message,
      type,
      autoClose,
      duration,
      visible: true
    };
    this.alertSubject.next(alertConfig);
  }
}
