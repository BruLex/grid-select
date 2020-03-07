import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {BitmapService} from './btmap.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatButtonModule, MatSlideToggleModule, MatTooltipModule} from '@angular/material';



const ANGULAR_MATERIAL = [
  MatSlideToggleModule,
  MatButtonModule,
  MatTooltipModule
];


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    ...ANGULAR_MATERIAL,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule
  ],
  providers: [BitmapService],
  bootstrap: [AppComponent]
})
export class AppModule { }
