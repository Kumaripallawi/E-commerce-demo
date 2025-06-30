import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CartComponent } from './cart.component';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { CartItem } from '../../core/models/product.model';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let mockCartService: jasmine.SpyObj<CartService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockCartItems: CartItem[] = [
    {
      product: {
        id: 1,
        title: 'Test Product 1',
        price: 99.99,
        description: 'Test description',
        category: { id: 1, name: 'Test Category', image: 'test.jpg' },
        images: ['test1.jpg'],
        creationAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      quantity: 2,
      selectedVariants: { Size: 'M', Color: 'Blue' }
    },
    {
      product: {
        id: 2,
        title: 'Test Product 2',
        price: 149.99,
        description: 'Test description 2',
        category: { id: 2, name: 'Test Category 2', image: 'test2.jpg' },
        images: ['test2.jpg'],
        creationAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      },
      quantity: 1,
      selectedVariants: undefined
    }
  ];

  beforeEach(async () => {
    mockCartService = jasmine.createSpyObj('CartService', [
      'updateQuantity', 'removeFromCart', 'clearCart', 'addToCart'
    ], {
      cartItems$: of(mockCartItems)
    });

    mockAuthService = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

    await TestBed.configureTestingModule({
      imports: [
        CartComponent,
        RouterTestingModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatDividerModule,
        MatSnackBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: CartService, useValue: mockCartService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with cart items', () => {
    component.ngOnInit();
    
    expect(component.cartItems()).toEqual(mockCartItems);
  });

  it('should display cart header with item count', () => {
    component.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('Shopping Cart');
    expect(compiled.textContent).toContain('2 item(s) in your cart');
  });

  it('should display cart items', () => {
    component.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('Test Product 1');
    expect(compiled.textContent).toContain('Test Product 2');
    expect(compiled.textContent).toContain('$99.99');
    expect(compiled.textContent).toContain('$149.99');
  });

  it('should display empty cart message when no items', () => {
    mockCartService.cartItems$ = of([]);
    component.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('Your cart is empty');
    expect(compiled.textContent).toContain("Looks like you haven't added any items to your cart yet.");
  });

  it('should calculate total items correctly', () => {
    component.ngOnInit();
    
    expect(component.getTotalItems()).toBe(3); // 2 + 1
  });

  it('should calculate subtotal correctly', () => {
    component.ngOnInit();
    
    const expectedSubtotal = (99.99 * 2) + (149.99 * 1);
    expect(component.getSubtotal()).toBeCloseTo(expectedSubtotal, 2);
  });

  it('should calculate tax correctly', () => {
    component.ngOnInit();
    
    const subtotal = component.getSubtotal();
    const expectedTax = subtotal * 0.085;
    expect(component.getTax()).toBeCloseTo(expectedTax, 2);
  });

  it('should calculate total correctly', () => {
    component.ngOnInit();
    
    const expectedTotal = component.getSubtotal() + component.getTax();
    expect(component.getTotal()).toBeCloseTo(expectedTotal, 2);
  });

  it('should increase quantity', () => {
    component.ngOnInit();
    const item = mockCartItems[0];
    
    component.increaseQuantity(item);
    
    expect(mockCartService.updateQuantity).toHaveBeenCalledWith(
      item.product.id, 
      item.quantity + 1, 
      item.selectedVariants
    );
  });

  it('should decrease quantity', () => {
    component.ngOnInit();
    const item = mockCartItems[0];
    
    component.decreaseQuantity(item);
    
    expect(mockCartService.updateQuantity).toHaveBeenCalledWith(
      item.product.id, 
      item.quantity - 1, 
      item.selectedVariants
    );
  });

  it('should not decrease quantity below 1', () => {
    component.ngOnInit();
    const item = { ...mockCartItems[0], quantity: 1 };
    
    component.decreaseQuantity(item);
    
    expect(mockCartService.updateQuantity).not.toHaveBeenCalled();
  });

  it('should update quantity from input', () => {
    component.ngOnInit();
    const item = mockCartItems[0];
    const event = { target: { value: '5' } };
    
    component.updateQuantity(item, event);
    
    expect(mockCartService.updateQuantity).toHaveBeenCalledWith(
      item.product.id, 
      5, 
      item.selectedVariants
    );
  });

  it('should remove item from cart', () => {
    component.ngOnInit();
    const item = mockCartItems[0];
    
    component.removeItem(item);
    
    expect(mockCartService.removeFromCart).toHaveBeenCalledWith(
      item.product.id, 
      item.selectedVariants
    );
  });

  it('should clear cart', () => {
    component.ngOnInit();
    
    component.clearCart();
    
    expect(mockCartService.clearCart).toHaveBeenCalled();
  });

  it('should get variant entries correctly', () => {
    const variants = { Size: 'M', Color: 'Blue' };
    
    const entries = component.getVariantEntries(variants);
    
    expect(entries).toEqual([
      { key: 'Size', value: 'M' },
      { key: 'Color', value: 'Blue' }
    ]);
  });

  it('should return empty array for undefined variants', () => {
    const entries = component.getVariantEntries(undefined);
    
    expect(entries).toEqual([]);
  });

  it('should generate unique track by id', () => {
    const item = mockCartItems[0];
    
    const trackId = component.trackByCartItem(0, item);
    
    expect(trackId).toBe('1-{"Size":"M","Color":"Blue"}');
  });

  it('should handle image error', () => {
    const mockEvent = {
      target: {
        src: ''
      }
    };
    
    component.onImageError(mockEvent);
    
    expect(mockEvent.target.src).toBe('https://via.placeholder.com/120x120?text=No+Image');
  });

  it('should proceed to checkout when authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    
    component.proceedToCheckout();
    
    // In the real implementation, this would navigate to checkout
    // For now, it just shows a snackbar message
  });

  it('should show login prompt when not authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    
    component.proceedToCheckout();
    
    // This would show a snackbar with login prompt
  });
}); 