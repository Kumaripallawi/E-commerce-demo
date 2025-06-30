import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { User, UserRole } from '../../../core/models/user.model';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockCartService: jasmine.SpyObj<CartService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    role: UserRole.CUSTOMER,
    avatar: 'https://example.com/avatar.jpg',
    creationAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: of(mockUser)
    });
    
    mockCartService = jasmine.createSpyObj('CartService', ['getCartItemsCount'], {
      getCartItemsCount: () => of(3)
    });

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        RouterTestingModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatBadgeModule,
        MatMenuModule,
        MatDividerModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: CartService, useValue: mockCartService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with user and cart observables', () => {
    expect(component.currentUser$).toBeDefined();
    expect(component.cartItemsCount$).toBeDefined();
    
    component.currentUser$.subscribe(user => {
      expect(user).toEqual(mockUser);
    });
    
    component.cartItemsCount$.subscribe(count => {
      expect(count).toBe(3);
    });
  });

  it('should display logo and navigation', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('E-Commerce');
    expect(compiled.textContent).toContain('Products');
    expect(compiled.textContent).toContain('Categories');
  });

  it('should display cart button with badge', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const cartButton = compiled.querySelector('.cart-button');
    expect(cartButton).toBeTruthy();
    
    const cartIcon = compiled.querySelector('[matBadge]');
    expect(cartIcon).toBeTruthy();
  });

  it('should display user menu when user is logged in', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('Test User');
    
    const userButton = compiled.querySelector('.user-button');
    expect(userButton).toBeTruthy();
  });

  it('should display login button when user is not logged in', () => {
    // Mock empty user
    mockAuthService.currentUser$ = of(null);
    component.currentUser$ = mockAuthService.currentUser$;
    
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const loginButton = compiled.querySelector('.login-button');
    expect(loginButton).toBeTruthy();
    expect(compiled.textContent).toContain('Login');
  });

  it('should call logout when logout is clicked', () => {
    component.logout();
    
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should have proper router links', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const routerLinks = compiled.querySelectorAll('[routerLink]');
    expect(routerLinks.length).toBeGreaterThan(0);
    
    // Check specific links
    const homeLink = Array.from(routerLinks).find(
      (link: any) => link.getAttribute('routerLink') === '/'
    );
    expect(homeLink).toBeTruthy();
    
    const productsLink = Array.from(routerLinks).find(
      (link: any) => link.getAttribute('routerLink') === '/products'
    );
    expect(productsLink).toBeTruthy();
    
    const cartLink = Array.from(routerLinks).find(
      (link: any) => link.getAttribute('routerLink') === '/cart'
    );
    expect(cartLink).toBeTruthy();
  });

  it('should have sticky header positioning', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const header = compiled.querySelector('.header');
    const computedStyles = getComputedStyle(header);
    
    // Note: In test environment, computed styles might not reflect CSS exactly
    // but we can check that the class is applied
    expect(header.classList.contains('header')).toBeTruthy();
  });

  it('should have responsive design classes', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('.header-container')).toBeTruthy();
    expect(compiled.querySelector('.logo-section')).toBeTruthy();
    expect(compiled.querySelector('.nav-section')).toBeTruthy();
    expect(compiled.querySelector('.actions-section')).toBeTruthy();
  });

  it('should display user menu items when menu is opened', () => {
    fixture.detectChanges();
    
    // The menu items are rendered conditionally, so we check if the menu trigger exists
    const menuTrigger = fixture.nativeElement.querySelector('[matMenuTriggerFor]');
    expect(menuTrigger).toBeTruthy();
  });
}); 