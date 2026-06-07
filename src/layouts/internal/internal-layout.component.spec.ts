import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternalLayoutComponent } from './internal-layout.component';

describe('InternalLayoutComponent', () => {
  let component: InternalLayoutComponent;
  let fixture: ComponentFixture<InternalLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InternalLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
