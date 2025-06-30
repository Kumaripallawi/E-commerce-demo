import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/services/auth.service';
import { User, UserRole } from '../../core/models/user.model';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

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
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'logout'], {
      currentUser$: of(mockUser)
    });

    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current user observable', () => {
    expect(component.user$).toBeDefined();
    
    component.user$.subscribe(user => {
      expect(user).toEqual(mockUser);
    });
  });

  it('should call getCurrentUser on init', () => {
    mockAuthService.getCurrentUser.and.returnValue(of(mockUser));
    
    component.ngOnInit();
    
    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
  });

  it('should call logout when logout button is clicked', () => {
    component.logout();
    
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should format date correctly', () => {
    const testDate = '2024-01-01T00:00:00.000Z';
    const formattedDate = component.formatDate(testDate);
    
    expect(formattedDate).toBe(new Date(testDate).toLocaleDateString());
  });

  it('should handle image error', () => {
    const mockEvent = {
      target: {
        src: ''
      }
    };
    
    component.onImageError(mockEvent);
    
    expect(mockEvent.target.src).toBe('https://via.placeholder.com/100x100?text=User');
  });

  it('should display user information in template', () => {
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h2').textContent).toContain('Test User');
    expect(compiled.textContent).toContain('test@example.com');
    expect(compiled.textContent).toContain('customer');
  });

  it('should display profile card when user is available', () => {
    fixture.detectChanges();
    
    const profileCard = fixture.nativeElement.querySelector('.profile-card');
    expect(profileCard).toBeTruthy();
  });

  it('should have edit and logout buttons', () => {
    fixture.detectChanges();
    
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    
    const buttonTexts = Array.from(buttons).map((button: any) => button.textContent.trim());
    expect(buttonTexts.some(text => text.includes('Edit Profile'))).toBeTruthy();
    expect(buttonTexts.some(text => text.includes('Logout'))).toBeTruthy();
  });
}); 