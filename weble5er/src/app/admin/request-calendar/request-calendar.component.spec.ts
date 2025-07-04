import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestCalendarComponent } from './request-calendar.component';

describe('RequestCalendarComponent', () => {
  let component: RequestCalendarComponent;
  let fixture: ComponentFixture<RequestCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
