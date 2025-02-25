import { Component, OnInit, HostListener } from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-token-info',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './token-info.component.html',
  styleUrls: ['./token-info.component.scss'],
})
export class TokenInfoComponent implements OnInit {
  public showText = false; // Чтобы текст плавно появлялся

  constructor() {}

  ngOnInit(): void {}

  // Слушаем прокрутку, чтобы показать текст, когда блок появляется
  @HostListener('window:scroll', ['$event'])
  onScroll(event: any): void {
    const rect = event.target.documentElement;
    const scrollY = rect.scrollTop;
    const offset = 500; // Порог, на котором начинается анимация появления текста

    if (scrollY > offset && !this.showText) {
      this.showText = true;
    }
  }
}
