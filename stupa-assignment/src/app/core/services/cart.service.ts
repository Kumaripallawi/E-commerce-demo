import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { CartItem, Product } from '../models/product.model';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY_PREFIX = 'shopping_cart_user_';
  private authService = inject(AuthService);
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();
  private authSubscription?: Subscription;
  private currentUserId: string | null = null;

  constructor() {
    this.initializeCart();
  }

  private initializeCart(): void {
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id.toString();
        this.loadCartFromStorage();
      } else {
        this.currentUserId = null;
        this.cartItemsSubject.next([]);
      }
    });
  }

  private getCartKey(): string | null {
    if (!this.currentUserId) return null;
    return `${this.CART_KEY_PREFIX}${this.currentUserId}`;
  }

  private loadCartFromStorage(): void {
    const cartKey = this.getCartKey();
    if (!cartKey) {
      this.cartItemsSubject.next([]);
      return;
    }

    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        this.cartItemsSubject.next(cartItems);
      } catch (error) {
        console.error('Error loading cart from storage:', error);
        this.cartItemsSubject.next([]);
      }
    } else {
      this.cartItemsSubject.next([]);
    }
  }

  private saveCartToStorage(): void {
    const cartKey = this.getCartKey();
    if (!cartKey) return;
    
    localStorage.setItem(cartKey, JSON.stringify(this.cartItemsSubject.value));
  }

  private requireAuthentication(): boolean {
    if (!this.authService.isAuthenticated()) {
      console.warn('User must be logged in to perform cart operations');
      return false;
    }
    return true;
  }

  addToCart(product: Product, quantity: number = 1, selectedVariants?: { [key: string]: string }): boolean {
    if (!this.requireAuthentication()) {
      return false;
    }

    const currentItems = this.cartItemsSubject.value;
    const existingItemIndex = currentItems.findIndex(
      item => item.product.id === product.id && 
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
    );

    if (existingItemIndex > -1) {
      currentItems[existingItemIndex].quantity += quantity;
    } else {
      currentItems.push({
        product,
        quantity,
        selectedVariants
      });
    }

    this.cartItemsSubject.next([...currentItems]);
    this.saveCartToStorage();
    return true;
  }

  removeFromCart(productId: number, selectedVariants?: { [key: string]: string }): boolean {
    if (!this.requireAuthentication()) {
      return false;
    }

    const currentItems = this.cartItemsSubject.value;
    const filteredItems = currentItems.filter(
      item => !(item.product.id === productId && 
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants))
    );
    
    this.cartItemsSubject.next(filteredItems);
    this.saveCartToStorage();
    return true;
  }

  updateQuantity(productId: number, quantity: number, selectedVariants?: { [key: string]: string }): boolean {
    if (!this.requireAuthentication()) {
      return false;
    }

    const currentItems = this.cartItemsSubject.value;
    const itemIndex = currentItems.findIndex(
      item => item.product.id === productId && 
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
    );

    if (itemIndex > -1) {
      if (quantity <= 0) {
        this.removeFromCart(productId, selectedVariants);
      } else {
        currentItems[itemIndex].quantity = quantity;
        this.cartItemsSubject.next([...currentItems]);
        this.saveCartToStorage();
      }
    }
    return true;
  }

  clearCart(): void {
    this.cartItemsSubject.next([]);
    const cartKey = this.getCartKey();
    if (cartKey) {
      localStorage.removeItem(cartKey);
    }
  }

  clearAllUserCarts(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.CART_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    this.cartItemsSubject.next([]);
  }

  getCartItemsCount(): Observable<number> {
    return new Observable(observer => {
      this.cartItems$.subscribe(items => {
        const totalItems = items.reduce((total, item) => total + item.quantity, 0);
        observer.next(totalItems);
      });
    });
  }

  getCartTotal(): Observable<number> {
    return new Observable(observer => {
      this.cartItems$.subscribe(items => {
        const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        observer.next(total);
      });
    });
  }

  getCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
} 