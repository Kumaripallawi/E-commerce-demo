export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: {
    id: number;
    name: string;
    image: string;
  };
  images: string[];
  creationAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants?: { [key: string]: string };
}

export interface ProductFilter {
  categoryId?: number;
  title?: string;
  price_min?: number;
  price_max?: number;
}

export interface PaginationParams {
  offset: number;
  limit: number;
} 