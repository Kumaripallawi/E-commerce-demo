import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should validate required fields', () => {
    const emailControl = component.loginForm.get('email');
    const passwordControl = component.loginForm.get('password');

    expect(emailControl?.hasError('required')).toBeTruthy();
    expect(passwordControl?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    
    passwordControl?.setValue('123');
    expect(passwordControl?.hasError('minlength')).toBeTruthy();
    
    passwordControl?.setValue('123456');
    expect(passwordControl?.hasError('minlength')).toBeFalsy();
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword()).toBeTruthy();
    
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBeFalsy();
    
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBeTruthy();
  });

  it('should submit valid form', () => {
    const credentials = {
      email: 'john@mail.com',
      password: 'changeme'
    };

    mockAuthService.login.and.returnValue(of({ 
      access_token: 'mock-access-token', 
      refresh_token: 'mock-refresh-token' 
    }));

    component.loginForm.patchValue(credentials);
    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith(credentials);
  });

  it('should handle login error', () => {
    mockAuthService.login.and.returnValue(throwError('Login failed'));

    component.loginForm.patchValue({
      email: 'john@mail.com',
      password: 'wrongpassword'
    });

    component.onSubmit();

    expect(component.loading()).toBeFalsy();
  });

  it('should fill demo credentials', () => {
    component.fillDemoCredentials();

    expect(component.loginForm.get('email')?.value).toBe('john@mail.com');
    expect(component.loginForm.get('password')?.value).toBe('changeme');
  });

  it('should display form fields', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('input[formControlName="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="password"]')).toBeTruthy();
  });

  it('should display login button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const loginButton = compiled.querySelector('.login-button');
    expect(loginButton).toBeTruthy();
    expect(loginButton.textContent).toContain('Sign In');
  });

  it('should disable submit button when form is invalid', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const loginButton = compiled.querySelector('.login-button');
    expect(loginButton.disabled).toBeTruthy();
  });

  it('should show loading spinner when loading', () => {
    component.loading.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('mat-spinner')).toBeTruthy();
  });

  it('should display demo credentials', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('Demo Credentials');
    expect(compiled.textContent).toContain('john@mail.com');
    expect(compiled.textContent).toContain('changeme');
  });

  it('should have use demo credentials button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const demoButton = compiled.querySelector('button[color="accent"]');
    expect(demoButton).toBeTruthy();
    expect(demoButton.textContent).toContain('Use Demo Credentials');
  });
}); 