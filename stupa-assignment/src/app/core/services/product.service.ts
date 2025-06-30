import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Apollo, gql } from 'apollo-angular';
import { Product, ProductFilter, PaginationParams } from '../models/product.model';

const GET_PRODUCTS = gql`
  query GetProducts($offset: Int, $limit: Int) {
    products(offset: $offset, limit: $limit) {
      id
      title
      price
      description
      images
      category {
        id
        name
        image
      }
      creationAt
      updatedAt
    }
  }
`;

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      price
      description
      images
      category {
        id
        name
        image
      }
      creationAt
      updatedAt
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = 'https://api.escuelajs.co/api/v1';
  
  private sortBySubject = new BehaviorSubject<'asc' | 'desc'>('asc');
  public sortBy$ = this.sortBySubject.asObservable();

  constructor(
    private http: HttpClient,
    private apollo: Apollo
  ) {}

  getProducts(pagination: PaginationParams, filters?: ProductFilter): Observable<Product[]> {
    let params = new HttpParams()
      .set('offset', pagination.offset.toString())
      .set('limit', pagination.limit.toString());

    if (filters?.categoryId) {
      params = params.set('categoryId', filters.categoryId.toString());
    }
    if (filters?.title) {
      params = params.set('title', filters.title);
    }
    if (filters?.price_min) {
      params = params.set('price_min', filters.price_min.toString());
    }
    if (filters?.price_max) {
      params = params.set('price_max', filters.price_max.toString());
    }

    const finalUrl = `${this.API_URL}/products`;
    return this.http.get<Product[]>(finalUrl, { params });
  }

  getProductsGraphQL(offset: number = 0, limit: number = 12): Observable<any> {
    return this.apollo.query({
      query: GET_PRODUCTS,
      variables: { offset, limit },
      fetchPolicy: 'network-only' 
    });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/products/${id}`);
  }

  getProductGraphQL(id: string): Observable<any> {
    return this.apollo.query({
      query: GET_PRODUCT,
      variables: { id },
      fetchPolicy: 'network-only' 
    });
  }

  getCategories(): Observable<any[]> {
    const params = new HttpParams().set('limit', '20');
    return this.http.get<any[]>(`${this.API_URL}/categories`, { params });
  }

  uploadImage(file: File): Observable<{originalname: string, filename: string, location: string}> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{originalname: string, filename: string, location: string}>(`${this.API_URL}/files/upload`, formData);
  }

  setSortBy(sortBy: 'asc' | 'desc'): void {
    this.sortBySubject.next(sortBy);
  }

  getSortBy(): 'asc' | 'desc' {
    return this.sortBySubject.value;
  }
} 