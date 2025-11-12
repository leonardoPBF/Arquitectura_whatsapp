import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/services/api';

export interface Customer {
  _id: string;
  phone: string;
  name: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  createdAt: string;
}

export interface AnalyticsData {
  topCustomers: Customer[];
  abandonedCarts: Order[];
  totalRevenue: number;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

export const useAnalytics = () => {
  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await analyticsAPI.getAllCustomers();
      return response.data as Customer[];
    },
  });

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await analyticsAPI.getAllOrders();
      return response.data as Order[];
    },
  });

  const isLoading = loadingCustomers || loadingOrders;

  // Calculate analytics
  const analytics: (AnalyticsData & { orders?: Order[] }) | null = customers && orders ? {
    // Top customers by totalSpent
    topCustomers: [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10),

    // Abandoned carts: orders with status pending and paymentStatus pending
    abandonedCarts: orders.filter(
      (order) => order.status === 'pending' && order.paymentStatus === 'pending'
    ),

    // Total revenue from paid orders
    totalRevenue: orders
      .filter((order) => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.totalAmount, 0),

    // Total orders
    totalOrders: orders.length,

    // Orders by status
    ordersByStatus: orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),

    // Revenue by month
    revenueByMonth: (() => {
      const monthlyRevenue: Record<string, number> = {};
      orders
        .filter((order) => order.paymentStatus === 'paid')
        .forEach((order) => {
          const date = new Date(order.createdAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.totalAmount;
        });

      return Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Last 12 months
    })(),
    
    // Include orders for components that need them
    orders,
  } : null;

  return {
    analytics,
    isLoading,
    customers,
    orders,
  };
};

