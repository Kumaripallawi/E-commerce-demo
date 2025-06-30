import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, fromEvent, Subscription } from 'rxjs';
import { throttleTime, debounceTime } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';
import { User } from '../../../core/models/user.model';
import { ProductDialogComponent } from '../dialogs/product-dialog/product-dialog.component';
import { UserDialogComponent } from '../dialogs/user-dialog/user-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../dialogs/confirmation-dialog/confirmation-dialog.component';
import { CategoriesDialogComponent } from '../dialogs/categories-dialog/categories-dialog.component';
import { OrdersDialogComponent } from '../dialogs/orders-dialog/orders-dialog.component';
import { SettingsDialogComponent } from '../dialogs/settings-dialog/settings-dialog.component';

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  creationAt: string;
  updatedAt: string;
}

interface PaginationState {
  offset: number;
  limit: number;
  hasMore: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('productsContainer') productsContainer!: ElementRef;
  @ViewChild('usersContainer') usersContainer!: ElementRef;

  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  products = signal<Product[]>([]);
  users = signal<ApiUser[]>([]);
  loading = signal(false);
  usersLoaded = signal(false);
  
  productsPagination: PaginationState = {
    offset: 0,
    limit: 50,
    hasMore: true,
    loading: false
  };
  
  // Users will be loaded in single call with limit 200, no pagination needed

  // Scroll subscriptions (only for products, users load all at once)
  private productsScrollSub?: Subscription;
  
  // Statistics
  totalProducts = signal(0);
  totalUsers = signal(0);
  totalOrders = signal(0);
  totalRevenue = signal(0);

  // Table columns
  productColumns: string[] = ['id', 'title', 'price', 'category', 'actions'];
  userColumns: string[] = ['id', 'name', 'email', 'role', 'actions'];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.setupScrollListeners();
  }

  ngOnDestroy(): void {
    this.productsScrollSub?.unsubscribe();
  }

  private setupScrollListeners(): void {
    // Setup products scroll listener
    setTimeout(() => {
      if (this.productsContainer?.nativeElement) {
        this.productsScrollSub = fromEvent(this.productsContainer.nativeElement, 'scroll')
          .pipe(
            throttleTime(100),
            debounceTime(100)
          )
          .subscribe(() => this.onProductsScroll());
      }
    }, 100);
  }

  private onProductsScroll(): void {
    const element = this.productsContainer.nativeElement;
    const threshold = 150; // Load more when 150px from bottom
    
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
      if (this.productsPagination.hasMore && !this.productsPagination.loading) {
        this.loadMoreProducts();
      }
    }
  }

  // Users scroll removed - now loading all users in single call

  loadDashboardData(): void {
    this.loading.set(true);
    
    // Load initial products (50 items)
    const pagination = { offset: 0, limit: this.productsPagination.limit };
    this.productService.getProducts(pagination).subscribe({
      next: (products) => {
        this.products.set(products);
        this.productsPagination.offset = this.productsPagination.limit;
        this.productsPagination.hasMore = products.length === this.productsPagination.limit;
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.showError('Failed to load products');
        this.loading.set(false);
      }
    });

    this.loadTotalCounts();

    this.totalOrders.set(150);
    this.totalRevenue.set(12500);
  }

  private loadTotalCounts(): void {
    this.http.get<Product[]>('https://api.escuelajs.co/api/v1/products?limit=1000').subscribe({
      next: (allProducts) => {
        this.totalProducts.set(allProducts.length);
      },
      error: (error) => {
        console.error('Error loading total products count:', error);
        this.totalProducts.set(0);
      }
    });

    this.http.get<ApiUser[]>('https://api.escuelajs.co/api/v1/users?limit=1000').subscribe({
      next: (allUsers) => {
        this.totalUsers.set(allUsers.length);
      },
      error: (error) => {
        console.error('Error loading total users count:', error);
        this.totalUsers.set(0);
      }
    });
  }

  private loadMoreProducts(): void {
    if (this.productsPagination.loading || !this.productsPagination.hasMore) return;
    
    this.productsPagination.loading = true;
    const pagination = { 
      offset: this.productsPagination.offset, 
      limit: this.productsPagination.limit 
    };
    
    this.productService.getProducts(pagination).subscribe({
      next: (newProducts) => {
        const currentProducts = this.products();
        const allProducts = [...currentProducts, ...newProducts];
        
        const uniqueProducts = allProducts.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        );
        
        this.products.set(uniqueProducts);
        this.productsPagination.offset += this.productsPagination.limit;
        this.productsPagination.hasMore = newProducts.length === this.productsPagination.limit;
        this.productsPagination.loading = false;
      },
      error: (error) => {
        console.error('Error loading more products:', error);
        this.productsPagination.loading = false;
      }
    });
  }

  loadUsers(): void {
    if (this.usersLoaded()) {
      return; 
    }

    this.loading.set(true);
    const url = `https://api.escuelajs.co/api/v1/users?limit=200`;
    
    this.http.get<ApiUser[]>(url).subscribe({
      next: (users) => {
        this.users.set(users);
        this.usersLoaded.set(true);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.showError('Failed to load users');
        this.loading.set(false);
      }
    });
  }

  onTabChange(index: number): void {
    if (index === 1) { 
      this.loadUsers();
    }
  }

  get isLoadingMoreProducts(): boolean {
    return this.productsPagination.loading;
  }

  get hasMoreProducts(): boolean {
    return this.productsPagination.hasMore;
  }

  addProduct(): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { isEdit: false },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccess('Product created successfully!');
        this.refreshProducts();
      }
    });
  }

  editProduct(product: Product): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { product, isEdit: true },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccess('Product updated successfully!');
        this.refreshProducts();
      }
    });
  }

  deleteProduct(productId: number): void {
    const product = this.products().find(p => p.id === productId);
    if (!product) return;

    const confirmationData: ConfirmationDialogData = {
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: confirmationData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.performProductDelete(productId);
      }
    });
  }

  private performProductDelete(productId: number): void {
    this.http.delete(`https://api.escuelajs.co/api/v1/products/${productId}`).subscribe({
      next: () => {
        this.showSuccess('Product deleted successfully!');
        this.refreshProducts();
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.showError('Failed to delete product');
      }
    });
  }

  private refreshProducts(): void {
    this.productsPagination = {
      offset: 0,
      limit: 50,
      hasMore: true,
      loading: false
    };
    
    if (this.productsContainer?.nativeElement) {
      this.productsContainer.nativeElement.scrollTop = 0;
    }
    
    const pagination = { offset: 0, limit: this.productsPagination.limit };
    this.productService.getProducts(pagination).subscribe({
      next: (products) => {
        this.products.set(products);
        this.productsPagination.offset = this.productsPagination.limit;
        this.productsPagination.hasMore = products.length === this.productsPagination.limit;
        
        this.loadTotalCounts();
      },
      error: (error) => {
        console.error('Error refreshing products:', error);
      }
    });
  }

  // User Management
  addUser(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '550px',
      maxWidth: '95vw',
      data: { isEdit: false },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccess('User created successfully!');
        this.refreshUsers();
      }
    });
  }

  editUser(user: ApiUser): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '550px',
      maxWidth: '95vw',
      data: { user, isEdit: true },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccess('User updated successfully!');
        this.refreshUsers();
      }
    });
  }

  deleteUser(userId: number): void {
    const user = this.users().find(u => u.id === userId);
    if (!user) return;

    const confirmationData: ConfirmationDialogData = {
      title: 'Delete User',
      message: `Are you sure you want to delete user "${user.name}" (${user.email})? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: confirmationData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.performUserDelete(userId);
      }
    });
  }

  private performUserDelete(userId: number): void {
    this.http.delete(`https://api.escuelajs.co/api/v1/users/${userId}`).subscribe({
      next: () => {
        this.showSuccess('User deleted successfully!');
        this.refreshUsers();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.showError('Failed to delete user');
      }
    });
  }

  private refreshUsers(): void {
    // Reset users loaded state
    this.usersLoaded.set(false);
    
    const url = `https://api.escuelajs.co/api/v1/users?limit=200`;
    this.http.get<ApiUser[]>(url).subscribe({
      next: (users) => {
        this.users.set(users);
        
        // Refresh total count
        this.loadTotalCounts();
      },
      error: (error) => {
        console.error('Error refreshing users:', error);
      }
    });
  }

  // Quick Actions - Now functional!
  manageCategories(): void {
    const dialogRef = this.dialog.open(CategoriesDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(() => {
      // Optionally refresh products if categories were modified
      this.refreshProducts();
    });
  }

  viewOrders(): void {
    const dialogRef = this.dialog.open(OrdersDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(() => {
      // Orders dialog closed
    });
  }

  viewSettings(): void {
    const dialogRef = this.dialog.open(SettingsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(() => {
      // Settings dialog closed
    });
  }

  // Utility methods
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
} 