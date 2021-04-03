import { FlexLayoutModule } from '@angular/flex-layout';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';
import {MatRippleModule} from '@angular/material/core';

@NgModule({
  declarations: [ButtonComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatRippleModule
  ],
  exports: [ButtonComponent]
})
export class SharedModule { }
