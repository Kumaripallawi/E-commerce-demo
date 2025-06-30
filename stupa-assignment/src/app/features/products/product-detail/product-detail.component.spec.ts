import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockCartService: jasmine.SpyObj<CartService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockProduct: Product = {
    id: 1,
    title: 'Test Product',
    price: 99.99,
    description: 'Test product description',
    category: {
      id: 1,
      name: 'Test Category',
      image: 'test-category.jpg'
    },
    images: ['test1.jpg', 'test2.jpg'],
    creationAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(async () => {
    mockProductService = jasmine.createSpyObj('ProductService', ['getProduct', 'uploadImage']);
    mockCartService = jasmine.createSpyObj('CartService', ['addToCart']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        ProductDetailComponent,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: CartService, useValue: mockCartService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product on init', () => {
    mockProductService.getProduct.and.returnValue(of(mockProduct));
    
    component.ngOnInit();
    
    expect(mockProductService.getProduct).toHaveBeenCalledWith(1);
    expect(component.product()).toEqual(mockProduct);
    expect(component.selectedImage()).toEqual('test1.jpg');
    expect(component.loading()).toBeFalse();
  });

  it('should initialize variant form with default values', () => {
    component.ngOnInit();
    
    expect(component.variantForm.get('quantity')?.value).toBe(1);
    expect(component.variantsFormArray.length).toBe(2); // Size and Color variants
  });

  it('should select image', () => {
    const newImage = 'new-image.jpg';
    
    component.selectImage(newImage);
    
    expect(component.selectedImage()).toBe(newImage);
  });

  it('should add product to cart', () => {
    component.product.set(mockProduct);
    component.variantForm.patchValue({
      quantity: 2,
      variants: [
        { variantId: '1', selectedOption: 'M' },
        { variantId: '2', selectedOption: 'Blue' }
      ]
    });
    
    component.addToCart();
    
    expect(mockCartService.addToCart).toHaveBeenCalledWith(
      mockProduct,
      2,
      { Size: 'M', Color: 'Blue' }
    );
  });

  it('should navigate back to products', () => {
    component.goBack();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should handle image error', () => {
    const mockEvent = {
      target: {
        src: ''
      }
    };
    
    component.onImageError(mockEvent);
    
    expect(mockEvent.target.src).toBe('https://via.placeholder.com/400x300?text=No+Image');
  });

  it('should handle drag over event', () => {
    const mockEvent = new DragEvent('dragover');
    spyOn(mockEvent, 'preventDefault');
    
    component.onDragOver(mockEvent);
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(component.isDragOver()).toBeTrue();
  });

  it('should handle drag leave event', () => {
    const mockEvent = new DragEvent('dragleave');
    spyOn(mockEvent, 'preventDefault');
    
    component.onDragLeave(mockEvent);
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(component.isDragOver()).toBeFalse();
  });

  it('should buy now and navigate to cart', () => {
    component.product.set(mockProduct);
    spyOn(component, 'addToCart');
    
    component.buyNow();
    
    expect(component.addToCart).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/cart']);
  });

  it('should handle product loading error', () => {
    mockProductService.getProduct.and.returnValue(
      throwError(() => new Error('Failed to load'))
    );
    
    component.loadProduct(1);
    
    expect(component.loading()).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should upload files when files are selected', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Create a proper mock FileList
    const mockFileList = Object.create(FileList.prototype);
    Object.defineProperty(mockFileList, '0', { value: mockFile });
    Object.defineProperty(mockFileList, 'length', { value: 1 });
    mockFileList.item = jasmine.createSpy('item').and.returnValue(mockFile);
    
    const mockEvent = {
      target: {
        files: mockFileList
      }
    };
    
    const mockResponse = {
      originalname: 'test.jpg',
      filename: 'test-123.jpg',
      location: 'http://example.com/test-123.jpg'
    };
    
    mockProductService.uploadImage.and.returnValue(of(mockResponse));
    
    component.onFileSelected(mockEvent);
    
    expect(mockProductService.uploadImage).toHaveBeenCalledWith(mockFile);
  });
}); 