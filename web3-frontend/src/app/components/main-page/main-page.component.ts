import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ApiService } from '../../services/api/api-service';
import { Subject, takeUntil } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { SliderTabComponent } from '../shared/slider-tab/slider-tab/slider-tab.component';
import {TokenInfoComponent} from '../token-info/token-info/token-info.component';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  imports: [
    AsyncPipe,
    SliderTabComponent,
    TokenInfoComponent,
  ],
  standalone: true
})
export class MainPageComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('videoRef') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private frames: ImageData[] = [];
  private destroy$ = new Subject<void>();
  private frameIndex = 0;
  private videoDuration = 30 * 1000;
  private frameCaptureInterval: any;
  private reverseAnimationId: any;
  private forwardAnimationId: any;
  private isReversing = false;
  public readonly ca: string = 'DMTMGwE2QDKipVxyzw31K2fBxhn83qAmgpvtQeSmxEyK'; // потом перенести на бэк или в сервис

  public selectedTab: string = '';
  public mokTabs = [
    { label: 'first tab', value: '1' },
    { label: 'second tab', value: '2' },
    { label: 'third tab', value: '3' },
  ];

  constructor(protected api: ApiService) {}

  ngOnInit() {
    this.api.getRequest().subscribe();
    this.api.data$.pipe(takeUntil(this.destroy$)).subscribe(res => console.log(res));
  }

  ngAfterViewInit() {
    this.initializeVideo();
  }

  async initializeVideo() {
    const videoEl = this.videoRef.nativeElement;
    const canvasEl = this.canvasRef.nativeElement;

    this.ctx = canvasEl.getContext('2d')!;
    videoEl.muted = true;

    videoEl.addEventListener('loadedmetadata', () => {
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      this.videoDuration = videoEl.duration * 1000;
    });

    videoEl.addEventListener('play', () => {
      this.frames = [];
      this.startCapturingFrames();
    });

    videoEl.addEventListener('ended', () => {
      clearInterval(this.frameCaptureInterval);
      this.startReversePlayback();
    });

    try {
      await videoEl.play();
    } catch (err) {
      console.warn('Видео не смогло автоматически запуститься', err);
    }
  }

  startCapturingFrames() {
    const videoEl = this.videoRef.nativeElement;
    const interval = 1000 / 30; // 30 FPS

    this.frameCaptureInterval = setInterval(() => {
      this.ctx.drawImage(videoEl, 0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.frames.push(this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height));
    }, interval);
  }

  startReversePlayback() {
    if (this.frames.length === 0) return;

    this.isReversing = true;
    this.frameIndex = this.frames.length - 1;
    this.videoRef.nativeElement.style.display = 'none';
    this.canvasRef.nativeElement.style.display = 'block';

    const interval = this.videoDuration / this.frames.length;

    const playReverseFrame = () => {
      if (this.frameIndex < 0) {
        cancelAnimationFrame(this.reverseAnimationId);
        this.isReversing = false;
        this.startForwardPlayback();
        return;
      }

      const frame = this.frames[this.frameIndex];
      if (frame) {
        this.ctx.putImageData(frame, 0, 0);
      }

      this.frameIndex--;
      this.reverseAnimationId = setTimeout(playReverseFrame, interval);
    };

    playReverseFrame();
  }

  startForwardPlayback() {
    if (!this.frames.length) return;

    this.frameIndex = 0;
    this.videoRef.nativeElement.style.display = 'none';
    this.canvasRef.nativeElement.style.display = 'block';

    const interval = this.videoDuration / this.frames.length;

    const playForwardFrame = () => {
      if (this.frameIndex >= this.frames.length) {
        cancelAnimationFrame(this.forwardAnimationId);
        this.startReversePlayback();
        return;
      }

      const frame = this.frames[this.frameIndex];
      if (frame) {
        this.ctx.putImageData(frame, 0, 0);
      }

      this.frameIndex++;
      this.forwardAnimationId = setTimeout(playForwardFrame, interval);
    };

    playForwardFrame();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.frameCaptureInterval);
    clearTimeout(this.reverseAnimationId);
    clearTimeout(this.forwardAnimationId);
  }
}
