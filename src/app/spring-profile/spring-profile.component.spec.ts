import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpringProfileComponent } from './spring-profile.component';

describe('SpringProfileComponent', () => {
  let component: SpringProfileComponent;
  let fixture: ComponentFixture<SpringProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpringProfileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpringProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
