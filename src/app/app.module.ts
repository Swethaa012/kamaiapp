import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule,HttpClient } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {LangaugeselectorComponent} from './shared/components/langaugeselector/langaugeselector.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { LangaugeService } from './shared/services/langauge.service';
import { IonicStorageModule } from '@ionic/storage-angular';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

@NgModule({
  declarations: [AppComponent,LangaugeselectorComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    IonicStorageModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    }),
    FormsModule,
    CommonModule,
    HttpClientModule,
    AppRoutingModule],
  providers: [
    LangaugeService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent]
})
export class AppModule {}
