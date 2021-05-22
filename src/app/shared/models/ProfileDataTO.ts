import {Color} from './Color';

export class ProfileDataTO {
  file: File;
  dragDisabled: boolean;
  isCollapsed: boolean;
  color: Color;

  constructor(file: File, color: Color) {
    this.file = file;
    this.dragDisabled = false;
    this.isCollapsed = true;
    this.color = color;
  }

  // setColor(color: string): void {
  //   this.color = color;
  // }
}
