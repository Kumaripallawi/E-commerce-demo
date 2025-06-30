import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../../../core/models/product.model';

interface Category {
  id: number;
  name: string;
  image: string;
}

interface ProductDialogData {
  product?: Product;
  isEdit: boolean;
}

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './product-dialog.component.html',
  styleUrl: './product-dialog.component.scss'
})
export class ProductDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<ProductDialogComponent>);
  
  data = inject(MAT_DIALOG_DATA) as ProductDialogData;
  
  productForm: FormGroup;
  categories = signal<Category[]>([]);
  loading = signal(false);
  submitting = signal(false);

  constructor() {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      categoryId: ['', Validators.required],
      images: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    
    if (this.data.isEdit && this.data.product) {
      this.populateForm(this.data.product);
    }
  }

  loadCategories(): void {
    this.loading.set(true);
    this.http.get<Category[]>('https://api.escuelajs.co/api/v1/categories').subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading.set(false);
      }
    });
  }

  populateForm(product: Product): void {
    this.productForm.patchValue({
      title: product.title,
      price: product.price,
      description: product.description,
      categoryId: product.category?.id || '',
      images: product.images?.join(', ') || ''
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.submitting.set(true);
      
      const formValue = this.productForm.value;
      const productData = {
        title: formValue.title,
        price: Number(formValue.price),
        description: formValue.description,
        categoryId: Number(formValue.categoryId),
        images: formValue.images ? formValue.images.split(',').map((img: string) => img.trim()) : []
      };

      if (this.data.isEdit && this.data.product) {
        this.updateProduct(this.data.product.id, productData);
      } else {
        this.createProduct(productData);
      }
    }
  }

  createProduct(productData: any): void {
    this.http.post('https://api.escuelajs.co/api/v1/products/', productData).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error creating product:', error);
        this.submitting.set(false);
      }
    });
  }

  updateProduct(productId: number, productData: any): void {
    this.http.put(`https://api.escuelajs.co/api/v1/products/${productId}`, productData).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error updating product:', error);
        this.submitting.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get title() { return this.productForm.get('title'); }
  get price() { return this.productForm.get('price'); }
  get description() { return this.productForm.get('description'); }
  get categoryId() { return this.productForm.get('categoryId'); }
} 