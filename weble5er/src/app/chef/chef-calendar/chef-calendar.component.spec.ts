import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefCalendarComponent } from './chef-calendar.component';

describe('ChefCalendarComponent', () => {
  let component: ChefCalendarComponent;
  let fixture: ComponentFixture<ChefCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChefCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChefCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
