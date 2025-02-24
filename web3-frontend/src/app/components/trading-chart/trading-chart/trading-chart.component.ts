import {Component, Input, OnInit} from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-trading-chart',
  templateUrl: './trading-chart.component.html',
  styleUrls: ['./trading-chart.component.scss']
})
export class TradingChartComponent implements OnInit {
  @Input() pair: string = 'BTC/USDT';

  constructor() {
  }

  ngOnInit(): void {}

}
