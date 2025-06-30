import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemeService } from '../../../../core/services/theme.service';

interface AppSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  currency: string;
  timeZone: string;
  language: string;
  enableNotifications: boolean;
  enableAnalytics: boolean;
  maintenanceMode: boolean;
  autoBackup: boolean;
  maxFileSize: number;
  allowGuestCheckout: boolean;
  requireEmailVerification: boolean;
  enableReviews: boolean;
  enableWishlist: boolean;
}

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss'
})
export class SettingsDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SettingsDialogComponent>);
  private snackBar = inject(MatSnackBar);
  themeService = inject(ThemeService);

  generalForm: FormGroup;
  ecommerceForm: FormGroup;
  systemForm: FormGroup;
  
  saving = signal(false);
  
  currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' }
  ];

  timeZones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' }
  ];

  languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'zh', label: 'Chinese' }
  ];

  fileSizeOptions = [
    { value: 1, label: '1 MB' },
    { value: 5, label: '5 MB' },
    { value: 10, label: '10 MB' },
    { value: 25, label: '25 MB' },
    { value: 50, label: '50 MB' },
    { value: 100, label: '100 MB' }
  ];

  constructor() {
    this.generalForm = this.fb.group({
      siteName: ['E-Commerce Store', [Validators.required, Validators.minLength(3)]],
      siteDescription: ['Your one-stop shop for everything', [Validators.required]],
      adminEmail: ['admin@example.com', [Validators.required, Validators.email]],
      currency: ['USD', Validators.required],
      timeZone: ['UTC', Validators.required],
      language: ['en', Validators.required]
    });

    this.ecommerceForm = this.fb.group({
      allowGuestCheckout: [true],
      requireEmailVerification: [false],
      enableReviews: [true],
      enableWishlist: [true]
    });

    this.systemForm = this.fb.group({
      enableNotifications: [true],
      enableAnalytics: [true],
      maintenanceMode: [false],
      autoBackup: [true],
      maxFileSize: [10, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings: AppSettings = JSON.parse(savedSettings);
      this.populateForms(settings);
    }
  }

  populateForms(settings: AppSettings): void {
    this.generalForm.patchValue({
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      adminEmail: settings.adminEmail,
      currency: settings.currency,
      timeZone: settings.timeZone,
      language: settings.language
    });

    this.ecommerceForm.patchValue({
      allowGuestCheckout: settings.allowGuestCheckout,
      requireEmailVerification: settings.requireEmailVerification,
      enableReviews: settings.enableReviews,
      enableWishlist: settings.enableWishlist
    });

    this.systemForm.patchValue({
      enableNotifications: settings.enableNotifications,
      enableAnalytics: settings.enableAnalytics,
      maintenanceMode: settings.maintenanceMode,
      autoBackup: settings.autoBackup,
      maxFileSize: settings.maxFileSize
    });
  }

  onSave(): void {
    if (this.generalForm.valid && this.systemForm.valid) {
      this.saving.set(true);

      const settings: AppSettings = {
        ...this.generalForm.value,
        ...this.ecommerceForm.value,
        ...this.systemForm.value
      };

      // Simulate API call
      setTimeout(() => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        this.saving.set(false);
        this.showSuccess('Settings saved successfully!');
      }, 1000);
    } else {
      this.showError('Please fix the errors in the form');
    }
  }

  onReset(): void {
    this.generalForm.reset();
    this.ecommerceForm.reset();
    this.systemForm.reset();
    this.loadSettings();
    this.showSuccess('Settings reset to saved values');
  }

  onRestoreDefaults(): void {
    const defaultSettings: AppSettings = {
      siteName: 'E-Commerce Store',
      siteDescription: 'Your one-stop shop for everything',
      adminEmail: 'admin@example.com',
      currency: 'USD',
      timeZone: 'UTC',
      language: 'en',
      enableNotifications: true,
      enableAnalytics: true,
      maintenanceMode: false,
      autoBackup: true,
      maxFileSize: 10,
      allowGuestCheckout: true,
      requireEmailVerification: false,
      enableReviews: true,
      enableWishlist: true
    };

    this.populateForms(defaultSettings);
    this.showSuccess('Settings restored to defaults');
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.showSuccess(`Switched to ${this.themeService.isDark() ? 'dark' : 'light'} theme`);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Form getters
  get siteName() { return this.generalForm.get('siteName'); }
  get siteDescription() { return this.generalForm.get('siteDescription'); }
  get adminEmail() { return this.generalForm.get('adminEmail'); }
  get maxFileSize() { return this.systemForm.get('maxFileSize'); }
} 