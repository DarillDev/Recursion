import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ButtonComponent } from './button.component';

@Component({
  imports: [ButtonComponent],
  template: `<ui-kit-button [variant]="variant" [disabled]="disabled" [type]="type">Click</ui-kit-button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  variant: 'primary' | 'secondary' | 'danger' = 'primary';
  disabled = false;
  type: 'button' | 'submit' | 'reset' = 'button';
}

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let btn: HTMLButtonElement;
  let cdr: ChangeDetectorRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    fixture.detectChanges();
    btn = fixture.nativeElement.querySelector('button');
  });

  it('should create', () => {
    expect(btn).toBeTruthy();
  });

  it('should render ng-content text', () => {
    expect(btn.textContent?.trim()).toBe('Click');
  });

  it('should apply default variant "primary"', () => {
    expect(btn.getAttribute('data-variant')).toBe('primary');
  });

  it('should apply secondary variant', () => {
    fixture.componentInstance.variant = 'secondary';
    cdr.markForCheck();
    fixture.detectChanges();
    expect(btn.getAttribute('data-variant')).toBe('secondary');
  });

  it('should apply danger variant', () => {
    fixture.componentInstance.variant = 'danger';
    cdr.markForCheck();
    fixture.detectChanges();
    expect(btn.getAttribute('data-variant')).toBe('danger');
  });

  it('should not be disabled by default', () => {
    expect(btn.disabled).toBe(false);
  });

  it('should set disabled attribute when disabled=true', () => {
    fixture.componentInstance.disabled = true;
    cdr.markForCheck();
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);
  });

  it('should have default type "button"', () => {
    expect(btn.type).toBe('button');
  });

  it('should set type="submit"', () => {
    fixture.componentInstance.type = 'submit';
    cdr.markForCheck();
    fixture.detectChanges();
    expect(btn.type).toBe('submit');
  });
});
