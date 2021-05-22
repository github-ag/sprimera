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
    state('void', style({
      transform: 'translateY(0px)',
      opacity: 1,
    })),
    transition('void => *', sequence([
      animate('0s', style({
        transform: 'translateY(-40px)',
      })),
      animate('0.10s', style({
        transform: 'translateY(-20px)'
      })),
      animate('0.10s', style({
        transform: 'translateY(0px)'
      })),
      animate('0.15s', style({
        transform: 'translateY(-10px)'
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

export const fileAnimation =
  trigger('fileAnimation', [
    transition('void => *', [
      style({
        transform: 'translateX(-20px)',
        opacity: 0
      }),
      animate('0.20s', style({
        transform: 'translateX(0px)',
        opacity: 1
      }))
    ])
  ]);
