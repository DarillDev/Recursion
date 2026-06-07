import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InternalLayoutComponent } from './internal-layout.component';

describe('InternalLayoutComponent', () => {
  let component: InternalLayoutComponent;
  let fixture: ComponentFixture<InternalLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InternalLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
