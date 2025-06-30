import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  creationAt: string;
  updatedAt: string;
}

interface UserDialogData {
  user?: ApiUser;
  isEdit: boolean;
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<UserDialogComponent>);
  
  data = inject(MAT_DIALOG_DATA) as UserDialogData;
  
  userForm: FormGroup;
  submitting = signal(false);

  roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'customer', label: 'Customer' }
  ];

  constructor() {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.data.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
      role: ['customer', Validators.required],
      avatar: ['https://picsum.photos/150/150']
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.user) {
      this.populateForm(this.data.user);
      // Make password optional for edit
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  populateForm(user: ApiUser): void {
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || 'https://picsum.photos/150/150'
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.submitting.set(true);
      
      const formValue = this.userForm.value;
      const userData: any = {
        name: formValue.name,
        email: formValue.email,
        role: formValue.role,
        avatar: formValue.avatar || 'https://picsum.photos/150/150'
      };

      // Only include password if it's provided
      if (formValue.password && formValue.password.trim() !== '') {
        userData.password = formValue.password;
      }

      if (this.data.isEdit && this.data.user) {
        this.updateUser(this.data.user.id, userData);
      } else {
        this.createUser(userData);
      }
    }
  }

  createUser(userData: any): void {
    this.http.post('https://api.escuelajs.co/api/v1/users/', userData).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.submitting.set(false);
      }
    });
  }

  updateUser(userId: number, userData: any): void {
    this.http.put(`https://api.escuelajs.co/api/v1/users/${userId}`, userData).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.submitting.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get name() { return this.userForm.get('name'); }
  get email() { return this.userForm.get('email'); }
  get password() { return this.userForm.get('password'); }
  get role() { return this.userForm.get('role'); }
} 