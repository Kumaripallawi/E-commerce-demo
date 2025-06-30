import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../core/services/product.service';

interface Category {
  id: number;
  name: string;
  image: string;
  creationAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  categories = signal<Category[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getCategories().subscribe({
      next: (categories: Category[]) => {
        console.log('Categories loaded:', categories);
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.error.set('Failed to load categories. Please try again.');
        this.loading.set(false);
        this.snackBar.open('Failed to load categories', 'Close', { duration: 5000 });
      }
    });
  }

  onCategoryClick(category: Category): void {
    // Navigate to products page with category filter
    this.router.navigate(['/products'], { 
      queryParams: { category: category.id }
    });
  }

  onImageError(event: any): void {
    event.target.src = 'https://placehold.co/300x200/f0f0f0/333333?text=Category';
  }

  retry(): void {
    this.loadCategories();
  }
} 