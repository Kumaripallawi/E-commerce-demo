import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CategoriesComponent } from './categories.component';
import { ProductService } from '../../core/services/product.service';

describe('CategoriesComponent', () => {
  let component: CategoriesComponent;
  let fixture: ComponentFixture<CategoriesComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockCategories = [
    {
      id: 1,
      name: 'Electronics',
      image: 'https://picsum.photos/300/200?random=1',
      creationAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 2,
      name: 'Clothing',
      image: 'https://picsum.photos/300/200?random=2',
      creationAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', ['getCategories']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [CategoriesComponent, BrowserAnimationsModule],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesComponent);
    component = fixture.componentInstance;
    mockProductService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    mockProductService.getCategories.and.returnValue(of(mockCategories));
    expect(component).toBeTruthy();
  });

  it('should load categories on init', () => {
    mockProductService.getCategories.and.returnValue(of(mockCategories));
    
    component.ngOnInit();
    
    expect(mockProductService.getCategories).toHaveBeenCalled();
    expect(component.categories()).toEqual(mockCategories);
    expect(component.loading()).toBeFalse();
  });

  it('should handle error when loading categories', () => {
    const errorResponse = new Error('Network error');
    mockProductService.getCategories.and.returnValue(throwError(errorResponse));
    
    component.ngOnInit();
    
    expect(component.error()).toBe('Failed to load categories. Please try again.');
    expect(component.loading()).toBeFalse();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load categories', 'Close', { duration: 5000 });
  });

  it('should navigate to products with category filter when category is clicked', () => {
    const category = mockCategories[0];
    
    component.onCategoryClick(category);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products'], { 
      queryParams: { category: category.id }
    });
  });

  it('should handle image error', () => {
    const mockEvent = {
      target: { src: '' }
    };
    
    component.onImageError(mockEvent);
    
    expect(mockEvent.target.src).toBe('https://via.placeholder.com/300x200/f0f0f0/333333?text=Category');
  });

  it('should retry loading categories', () => {
    mockProductService.getCategories.and.returnValue(of(mockCategories));
    spyOn(component, 'loadCategories');
    
    component.retry();
    
    expect(component.loadCategories).toHaveBeenCalled();
  });

  it('should show loading state initially', () => {
    mockProductService.getCategories.and.returnValue(of(mockCategories));
    component.loading.set(true);
    fixture.detectChanges();
    
    const loadingElement = fixture.nativeElement.querySelector('.loading-container');
    expect(loadingElement).toBeTruthy();
  });

  it('should show error state when there is an error', () => {
    component.error.set('Test error');
    component.loading.set(false);
    fixture.detectChanges();
    
    const errorElement = fixture.nativeElement.querySelector('.error-container');
    expect(errorElement).toBeTruthy();
  });

  it('should show categories grid when categories are loaded', () => {
    component.categories.set(mockCategories);
    component.loading.set(false);
    component.error.set(null);
    fixture.detectChanges();
    
    const gridElement = fixture.nativeElement.querySelector('.categories-grid');
    expect(gridElement).toBeTruthy();
    
    const categoryCards = fixture.nativeElement.querySelectorAll('.category-card');
    expect(categoryCards.length).toBe(mockCategories.length);
  });

  it('should show empty state when no categories are found', () => {
    component.categories.set([]);
    component.loading.set(false);
    component.error.set(null);
    fixture.detectChanges();
    
    const emptyElement = fixture.nativeElement.querySelector('.empty-container');
    expect(emptyElement).toBeTruthy();
  });
}); 