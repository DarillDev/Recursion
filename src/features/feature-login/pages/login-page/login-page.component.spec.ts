import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { LoginPageComponent } from './login-page.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_CONFIG } from '@shared/api/config';
import { AUTH_CONFIG } from 'src/shared/auth';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_CONFIG, useValue: { baseUrl: '' } },
        { provide: AUTH_CONFIG, useValue: { loginUrl: '/front/logon', refreshUrl: '/front/logon/refresh-token' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have loginError null initially', () => {
    expect(component.loginError()).toBeNull();
  });

  it('should set loginError on server error', () => {
    component.setLoginError('Invalid credentials');
    expect(component.loginError()).toBe('Invalid credentials');
  });
});
