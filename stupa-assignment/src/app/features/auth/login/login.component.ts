import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { filter, take } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  hidePassword = signal(true);

  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading.set(true);
      
      const credentials = this.loginForm.value;
      
      this.authService.login(credentials).subscribe({
        next: () => {
          this.loading.set(false);
          
          // Get current user from the service's observable
          this.authService.currentUser$.pipe(
            filter(user => user !== null),
            take(1)
          ).subscribe({
            next: (user) => {
              if (user) {
                const welcomeMessage = `Welcome back, ${user.name}!`;
                this.snackBar.open(welcomeMessage, 'Close', { duration: 3000 });
                
                // Role-based navigation
                if (user.role === UserRole.ADMIN) {
                  // Redirect admin to admin dashboard
                  this.router.navigate(['/products']);
                } else if (user.role === UserRole.CUSTOMER) {
                  // Redirect customer to products page or return URL
                  const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/products';
                  this.router.navigate([returnUrl]);
                } else {
                  // Fallback to products page
                  this.router.navigate(['/products']);
                }
              } else {
                // Fallback if user data is not available
                this.router.navigate(['/products']);
              }
            }
          });
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Login error:', error);
          this.snackBar.open(
            'Login failed. Please check your credentials.', 
            'Close', 
            { duration: 5000 }
          );
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(hide => !hide);
  }

  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'john@mail.com',
      password: 'changeme'
    });
  }

  fillCustomerCredentials(): void {
    this.loginForm.patchValue({
      email: 'john@mail.com',
      password: 'changeme'
    });
  }

  fillAdminCredentials(): void {
    this.loginForm.patchValue({
      email: 'admin@mail.com',
      password: 'admin123'
    });
  }

  onSocialLogin(provider: string): void {
    this.snackBar.open(
      `${provider} login service is not available yet. Please use email login.`,
      'Close',
      { 
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
  }
} 