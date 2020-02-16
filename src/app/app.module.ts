import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {PostComponent} from './post/post.component';
import { CanvasAreaComponent } from './canvas-area/canvas-area.component';
import { CanvasTestComponent } from './canvas-test/canvas-test.component';

@NgModule({
  declarations: [
    AppComponent,
    PostComponent,
    CanvasAreaComponent,
    CanvasTestComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
