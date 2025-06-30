import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { CartItem } from '../../core/models/product.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  public cartService = inject(CartService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  cartItems = signal<CartItem[]>([]);
  isAuthenticated$: Observable<boolean>;

  constructor() {
    this.isAuthenticated$ = new Observable(observer => {
      observer.next(this.authService.isAuthenticated());
    });
  }

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems.set(items);
    });
  }

  trackByCartItem(index: number, item: CartItem): string {
    return `${item.product.id}-${JSON.stringify(item.selectedVariants)}`;
  }

  getVariantEntries(variants: { [key: string]: string } | undefined): {key: string, value: string}[] {
    if (!variants) return [];
    return Object.entries(variants).map(([key, value]) => ({ key, value }));
  }

  increaseQuantity(item: CartItem): void {
    if (!this.cartService.isAuthenticated()) {
      this.showLoginRequired();
      return;
    }

    if (item.quantity < 10) {
      this.cartService.updateQuantity(
        item.product.id, 
        item.quantity + 1, 
        item.selectedVariants
      );
    }
  }

  decreaseQuantity(item: CartItem): void {
    if (!this.cartService.isAuthenticated()) {
      this.showLoginRequired();
      return;
    }

    if (item.quantity > 1) {
      this.cartService.updateQuantity(
        item.product.id, 
        item.quantity - 1, 
        item.selectedVariants
      );
    }
  }

  updateQuantity(item: CartItem, event: any): void {
    if (!this.cartService.isAuthenticated()) {
      this.showLoginRequired();
      return;
    }

    const newQuantity = parseInt(event.target.value);
    if (newQuantity > 0 && newQuantity <= 10) {
      this.cartService.updateQuantity(
        item.product.id, 
        newQuantity, 
        item.selectedVariants
      );
    }
  }

  removeItem(item: CartItem): void {
    if (!this.cartService.isAuthenticated()) {
      this.snackBar.open('Please login to manage cart items', 'Login', { duration: 3000 })
        .onAction().subscribe(() => {
          window.location.href = '/auth/login?returnUrl=' + encodeURIComponent(window.location.pathname);
        });
      return;
    }

    const success = this.cartService.removeFromCart(item.product.id, item.selectedVariants);
    if (success) {
      this.snackBar.open(
        `${item.product.title} removed from cart`, 
        'Undo', 
        { duration: 3000 }
      ).onAction().subscribe(() => {
        this.cartService.addToCart(item.product, item.quantity, item.selectedVariants);
      });
    }
  }

  clearCart(): void {
    if (!this.cartService.isAuthenticated()) {
      this.showLoginRequired();
      return;
    }

    const itemsBackup = [...this.cartItems()];
    this.cartService.clearCart();
    
    this.snackBar.open(
      'Cart cleared', 
      'Undo', 
      { duration: 5000 }
    ).onAction().subscribe(() => {
      itemsBackup.forEach(item => {
        this.cartService.addToCart(item.product, item.quantity, item.selectedVariants);
      });
    });
  }

  private showLoginRequired(): void {
    this.snackBar.open('Please login to manage cart items', 'Login', { duration: 3000 })
      .onAction().subscribe(() => {
        window.location.href = '/auth/login?returnUrl=' + encodeURIComponent(window.location.pathname);
      });
  }

  getTotalItems(): number {
    return this.cartItems().reduce((total, item) => total + item.quantity, 0);
  }

  getSubtotal(): number {
    return this.cartItems().reduce((total, item) => 
      total + (item.product.price * item.quantity), 0
    );
  }

  getTax(): number {
    return this.getSubtotal() * 0.085; // 8.5% tax
  }

  getTotal(): number {
    return this.getSubtotal() + this.getTax();
  }

  proceedToCheckout(): void {
    if (this.authService.isAuthenticated()) {
      // Navigate to checkout page
      this.router.navigate(['/checkout']);
    } else {
      this.snackBar.open('Please login to proceed to checkout', 'Login', { duration: 5000 })
        .onAction().subscribe(() => {
          // Navigate to login with return URL
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: '/checkout' }
          });
        });
    }
  }

  onImageError(event: any): void {
    event.target.src = 'https://placehold.co/120x120/e0e0e0/666666?text=No+Image';
  }
} 