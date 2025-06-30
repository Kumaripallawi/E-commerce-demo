import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  product = signal<Product | null>(null);
  loading = signal(true);
  selectedImage = signal<string>('');

  quantityForm: FormGroup;

  constructor() {
    this.quantityForm = this.fb.group({
      quantity: [1]
    });
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(+productId);
    }
  }

  loadProduct(id: number): void {
    this.loading.set(true);
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.selectedImage.set(product.images[0] || '');
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.loading.set(false);
        this.router.navigate(['/products']);
      }
    });
  }

  selectImage(image: string): void {
    this.selectedImage.set(image);
  }

  decreaseQuantity(): void {
    const currentQuantity = this.quantityForm.get('quantity')?.value || 1;
    if (currentQuantity > 1) {
      this.quantityForm.patchValue({ quantity: currentQuantity - 1 });
    }
  }

  increaseQuantity(): void {
    const currentQuantity = this.quantityForm.get('quantity')?.value || 1;
    if (currentQuantity < 10) {
      this.quantityForm.patchValue({ quantity: currentQuantity + 1 });
    }
  }

  addToCart(): void {
    if (!this.cartService.isAuthenticated()) {
      this.snackBar.open('Please login to add items to cart', 'Login', { duration: 3000 })
        .onAction().subscribe(() => {
          window.location.href = '/auth/login?returnUrl=' + encodeURIComponent(window.location.pathname);
        });
      return;
    }

    if (this.quantityForm.valid && this.product()) {
      const formValue = this.quantityForm.value;
      const product = this.product()!;

      const success = this.cartService.addToCart(product, formValue.quantity, {});
      
      if (success) {
        this.snackBar.open(
          `${product.title} added to cart!`, 
          '🛒', 
          {
            duration: 2000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          }
        );
      } else {
        this.snackBar.open('Failed to add item to cart', 'Close', { duration: 3000 });
      }
    }
  }

  buyNow(): void {
    this.addToCart();
    this.router.navigate(['/cart']);
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  onImageError(event: any): void {
    event.target.src = 'https://placehold.co/400x300/e0e0e0/666666?text=No+Image';
  }
} 