import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Renderer2,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-slider-tab',
  standalone: true,
  templateUrl: 'slider-tab.component.html',
  imports: [
    NgForOf
  ],
  styleUrls: ['./slider-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderTabComponent implements AfterViewInit, OnChanges {
  @Input() tabs: { label: string; value: string; disabled?: boolean }[] = [];
  @Input() selectedTab = '';
  @Output() selectedTabChange = new EventEmitter<string>();

  @ViewChild('slider') slider!: ElementRef;
  @ViewChild('tabsHeader') tabsHeader!: ElementRef;

  private selectedIndex = 0;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.updateSelectedIndex();
    this.updateSlider();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedTab'] && !changes['selectedTab'].firstChange) {
      this.updateSelectedIndex();
      this.updateSlider();
    }
  }

  selectTab(value: string, index: number) {
    if (this.tabs[index].disabled) {
      return;
    }

    this.selectedTab = value;
    this.selectedIndex = index;
    this.selectedTabChange.emit(this.selectedTab);

    this.updateSlider();
  }

  updateSelectedIndex() {
    this.selectedIndex = this.tabs.findIndex((tab) => tab.value === this.selectedTab);
    if (this.selectedIndex === -1) {
      this.selectedIndex = 0;
    }
  }

  updateSlider() {
    if (!this.slider) return;

    const width = 100 / this.tabs.length;
    this.renderer.setStyle(this.slider.nativeElement, 'width', `${width}%`);
    this.renderer.setStyle(this.slider.nativeElement, 'left', `${width * this.selectedIndex}%`);
  }
}
