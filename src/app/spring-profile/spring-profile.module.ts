import { DragDropModule } from '@angular/cdk/drag-drop';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { SharedModule } from '../shared/shared.module';
import { MatDividerModule } from '@angular/material/divider';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpringProfileComponent } from './spring-profile.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import {MatIconModule} from '@angular/material/icon';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {AutocompleteLibModule} from 'angular-ng-autocomplete';
import {MatSidenavModule} from '@angular/material/sidenav';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@NgModule({
  declarations: [SpringProfileComponent],
  imports: [
    NgbModule,
    CommonModule,
    FlexLayoutModule,
    MatDividerModule,
    MatIconModule,
    SharedModule,
    CodemirrorModule,
    DragDropModule,
    // ColorPickerModule,
    MatCheckboxModule,
    AutocompleteLibModule,
    MatSidenavModule,
    BrowserAnimationsModule
  ],
  exports: [SpringProfileComponent]
})
export class SpringProfileModule { }
