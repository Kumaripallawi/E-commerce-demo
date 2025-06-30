import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { CheckoutComponent } from './checkout.component';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let mockCartService: jasmine.SpyObj<CartService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockCartService = jasmine.createSpyObj('CartService', ['clearCart']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        CheckoutComponent,
        RouterTestingModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatStepperModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: CartService, useValue: mockCartService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display checkout title and content', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('Checkout');
    expect(compiled.textContent).toContain('This is a protected checkout page that requires authentication.');
    expect(compiled.textContent).toContain('Your order will be processed here.');
  });

  it('should have back to cart button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const backButton = compiled.querySelector('button[routerLink="/cart"]');
    expect(backButton).toBeTruthy();
    expect(backButton.textContent).toContain('Back to Cart');
  });

  it('should have complete order button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const completeButton = compiled.querySelector('button[color="primary"]');
    expect(completeButton).toBeTruthy();
    expect(completeButton.textContent).toContain('Complete Order');
  });

  it('should redirect to login if not authenticated on init', () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    
    component.ngOnInit();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should not redirect if authenticated on init', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    
    component.ngOnInit();
    
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should complete order when completeOrder is called', () => {
    spyOn(window, 'alert');
    
    component.completeOrder();
    
    expect(window.alert).toHaveBeenCalledWith('Order completed! (Demo)');
    expect(mockCartService.clearCart).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should have proper card structure', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('.checkout-container')).toBeTruthy();
    expect(compiled.querySelector('.checkout-card')).toBeTruthy();
    expect(compiled.querySelector('.actions')).toBeTruthy();
  });

  it('should display payment and arrow_back icons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const icons = compiled.querySelectorAll('mat-icon');
    const iconTexts = Array.from(icons).map((icon: any) => icon.textContent.trim());
    
    expect(iconTexts).toContain('arrow_back');
    expect(iconTexts).toContain('payment');
  });
}); 