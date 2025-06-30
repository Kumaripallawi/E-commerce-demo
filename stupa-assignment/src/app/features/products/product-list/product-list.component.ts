import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatRadioModule,
    MatTooltipModule
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  products = signal<Product[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  useGraphQL = signal(false); // Start with REST API by default
  
  // New UI state properties
  showFilterPanel = signal(false);
  showQuickSearch = signal(false);
  
  pageSize = 12;
  currentPage = 1; // Changed from pageIndex to currentPage starting at 1
  hasMoreData = signal(true);
  isFilterChanged = false;

  filterForm: FormGroup;
  categories$: Observable<any[]>;
  categoriesData: any[] = []; // Store categories data for getCategoryName

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      categoryId: [''],
      minPrice: [''],
      maxPrice: [''],
      sortBy: ['asc']
    });
    
    this.categories$ = this.productService.getCategories();
  }

  ngOnInit(): void {
    this.loadUrlParameters();
    this.loadProducts(true); // true for initial load
    this.setupFilterSubscription();
    this.loadCategoriesData();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: any): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Load more when user is 200px from bottom and not already loading
    // Account for fixed header by adjusting the threshold slightly
    if (scrollPosition >= documentHeight - 250 && 
        !this.loading() && 
        !this.loadingMore() && 
        this.hasMoreData()) {
      this.loadMoreProducts();
    }
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.isFilterChanged = true;
        this.currentPage = 1;
        this.hasMoreData.set(true);
        
        // Scroll to top when filters change
        this.scrollToTop();
        
        this.loadProducts(true); // Reset and load from beginning
      });
  }

  loadProducts(isInitialLoad: boolean = false): void {
    if (isInitialLoad || this.isFilterChanged) {
      this.loading.set(true);
      this.isFilterChanged = false;
    } else {
      this.loadingMore.set(true);
    }
    
    if (this.useGraphQL()) {
      this.loadProductsGraphQL(isInitialLoad);
    } else {
      this.loadProductsREST(isInitialLoad);
    }
  }

  loadMoreProducts(): void {
    this.currentPage++;
    this.loadProducts(false);
  }

  private loadProductsGraphQL(isInitialLoad: boolean): void {
    const formValue = this.filterForm.value;
    // Standard 0-based pagination: Page 1 = offset 0, Page 2 = offset 12, Page 3 = offset 24, etc.
    const offset = (this.currentPage - 1) * this.pageSize;
    
    // Check if any filters are applied
    const hasFilters = formValue.search || formValue.categoryId || formValue.minPrice || formValue.maxPrice;
    
    // If filters are applied, fetch more products to ensure we have enough after client-side filtering
    // For infinite scroll (not initial load), use smaller batches to avoid fetching too much data
    let limit = this.pageSize;
    if (hasFilters && isInitialLoad) {
      limit = 50; // Fetch more products for initial load when filtering
    } else if (hasFilters && !isInitialLoad) {
      limit = 24; // Fetch more for infinite scroll when filtering
    }

    console.log('Loading GraphQL products with page:', this.currentPage, 'offset:', offset, 'limit:', limit, 'hasFilters:', hasFilters);

    this.productService.getProductsGraphQL(offset, limit).subscribe({
      next: (result: any) => {
        console.log('GraphQL response:', result);
        
        let newProducts = result.data?.products || [];
        console.log('Extracted products:', newProducts);
        
        // Apply client-side filtering since GraphQL endpoint might not support all filters
        if (formValue.search) {
          newProducts = newProducts.filter((product: Product) => 
            product.title.toLowerCase().includes(formValue.search.toLowerCase())
          );
        }
        
        if (formValue.categoryId) {
          console.log('Filtering by categoryId:', formValue.categoryId, typeof formValue.categoryId);
          console.log('Sample product category:', newProducts[0]?.category);
          
          newProducts = newProducts.filter((product: Product) => {
            const productCategoryId = product.category.id;
            const filterCategoryId = parseInt(formValue.categoryId);
            
            console.log(`Comparing product category ID: ${productCategoryId} (${typeof productCategoryId}) with filter: ${filterCategoryId} (${typeof filterCategoryId})`);
            
            // Try both direct comparison and string comparison
            const matches = productCategoryId === filterCategoryId || 
                           productCategoryId === formValue.categoryId ||
                           String(productCategoryId) === String(formValue.categoryId);
            
            if (matches) {
              console.log('Product matches filter:', product.title, product.category.name);
            }
            
            return matches;
          });
          
          console.log('Products after category filter:', newProducts.length);
        }
        
        if (formValue.minPrice) {
          newProducts = newProducts.filter((product: Product) => 
            product.price >= parseFloat(formValue.minPrice)
          );
        }
        
        if (formValue.maxPrice) {
          newProducts = newProducts.filter((product: Product) => 
            product.price <= parseFloat(formValue.maxPrice)
          );
        }

        // Apply sorting (create a copy first since GraphQL arrays are read-only)
        if (formValue.sortBy) {
          newProducts = [...newProducts].sort((a: Product, b: Product) => {
            return formValue.sortBy === 'asc' ? a.price - b.price : b.price - a.price;
          });
        }

        console.log('Final filtered products:', newProducts);
        
        // For GraphQL with filters, we need to adjust hasMoreData logic
        // since we might filter out many products
        if (hasFilters && newProducts.length < this.pageSize && !isInitialLoad) {
          // If we got fewer filtered products than expected, try to fetch more
          // but only if we actually got products from the API
          const originalProductCount = result.data?.products?.length || 0;
          if (originalProductCount >= limit) {
            // There might be more products available, continue infinite scroll
            this.handleProductsResponse(newProducts, isInitialLoad);
          } else {
            // No more products available from API
            this.hasMoreData.set(false);
            this.handleProductsResponse(newProducts, isInitialLoad);
          }
        } else {
          // Standard case: check if we have more data based on the actual products received
          const originalProductCount = result.data?.products?.length || 0;
          if (originalProductCount < limit) {
            this.hasMoreData.set(false);
          }
          this.handleProductsResponse(newProducts, isInitialLoad);
        }
      },
      error: (error) => {
        console.error('GraphQL error, falling back to REST API:', error);
        
        // Make sure loading states are reset on error
        this.loading.set(false);
        this.loadingMore.set(false);
        this.hasMoreData.set(false); // Stop infinite scroll on error
        
        // Fallback to REST API if GraphQL fails
        this.loadProductsREST(isInitialLoad);
      },
      complete: () => {
        console.log('GraphQL request completed');
      }
    });
  }

  private loadProductsREST(isInitialLoad: boolean): void {
    const formValue = this.filterForm.value;
    const filters = {
      categoryId: formValue.categoryId || undefined,
      title: formValue.search || undefined,
      price_min: formValue.minPrice || undefined,
      price_max: formValue.maxPrice || undefined
    };

    // Standard 0-based pagination: Page 1 = offset 0, Page 2 = offset 12, Page 3 = offset 24, etc.
    const pagination = {
      offset: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };

    console.log('Loading REST products with page:', this.currentPage, 'offset:', pagination.offset, 'limit:', pagination.limit);

    this.productService.getProducts(pagination, filters).subscribe({
      next: (newProducts) => {
        let sortedProducts = [...newProducts];
        
        if (formValue.sortBy) {
          sortedProducts = sortedProducts.sort((a, b) => {
            return formValue.sortBy === 'asc' ? a.price - b.price : b.price - a.price;
          });
        }

        this.handleProductsResponse(sortedProducts, isInitialLoad);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  private handleProductsResponse(newProducts: Product[], isInitialLoad: boolean): void {
    if (isInitialLoad) {
      // Replace products for initial load or filter change
      this.products.set(newProducts);
    } else {
      // Append products for infinite scroll
      const currentProducts = this.products();
      this.products.set([...currentProducts, ...newProducts]);
    }

    // For GraphQL, hasMoreData is handled in the calling method
    // For REST API, use the standard logic
    if (!this.useGraphQL()) {
      // Check if we have more data to load (REST API)
      if (newProducts.length < this.pageSize) {
        this.hasMoreData.set(false);
      }
    }

    this.loading.set(false);
    this.loadingMore.set(false);
  }

  addToCart(product: Product): void {
    if (!this.cartService.isAuthenticated()) {
      this.snackBar.open('Please login to add items to cart', 'Login', { duration: 3000 })
        .onAction().subscribe(() => {
          window.location.href = '/auth/login?returnUrl=' + encodeURIComponent(window.location.pathname);
        });
      return;
    }

    const success = this.cartService.addToCart(product, 1);
    if (success) {
      this.snackBar.open(
        `${product.title} added to cart!`, 
        '🛒', 
        {
          duration: 2000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        }
      );
    } else {
      this.snackBar.open('Failed to add item to cart', 'Close', { duration: 3000 });
    }
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  toggleApiMethod(): void {
    this.useGraphQL.update(current => !current);
    this.currentPage = 1; // Reset to first page
    this.hasMoreData.set(true); // Reset has more data flag
    
    // Scroll to top when switching API methods
    this.scrollToTop();
    
    this.loadProducts(true); // Reload from beginning
  }

  private scrollToTop(): void {
    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'asc'
    });
    
    // Scroll to top when clearing filters
    this.scrollToTop();
    
    // Form reset will trigger the filter subscription which reloads products
  }

  onImageError(event: any): void {
    event.target.src = 'https://placehold.co/300x200/e0e0e0/666666?text=No+Image';
  }

  private loadUrlParameters(): void {
    // Read category from URL query parameters
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        console.log('Setting category from URL:', params['category']);
        this.filterForm.patchValue({
          categoryId: params['category']
        });
      }
    });
  }

  private loadCategoriesData(): void {
    this.categories$.subscribe(categories => {
      this.categoriesData = categories || [];
    });
  }

  // New methods for floating filter system
  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(formValue.search || 
             formValue.categoryId || 
             formValue.minPrice || 
             formValue.maxPrice || 
             (formValue.sortBy && formValue.sortBy !== 'asc'));
  }

  getActiveFiltersCount(): number {
    let count = 0;
    const formValue = this.filterForm.value;
    
    if (formValue.search) count++;
    if (formValue.categoryId) count++;
    if (formValue.minPrice || formValue.maxPrice) count++;
    if (formValue.sortBy && formValue.sortBy !== 'asc') count++;
    
    return count;
  }

  removeFilter(filterType: string): void {
    switch (filterType) {
      case 'search':
        this.filterForm.patchValue({ search: '' });
        break;
      case 'categoryId':
        this.filterForm.patchValue({ categoryId: '' });
        break;
      case 'price':
        this.filterForm.patchValue({ minPrice: '', maxPrice: '' });
        break;
      case 'sortBy':
        this.filterForm.patchValue({ sortBy: 'asc' });
        break;
    }
  }

  getCategoryName(categoryId: string): string {
    if (!categoryId || !this.categoriesData) return '';
    const category = this.categoriesData.find(cat => cat.id.toString() === categoryId.toString());
    return category ? category.name : '';
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update(show => !show);
    this.showQuickSearch.set(false); // Close other panels
  }

  toggleQuickSearch(): void {
    this.showQuickSearch.update(show => !show);
    this.showFilterPanel.set(false); // Close other panels
  }

  closeAllPanels(): void {
    this.showFilterPanel.set(false);
    this.showQuickSearch.set(false);
  }

  applyFilters(): void {
    // Filters are automatically applied via form subscription
    // Just close the panel
    this.showFilterPanel.set(false);
  }

  clearSearch(): void {
    this.filterForm.get('search')?.setValue('');
  }
} 