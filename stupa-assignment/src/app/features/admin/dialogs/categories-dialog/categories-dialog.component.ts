import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog.component';

interface Category {
  id: number;
  name: string;
  image: string;
  creationAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-categories-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './categories-dialog.component.html',
  styleUrl: './categories-dialog.component.scss'
})
export class CategoriesDialogComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CategoriesDialogComponent>);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  categories = signal<Category[]>([]);
  loading = signal(false);
  saving = signal(false);
  editingCategory = signal<Category | null>(null);

  categoryForm: FormGroup;
  displayedColumns: string[] = ['id', 'name', 'image', 'actions'];

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      image: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.http.get<Category[]>('https://api.escuelajs.co/api/v1/categories').subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.showError('Failed to load categories');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.saving.set(true);
      
      const formValue = this.categoryForm.value;
      const categoryData = {
        name: formValue.name,
        image: formValue.image
      };

      const editingCat = this.editingCategory();
      if (editingCat) {
        this.updateCategory(editingCat.id, categoryData);
      } else {
        this.createCategory(categoryData);
      }
    }
  }

  createCategory(categoryData: any): void {
    this.http.post<Category>('https://api.escuelajs.co/api/v1/categories/', categoryData).subscribe({
      next: (newCategory) => {
        this.categories.update(cats => [...cats, newCategory]);
        this.showSuccess('Category created successfully!');
        this.resetForm();
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this.showError('Failed to create category');
        this.saving.set(false);
      }
    });
  }

  updateCategory(categoryId: number, categoryData: any): void {
    this.http.put<Category>(`https://api.escuelajs.co/api/v1/categories/${categoryId}`, categoryData).subscribe({
      next: (updatedCategory) => {
        this.categories.update(cats => 
          cats.map(cat => cat.id === categoryId ? updatedCategory : cat)
        );
        this.showSuccess('Category updated successfully!');
        this.resetForm();
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error updating category:', error);
        this.showError('Failed to update category');
        this.saving.set(false);
      }
    });
  }

  editCategory(category: Category): void {
    this.editingCategory.set(category);
    this.categoryForm.patchValue({
      name: category.name,
      image: category.image
    });
  }

  deleteCategory(category: Category): void {
    const confirmationData: ConfirmationDialogData = {
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${category.name}"? This action cannot be undone and may affect products in this category.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: confirmationData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.performCategoryDelete(category.id);
      }
    });
  }

  private performCategoryDelete(categoryId: number): void {
    this.http.delete(`https://api.escuelajs.co/api/v1/categories/${categoryId}`).subscribe({
      next: () => {
        this.categories.update(cats => cats.filter(cat => cat.id !== categoryId));
        this.showSuccess('Category deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.showError('Failed to delete category');
      }
    });
  }

  resetForm(): void {
    this.categoryForm.reset();
    this.editingCategory.set(null);
  }

  onCancel(): void {
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

  get name() { return this.categoryForm.get('name'); }
  get image() { return this.categoryForm.get('image'); }
} 