import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { User, AuthResponse, LoginRequest, RegisterRequest, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://api.escuelajs.co/api/v1';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const storedUser = this.getStoredUser();
    
    if (token && this.isTokenValid(token)) {
      if (storedUser) {
        this.currentUserSubject.next(storedUser);
      }
      
      this.getCurrentUser().pipe(
        catchError(error => {
          console.error('Failed to refresh user profile:', error);
          if (storedUser) {
            return of(storedUser);
          }
          this.logout();
          return of(null);
        })
      ).subscribe();
    } else {
      this.clearStoredData();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        this.setToken(response.access_token);
        this.setRefreshToken(response.refresh_token);
        this.getCurrentUser().subscribe();
      })
    );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/users/`, userData);
  }

  logout(): void {
    this.clearStoredData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  private clearStoredData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  private setStoredUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && this.isTokenValid(token);
  }

  private isTokenValid(token: string): boolean {
    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/profile`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.setStoredUser(user);
      }),
      catchError(error => {
        console.error('Failed to get current user:', error);
        const storedUser = this.getStoredUser();
        if (storedUser && this.isAuthenticated()) {
          this.currentUserSubject.next(storedUser);
          return of(storedUser);
        } else {
          this.logout();
          throw error;
        }
      })
    );
  }

  checkUserExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URL}/users/is-available`, {
      params: { email }
    });
  }

  getCurrentUserRole(): Observable<UserRole | null> {
    return this.currentUser$.pipe(
      map(user => user?.role || null)
    );
  }

  hasRole(role: UserRole): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => user?.role === role || false)
    );
  }

  isAdmin(): Observable<boolean> {
    return this.hasRole(UserRole.ADMIN);
  }

  isCustomer(): Observable<boolean> {
    return this.hasRole(UserRole.CUSTOMER);
  }

  canAccessAdminFeatures(): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role === UserRole.ADMIN || false;
  }

  canAccessCustomerFeatures(): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role === UserRole.CUSTOMER || false;
  }
} 