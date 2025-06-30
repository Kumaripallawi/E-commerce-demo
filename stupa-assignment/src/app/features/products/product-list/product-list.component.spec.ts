import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockCartService: jasmine.SpyObj<CartService>;

  const mockProducts: Product[] = [
    {
      id: 1,
      title: 'Test Product 1',
      price: 99.99,
      description: 'Test product 1 description',
      category: {
        id: 1,
        name: 'Test Category',
        image: 'test-category.jpg'
      },
      images: ['test1.jpg'],
      creationAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 2,
      title: 'Test Product 2',
      price: 149.99,
      description: 'Test product 2 description',
      category: {
        id: 2,
        name: 'Test Category 2',
        image: 'test-category2.jpg'
      },
      images: ['test2.jpg'],
      creationAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ];

  const mockCategories = [
    { id: 1, name: 'Test Category', image: 'test-category.jpg' },
    { id: 2, name: 'Test Category 2', image: 'test-category2.jpg' }
  ];

  beforeEach(async () => {
    mockProductService = jasmine.createSpyObj('ProductService', ['getProducts', 'getProductsGraphQL', 'getCategories']);
    mockCartService = jasmine.createSpyObj('CartService', ['addToCart']);

    await TestBed.configureTestingModule({
      imports: [
        ProductListComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatSnackBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: CartService, useValue: mockCartService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.loading()).toBeTrue();
    expect(component.viewMode()).toBe('grid');
    expect(component.useGraphQL()).toBeFalse();
    expect(component.hasMoreData()).toBeTrue();
    expect(component.loadingMore()).toBeFalse();
  });

  it('should load products on init', () => {
    mockProductService.getProducts.and.returnValue(of(mockProducts));
    mockProductService.getCategories.and.returnValue(of(mockCategories));
    
    component.ngOnInit();
    
    expect(mockProductService.getProducts).toHaveBeenCalled();
    expect(component.products()).toEqual(mockProducts);
    expect(component.loading()).toBeFalse();
  });

  it('should load categories on init', () => {
    mockProductService.getProducts.and.returnValue(of(mockProducts));
    mockProductService.getCategories.and.returnValue(of(mockCategories));
    
    component.ngOnInit();
    
    expect(mockProductService.getCategories).toHaveBeenCalled();
  });

  it('should switch view modes', () => {
    component.setViewMode('list');
    expect(component.viewMode()).toBe('list');
    
    component.setViewMode('grid');
    expect(component.viewMode()).toBe('grid');
  });

  it('should toggle API method', () => {
    const initialGraphQLState = component.useGraphQL();
    
    component.toggleApiMethod();
    
    expect(component.useGraphQL()).toBe(!initialGraphQLState);
  });

  it('should add product to cart', () => {
    const product = mockProducts[0];
    
    component.addToCart(product);
    
    expect(mockCartService.addToCart).toHaveBeenCalledWith(product, 1);
  });

  it('should clear filters', () => {
    // Set some filter values first
    component.filterForm.patchValue({
      search: 'test',
      categoryId: '1',
      minPrice: '10',
      maxPrice: '100'
    });
    
    component.clearFilters();
    
    expect(component.filterForm.value).toEqual({
      search: '',
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'asc'
    });
  });

  it('should handle infinite scroll loading', () => {
    mockProductService.getProducts.and.returnValue(of(mockProducts));
    
    component.loadMoreProducts();
    
    expect(component.loadingMore()).toBeTrue();
    expect(mockProductService.getProducts).toHaveBeenCalled();
  });

  it('should sort products by price ascending', () => {
    const unsortedProducts = [mockProducts[1], mockProducts[0]]; // Higher price first
    mockProductService.getProducts.and.returnValue(of(unsortedProducts));
    mockProductService.getCategories.and.returnValue(of(mockCategories));
    
    component.filterForm.patchValue({ sortBy: 'asc' });
    component.loadProducts();
    
    const sortedProducts = component.products();
    expect(sortedProducts[0].price).toBeLessThan(sortedProducts[1].price);
  });

  it('should sort products by price descending', () => {
    mockProductService.getProducts.and.returnValue(of(mockProducts));
    mockProductService.getCategories.and.returnValue(of(mockCategories));
    
    component.filterForm.patchValue({ sortBy: 'desc' });
    component.loadProducts();
    
    const sortedProducts = component.products();
    expect(sortedProducts[0].price).toBeGreaterThan(sortedProducts[1].price);
  });

  it('should handle image error', () => {
    const mockEvent = {
      target: {
        src: ''
      }
    };
    
    component.onImageError(mockEvent);
    
    expect(mockEvent.target.src).toBe('https://via.placeholder.com/300x200?text=No+Image');
  });

  it('should load more products for infinite scroll', () => {
    mockProductService.getProducts.and.returnValue(of(mockProducts));
    
    // Set initial state
    component.loadingMore.set(false);
    component.hasMoreData.set(true);
    
    component.loadMoreProducts();
    
    expect(component.loadingMore()).toBeTrue();
    expect(mockProductService.getProducts).toHaveBeenCalled();
  });

  it('should handle GraphQL toggle and reload', () => {
    mockProductService.getProducts.and.returnValue(of(mockProducts));
    mockProductService.getProductsGraphQL.and.returnValue(of({ data: { products: mockProducts } }));
    
    spyOn(component, 'loadProducts');
    
    component.toggleApiMethod();
    
    expect(component.loadProducts).toHaveBeenCalledWith(true);
  });
}); 