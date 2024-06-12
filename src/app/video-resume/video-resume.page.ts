import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { Location } from '@angular/common';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-video-resume',
  templateUrl: './video-resume.page.html',
  styleUrls: ['./video-resume.page.scss'],
})
export class VideoResumePage implements OnInit {
  currentcard = 1;
  mediaRecorder: MediaRecorder | null = null;
  recordedBlobs: Blob[] = [];
  isRecording = false;
  stream: MediaStream | null = null;
  _filepath: string | null = null;
  private _storage: Storage | null = null;

  constructor(
    private platform: Platform,
    private location: Location,
    private storage: Storage,
    public router: Router
  ) {
    this.initStorage();
    this.platform.backButton.subscribeWithPriority(10, () => {
      this.stopVideoPlayback(this.getCurrentSection());
      this.goBack();
    });
  }

  ngOnInit() {}

  async initStorage() {
    this._storage = await this.storage.create();
    this.loadVideo(this.getCurrentSection());
  }

  nextClick() {
    this.stopVideoPlayback(this.getCurrentSection());
    this.currentcard++;
    this.loadVideo(this.getCurrentSection());
  }

  prevClick() {
    this.stopVideoPlayback(this.getCurrentSection());
    this.currentcard--;
    this.loadVideo(this.getCurrentSection());
  }

  submitClick() {
    this.router.navigate(['/home']);
  }

  playVideo(section: string) {
    const recordedVideo = document.getElementById(`${section}-recorded`) as HTMLVideoElement;
    if (recordedVideo) {
      recordedVideo.play();
    }
  }

  stopVideo(section: string) {
    const recordedVideo = document.getElementById(`${section}-recorded`) as HTMLVideoElement;
    if (recordedVideo) {
      recordedVideo.pause();
    }
  }

  recordVideo(section: string) {
    this.toggleRecording(section);
  }

  async toggleRecording(section: string) {
    if (this.isRecording) {
      this.stopRecording(section);
    } else {
      await this.startRecording(section);
    }
  }

  async startRecording(section: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        (navigator as any).device.capture.captureVideo(
          (mediaFiles: any) => {
            this._filepath = mediaFiles[0].fullPath;
            this.playRecording(section);
            this.saveVideo(section);
          },
          (error: any) => console.error('Error code:', error),
          { limit: 1, duration: 30, direction: 1 }
        );
      } catch (error) {
        console.error('Error starting recording on mobile:', error);
      }
    } else {
      try {
        this.stream = await this.getUserMedia();
        this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'video/webm; codecs=vp9,opus' });
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) this.recordedBlobs.push(event.data);
        };
        this.mediaRecorder.onstop = () => {
          this.isRecording = false;
          this.playRecording(section);
          this.saveVideo(section);
        };
        this.mediaRecorder.start();
        this.isRecording = true;
        setTimeout(() => this.stopRecording(section), 30000);
      } catch (error) {
        console.error('Error starting recording on web:', error);
      }
    }
  }

  stopRecording(section: string) {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  async getUserMedia(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true },
        video: { width: 300, height: 300 },
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  playRecording(section: string) {
    const recordedVideo = document.getElementById(`${section}-recorded`) as HTMLVideoElement;
    recordedVideo.hidden = false;
    if (Capacitor.isNativePlatform() && this._filepath) {
      recordedVideo.src = Capacitor.convertFileSrc(this._filepath);
    } else {
      const superBuffer = new Blob(this.recordedBlobs, { type: 'video/webm' });
      recordedVideo.src = window.URL.createObjectURL(superBuffer);
    }
    recordedVideo.controls = true;
    recordedVideo.autoplay = true;
    recordedVideo.muted = true;
  }

  stopVideoPlayback(section: string) {
    const recordedVideo = document.getElementById(`${section}-recorded`) as HTMLVideoElement;
    if (recordedVideo) {
      recordedVideo.pause();
    }
  }

  goBack() {
    this.location.back();
  }

  async saveVideo(section: string) {
    if (this.recordedBlobs.length > 0) {
      const superBuffer = new Blob(this.recordedBlobs, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        this._storage?.set(`saved${section}Video`, reader.result);
        this.recordedBlobs = []; // Clear recorded blobs after saving
      };
      reader.readAsDataURL(superBuffer);
    } else if (this._filepath) {
      this._storage?.set(`saved${section}VideoPath`, this._filepath);
    }
  }

  async loadVideo(section: string) {
    const recordedVideo = document.getElementById(`${section}-recorded`) as HTMLVideoElement;
    const savedVideo = await this._storage?.get(`saved${section}Video`);
    const savedVideoPath = await this._storage?.get(`saved${section}VideoPath`);

    if (savedVideo) {
      recordedVideo.src = savedVideo;
      recordedVideo.hidden = false;
      recordedVideo.controls = true;
    } else if (Capacitor.isNativePlatform() && savedVideoPath) {
      recordedVideo.src = Capacitor.convertFileSrc(savedVideoPath);
      recordedVideo.hidden = false;
      recordedVideo.controls = true;
    }
  }

  getCurrentSection(): string {
    switch (this.currentcard) {
      case 2:
        return 'personal';
      case 3:
        return 'education';
      case 4:
        return 'skill';
      case 5:
        return 'extra';
      default:
        return 'introduction';
    }
  }

  ionViewWillLeave() {
    this.stopVideoPlayback(this.getCurrentSection());
  }
}
