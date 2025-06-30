import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Add auth header for requests to our API that require authentication
  if (token && req.url.includes('api.escuelajs.co')) {
    // Skip auth header for login and register endpoints
    const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/users/') && req.method === 'POST';
    
    if (!isAuthEndpoint) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next(authReq);
    }
  }

  return next(req);
}; 