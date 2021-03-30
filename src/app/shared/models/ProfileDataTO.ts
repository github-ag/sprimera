export class ProfileDataTO {
  file: File;
  dragDisabled: boolean;
  isCollapsed: boolean;

  constructor(file: File) {
    this.file = file;
    this.dragDisabled = false;
    this.isCollapsed = true;
  }
}
