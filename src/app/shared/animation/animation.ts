import {trigger, animate, transition, style, state, sequence} from '@angular/animations';

export const alertAnimation =
  trigger('alertAnimation', [
    transition('* => void', [
      style({
        transform: 'translateY(0px)',
        opacity: 1
      }),
      animate('0.10s', style({
        transform: 'translateY(-20px)',
        opacity: 0
      }))
    ]),
    transition('void => *', [
      style({
        transform: 'translateY(-20px)',
        opacity: 0
      }),
      animate('0.20s', style({
        transform: 'translateY(0px)',
        opacity: 1
      }))
    ])
  ]);

export const dropAnimation =
  trigger('dropAnimation', [
    state('show', style({
      transform: 'translateY(0px)',
      opacity: 1,
    })),
    transition('* => display', sequence([
      animate('0s', style({
        transform: 'translateY(-20px)',
      })),
      animate('0.15s', style({
        transform: 'translateY(-13px)'
      })),
      animate('0.15s', style({
        transform: 'translateY(0px)'
      })),
      animate('0.15s', style({
        transform: 'translateY(-8px)'
      })),
      animate('0.15s', style({
        transform: 'translateY(0px)'
      })),
      animate('0.15s', style({
        transform: 'translateY(-5px)'
      })), animate('0.15s', style({
        transform: 'translateY(0px)'
      })),
    ]))
  ]);
