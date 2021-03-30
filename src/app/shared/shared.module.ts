import { FlexLayoutModule } from '@angular/flex-layout';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';



@NgModule({
  declarations: [ButtonComponent],
  imports: [
    CommonModule,
    FlexLayoutModule
  ],
  exports: [ButtonComponent]
})
export class SharedModule { }
