import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {

  @Output() clicked = new EventEmitter();

  @Input() labelCss = '';
  @Input() label = '';
  @Input() leftIcon = true;
  @Input() image = '';
  @Input() buttonCss = '';
  @Input() align = 'start center';

  constructor() { }

  ngOnInit(): void {
  }
  callBackHandler(): void {
    this.clicked.emit('');
  }
}
