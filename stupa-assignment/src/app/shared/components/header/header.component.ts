import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ThemeService } from '../../../core/services/theme.service';
import { User, UserRole } from '../../../core/models/user.model';
import { CartItem } from '../../../core/models/product.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatListModule,
    MatTooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @ViewChild('cartMenuTrigger') cartMenuTrigger!: MatMenuTrigger;
  
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  cartItemsCount$: Observable<number> = this.cartService.getCartItemsCount();
  cartItems$: Observable<CartItem[]> = this.cartService.cartItems$;
  
  // Theme observables
  currentTheme = this.themeService.currentTheme;
  isDarkMode = this.themeService.isDark;
  
  // Role-based observables
  isAdmin$: Observable<boolean> = this.authService.isAdmin();
  isCustomer$: Observable<boolean> = this.authService.isCustomer();
  
  // Get first 5 cart items for dropdown
  displayCartItems$: Observable<CartItem[]> = this.cartItems$.pipe(
    map(items => items.slice(0, 5))
  );
  
  // Check if there are more than 5 items
  hasMoreItems$: Observable<boolean> = this.cartItems$.pipe(
    map(items => items.length > 5)
  );
  
  // Get count of remaining items
  remainingItemsCount$: Observable<number> = this.cartItems$.pipe(
    map(items => Math.max(0, items.length - 5))
  );

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
  }
  
  viewCart(): void {
    // Close the dropdown menu
    if (this.cartMenuTrigger) {
      this.cartMenuTrigger.closeMenu();
    }
    // Navigate to cart page
    this.router.navigate(['/cart']);
  }
  
  navigateToAdmin(): void {
    this.router.navigate(['/admin']);
  }
  
  onImageError(event: any): void {
    event.target.src = 'https://placehold.co/40x40/e0e0e0/666666?text=No+Image';
  }
} 