import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotFoundComponent,
        RouterTestingModule,
        MatButtonModule,
        MatIconModule,
        BrowserAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 404 error message', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.textContent).toContain('404 - Page Not Found');
    expect(compiled.textContent).toContain("The page you're looking for doesn't exist.");
  });

  it('should display error icon', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const errorIcon = compiled.querySelector('.error-icon');
    expect(errorIcon).toBeTruthy();
    expect(errorIcon.textContent.trim()).toBe('error_outline');
  });

  it('should have a "Go Home" button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const goHomeButton = compiled.querySelector('button');
    expect(goHomeButton).toBeTruthy();
    expect(goHomeButton.textContent).toContain('Go Home');
  });

  it('should have router link to home page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const goHomeButton = compiled.querySelector('button[routerLink="/"]');
    expect(goHomeButton).toBeTruthy();
  });

  it('should have proper container structure', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('.not-found-container')).toBeTruthy();
    expect(compiled.querySelector('.not-found-content')).toBeTruthy();
  });

  it('should display home icon in button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    const homeIcon = compiled.querySelector('button mat-icon');
    expect(homeIcon).toBeTruthy();
    expect(homeIcon.textContent.trim()).toBe('home');
  });
}); 