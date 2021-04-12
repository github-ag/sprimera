export class ProfileDataTO {
  file: File;
  dragDisabled: boolean;
  isCollapsed: boolean;
  // color: string;

  constructor(file: File) {
    this.file = file;
    this.dragDisabled = false;
    this.isCollapsed = true;
    // this.color = '#ffffff00';
  }

  // setColor(color: string): void {
  //   this.color = color;
  // }
}
