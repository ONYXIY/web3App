import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../services/api/api-service';
import { AsyncPipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SliderTabComponent } from '../shared/slider-tab/slider-tab/slider-tab.component';

@Component({
  selector: 'app-main-page',
  imports: [
    AsyncPipe,
    SliderTabComponent
  ],
  templateUrl: './main-page.component.html',
  standalone: true,
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  public mokTabs = [
    {label: 'first tab', value: '1'},
    {label: 'second tab', value: '2'},
    {label: 'third tab', value: '3'},
  ]
  public selectedTab = ''

  constructor(protected api: ApiService) {
  }

  ngOnInit() {
    this.api.getRequest().subscribe()
    console.log('test')
    this.api.data$.pipe(takeUntil(this.destroy$)).subscribe(res => console.log(res));
  }



  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


