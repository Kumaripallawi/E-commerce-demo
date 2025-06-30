import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FooterComponent,
        MatIconModule,
        RouterTestingModule,
        BrowserAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render footer sections', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('.footer')).toBeTruthy();
    expect(compiled.querySelector('.footer-content')).toBeTruthy();
    expect(compiled.querySelector('.footer-bottom')).toBeTruthy();
  });

  it('should display company name and description', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('E-Commerce');
    expect(compiled.textContent).toContain('Your one-stop shop for amazing products at great prices.');
  });

  it('should have quick links section', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('Quick Links');
    expect(compiled.textContent).toContain('Products');
    expect(compiled.textContent).toContain('Categories');
    expect(compiled.textContent).toContain('About Us');
    expect(compiled.textContent).toContain('Contact');
  });

  it('should have customer service section', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('Customer Service');
    expect(compiled.textContent).toContain('Help Center');
    expect(compiled.textContent).toContain('Shipping Info');
    expect(compiled.textContent).toContain('Returns');
    expect(compiled.textContent).toContain('FAQ');
  });

  it('should have account section', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('Account');
    expect(compiled.textContent).toContain('Login');
    expect(compiled.textContent).toContain('Register');
    expect(compiled.textContent).toContain('My Account');
    expect(compiled.textContent).toContain('Order History');
  });

  it('should have social media links', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const socialLinks = compiled.querySelectorAll('.social-links a');
    expect(socialLinks.length).toBe(3);
  });

  it('should display copyright information', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('© 2024 E-Commerce. All rights reserved.');
  });

  it('should have legal links in footer bottom', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('Privacy Policy');
    expect(compiled.textContent).toContain('Terms of Service');
  });

  it('should have proper router links', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const routerLinks = compiled.querySelectorAll('[routerLink]');
    expect(routerLinks.length).toBeGreaterThan(0);
    
    // Check some specific links
    const productsLink = Array.from(routerLinks).find(
      (link: any) => link.getAttribute('routerLink') === '/products'
    );
    expect(productsLink).toBeTruthy();
    
    const loginLink = Array.from(routerLinks).find(
      (link: any) => link.getAttribute('routerLink') === '/auth/login'
    );
    expect(loginLink).toBeTruthy();
  });

  it('should have proper structure for responsive design', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('.footer-container')).toBeTruthy();
    expect(compiled.querySelector('.footer-content')).toBeTruthy();
    expect(compiled.querySelectorAll('.footer-section').length).toBe(4);
  });
}); 