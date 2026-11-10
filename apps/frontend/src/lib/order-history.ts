export interface HistoryOrder {
  _id: string; orderNumber: string; customerId: string | { _id: string };
  status: string; paymentStatus: string; paymentLock?: boolean;
  totalAmount: number; createdAt: string; deliveryAddress?: string; notes?: string;
  items?: { productId?: string; productName: string; quantity: number; price: number }[];
}
export interface OrderFilters { search: string; status: string; payment: string; period: string; sort: string }
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
export function filterOrders(orders: HistoryOrder[], filters: OrderFilters, now = Date.now()) {
  const term = normalize(filters.search);
  const days = ['7', '30', '90'].includes(filters.period) ? Number(filters.period) : 0;
  return orders.filter(order => {
    const date = Date.parse(order.createdAt);
    return (!term || normalize([order.orderNumber, ...(order.items || []).map(item => item.productName)].join(' ')).includes(term)) &&
      (filters.status === 'all' || order.status === filters.status) && (filters.payment === 'all' || order.paymentStatus === filters.payment) &&
      (!days || (date >= now - days * 86400000 && date <= now));
  }).sort((a, b) => {
    const dates = (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
    const diff = filters.sort === 'oldest' ? dates : filters.sort === 'amount-high' ? b.totalAmount - a.totalAmount : filters.sort === 'amount-low' ? a.totalAmount - b.totalAmount : -dates;
    return diff || b.orderNumber.localeCompare(a.orderNumber, 'es', { numeric: true });
  });
}
