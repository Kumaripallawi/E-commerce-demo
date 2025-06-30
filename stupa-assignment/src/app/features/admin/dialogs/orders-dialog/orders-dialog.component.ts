import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog.component';

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  shippingAddress: string;
}

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

@Component({
  selector: 'app-orders-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './orders-dialog.component.html',
  styleUrl: './orders-dialog.component.scss'
})
export class OrdersDialogComponent implements OnInit {
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<OrdersDialogComponent>);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  orders = signal<Order[]>([]);
  loading = signal(false);
  updatingOrder = signal<number | null>(null);

  // Computed properties for order counts
  pendingOrders = computed(() => 
    this.orders().filter(order => order.status === 'pending').length
  );
  processingOrders = computed(() => 
    this.orders().filter(order => order.status === 'processing').length
  );
  shippedOrders = computed(() => 
    this.orders().filter(order => order.status === 'shipped').length
  );
  deliveredOrders = computed(() => 
    this.orders().filter(order => order.status === 'delivered').length
  );
  totalOrders = computed(() => this.orders().length);
  totalRevenue = computed(() => 
    this.orders().reduce((sum, order) => sum + order.total, 0)
  );

  displayedColumns: string[] = ['id', 'customer', 'items', 'total', 'status', 'date', 'actions'];
  
  statusOptions = [
    { value: 'pending', label: 'Pending', icon: 'schedule' },
    { value: 'processing', label: 'Processing', icon: 'hourglass_empty' },
    { value: 'shipped', label: 'Shipped', icon: 'local_shipping' },
    { value: 'delivered', label: 'Delivered', icon: 'check_circle' },
    { value: 'cancelled', label: 'Cancelled', icon: 'cancel' }
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    
    // Since there's no real orders API, I'll generate mock data
    setTimeout(() => {
      const mockOrders: Order[] = [
        {
          id: 1001,
          customerId: 1,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          items: [
            {
              productId: 1,
              productName: 'Wireless Headphones',
              quantity: 1,
              price: 99.99,
              image: 'https://picsum.photos/50/50?random=1'
            },
            {
              productId: 2,
              productName: 'Smartphone Case',
              quantity: 2,
              price: 19.99,
              image: 'https://picsum.photos/50/50?random=2'
            }
          ],
          total: 139.97,
          status: 'pending',
          orderDate: new Date('2024-01-15'),
          shippingAddress: '123 Main St, City, State 12345'
        },
        {
          id: 1002,
          customerId: 2,
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          items: [
            {
              productId: 3,
              productName: 'Laptop Stand',
              quantity: 1,
              price: 49.99,
              image: 'https://picsum.photos/50/50?random=3'
            }
          ],
          total: 49.99,
          status: 'shipped',
          orderDate: new Date('2024-01-14'),
          shippingAddress: '456 Oak Ave, City, State 67890'
        },
        {
          id: 1003,
          customerId: 3,
          customerName: 'Mike Johnson',
          customerEmail: 'mike@example.com',
          items: [
            {
              productId: 4,
              productName: 'Wireless Mouse',
              quantity: 1,
              price: 29.99,
              image: 'https://picsum.photos/50/50?random=4'
            },
            {
              productId: 5,
              productName: 'Keyboard',
              quantity: 1,
              price: 79.99,
              image: 'https://picsum.photos/50/50?random=5'
            }
          ],
          total: 109.98,
          status: 'delivered',
          orderDate: new Date('2024-01-13'),
          shippingAddress: '789 Pine St, City, State 13579'
        },
        {
          id: 1004,
          customerId: 4,
          customerName: 'Sarah Williams',
          customerEmail: 'sarah@example.com',
          items: [
            {
              productId: 6,
              productName: 'Tablet',
              quantity: 1,
              price: 299.99,
              image: 'https://picsum.photos/50/50?random=6'
            }
          ],
          total: 299.99,
          status: 'processing',
          orderDate: new Date('2024-01-16'),
          shippingAddress: '321 Elm St, City, State 24680'
        }
      ];

      this.orders.set(mockOrders);
      this.loading.set(false);
    }, 1000);
  }

  updateOrderStatus(orderId: number, newStatus: string): void {
    this.updatingOrder.set(orderId);
    
    // Simulate API call
    setTimeout(() => {
      this.orders.update(orders => 
        orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as Order['status'] }
            : order
        )
      );
      
      this.updatingOrder.set(null);
      this.showSuccess(`Order #${orderId} status updated to ${newStatus}`);
    }, 500);
  }

  viewOrderDetails(order: Order): void {
    const items = order.items.map(item => 
      `• ${item.productName} (x${item.quantity}) - $${item.price}`
    ).join('\n');
    
    const message = `
Order Details:
Customer: ${order.customerName} (${order.customerEmail})
Items:
${items}
Total: $${order.total}
Shipping Address: ${order.shippingAddress}
    `.trim();

    const confirmationData: ConfirmationDialogData = {
      title: `Order #${order.id} Details`,
      message: message,
      confirmText: 'Close',
      cancelText: '',
      type: 'info'
    };

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: confirmationData
    });
  }

  cancelOrder(order: Order): void {
    if (order.status === 'delivered' || order.status === 'cancelled') {
      this.showError('Cannot cancel a delivered or already cancelled order');
      return;
    }

    const confirmationData: ConfirmationDialogData = {
      title: 'Cancel Order',
      message: `Are you sure you want to cancel order #${order.id} for ${order.customerName}? This action cannot be undone.`,
      confirmText: 'Cancel Order',
      cancelText: 'Keep Order',
      type: 'warning'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: confirmationData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.updateOrderStatus(order.id, 'cancelled');
      }
    });
  }

  getStatusIcon(status: string): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption?.icon || 'help_outline';
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  }

  onClose(): void {
    this.dialogRef.close();
  }

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