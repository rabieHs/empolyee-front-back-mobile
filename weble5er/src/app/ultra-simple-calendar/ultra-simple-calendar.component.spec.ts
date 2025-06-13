import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UltraSimpleCalendarComponent } from './ultra-simple-calendar.component';

describe('UltraSimpleCalendarComponent', () => {
  let component: UltraSimpleCalendarComponent;
  let fixture: ComponentFixture<UltraSimpleCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UltraSimpleCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UltraSimpleCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
