import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { customersAPI, ordersAPI, paymentsAPI, productsAPI } from '@/services/api';
import { Users, Package, CreditCard, ShoppingBag, Plus, Edit, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Customer {
  _id: string;
  phone: string;
  name: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string | Customer;
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
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
}

interface Payment {
  _id: string;
  orderId: string | Order;
  orderNumber: string;
  customerId: string | Customer;
  amount: number;
  gateway: string;
  method: 'card' | 'billetera_movil' | 'pagoefectivo';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'expired';
  transactionId?: string;
  receiptUrl?: string;
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'] as const;
const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded', 'expired'] as const;
const PAYMENT_METHODS = ['card', 'billetera_movil', 'pagoefectivo'] as const;

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    preparing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    refunded: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const PRODUCT_CATEGORIES = [
  'Tecnología', 'Audio', 'Gaming', 'Smart Home', 'Lectura', 'Fitness', 
  'Almacenamiento', 'Periféricos', 'Monitores', 'Accesorios'
] as const;

export default function Admin() {
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);

  // Form states
  const [customerForm, setCustomerForm] = useState({ phone: '', name: '', email: '', address: '' });
  const [orderForm, setOrderForm] = useState({ status: 'pending', paymentStatus: 'pending', deliveryAddress: '', notes: '' });
  const [paymentForm, setPaymentForm] = useState({ status: 'pending', method: 'card', amount: 0 });
  const [productForm, setProductForm] = useState({ 
    name: '', 
    description: '', 
    price: 0, 
    stock: 0, 
    category: 'Tecnología', 
    imageUrl: '', 
    isActive: true 
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'customers') {
        const res = await customersAPI.getAllCustomers();
        setCustomers(res.data);
      } else if (activeTab === 'orders') {
        const res = await ordersAPI.getAllOrders();
        setOrders(res.data);
      } else if (activeTab === 'payments') {
        const res = await paymentsAPI.getAllPayments();
        setPayments(res.data);
      } else if (activeTab === 'products') {
        const res = await productsAPI.getAllProducts();
        setProducts(res.data);
      }
    } catch (error: any) {
      toast.error(`Error al cargar datos: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (activeTab === 'customers') {
      setEditingItem(null);
      setCustomerForm({ phone: '', name: '', email: '', address: '' });
      setCustomerDialogOpen(true);
    } else if (activeTab === 'orders') {
      toast.error('Para crear una orden, use el flujo de checkout');
    } else if (activeTab === 'payments') {
      setEditingItem(null);
      setPaymentForm({ status: 'pending', method: 'card', amount: 0 });
      setPaymentDialogOpen(true);
    } else if (activeTab === 'products') {
      setEditingItem(null);
      setProductForm({ 
        name: '', 
        description: '', 
        price: 0, 
        stock: 0, 
        category: 'Tecnología', 
        imageUrl: '', 
        isActive: true 
      });
      setProductDialogOpen(true);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'customers') {
      setCustomerForm({
        phone: item.phone || '',
        name: item.name || '',
        email: item.email || '',
        address: item.address || '',
      });
      setCustomerDialogOpen(true);
    } else if (activeTab === 'orders') {
      setOrderForm({
        status: item.status || 'pending',
        paymentStatus: item.paymentStatus || 'pending',
        deliveryAddress: item.deliveryAddress || '',
        notes: item.notes || '',
      });
      setOrderDialogOpen(true);
    } else if (activeTab === 'payments') {
      setPaymentForm({
        status: item.status || 'pending',
        method: item.method || 'card',
        amount: item.amount || 0,
      });
      setPaymentDialogOpen(true);
    } else if (activeTab === 'products') {
      setProductForm({
        name: item.name || '',
        description: item.description || '',
        price: item.price || 0,
        stock: item.stock || 0,
        category: item.category || 'Tecnología',
        imageUrl: item.imageUrl || '',
        isActive: item.isActive !== undefined ? item.isActive : true,
      });
      setProductDialogOpen(true);
    }
  };

  const handleSaveCustomer = async () => {
    try {
      if (editingItem) {
        await customersAPI.updateCustomer(editingItem._id, customerForm);
        toast.success('Cliente actualizado');
      } else {
        await customersAPI.createCustomer(customerForm);
        toast.success('Cliente creado');
      }
      setCustomerDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSaveOrder = async () => {
    try {
      if (editingItem) {
        await ordersAPI.updateOrder(editingItem._id, orderForm);
        toast.success('Orden actualizada');
        setOrderDialogOpen(false);
        loadData();
      }
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSavePayment = async () => {
    try {
      if (editingItem) {
        await paymentsAPI.updatePayment(editingItem._id, paymentForm);
        toast.success('Pago actualizado');
        setPaymentDialogOpen(false);
        loadData();
      } else {
        toast.error('Para crear un pago, use el flujo de checkout');
      }
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSaveProduct = async () => {
    try {
      if (editingItem) {
        await productsAPI.updateProduct(editingItem._id, productForm);
        toast.success('Producto actualizado');
      } else {
        await productsAPI.createProduct(productForm);
        toast.success('Producto creado');
      }
      setProductDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'customer') {
        await customersAPI.deleteCustomer(itemToDelete.id);
      } else if (itemToDelete.type === 'order') {
        await ordersAPI.deleteOrder(itemToDelete.id);
      } else if (itemToDelete.type === 'payment') {
        await paymentsAPI.deletePayment(itemToDelete.id);
      } else if (itemToDelete.type === 'product') {
        await productsAPI.deleteProduct(itemToDelete.id);
      }
      toast.success('Eliminado correctamente');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateStatus = async (type: string, id: string, status: string) => {
    try {
      if (type === 'order') {
        await ordersAPI.updateOrderStatus(id, status);
        toast.success('Estado actualizado');
      } else if (type === 'payment') {
        await paymentsAPI.updatePaymentStatus(id, status);
        toast.success('Estado actualizado');
      }
      loadData();
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof o.customerId === 'object' && o.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPayments = payments.filter(p =>
    p.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-[hsl(200_20%_12%)] dark:via-[hsl(200_18%_14%)] dark:to-[hsl(200_15%_16%)] p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#10B981] to-[#14B8A6] bg-clip-text text-transparent">
              Panel de Administración
            </h1>
            <p className="text-emerald-700 dark:text-emerald-300 mt-2 font-medium">
              Gestiona usuarios, órdenes y pagos
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="bg-white dark:bg-[hsl(220_13%_22%)]">
                <TabsTrigger value="customers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#10B981] data-[state=active]:to-[#14B8A6] data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Usuarios
                </TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#10B981] data-[state=active]:to-[#14B8A6] data-[state=active]:text-white">
                  <Package className="w-4 h-4 mr-2" />
                  Órdenes
                </TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#10B981] data-[state=active]:to-[#14B8A6] data-[state=active]:text-white">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagos
                </TabsTrigger>
                <TabsTrigger value="products" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#10B981] data-[state=active]:to-[#14B8A6] data-[state=active]:text-white">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Productos
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={handleCreate} className="bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  {activeTab === 'customers' ? 'Nuevo Usuario' : 
                   activeTab === 'orders' ? 'Nueva Orden' : 
                   activeTab === 'payments' ? 'Nuevo Pago' : 
                   'Nuevo Producto'}
                </Button>
              </div>
            </div>

            <TabsContent value="customers" className="space-y-4">
              <Card className="bg-white dark:bg-[hsl(220_13%_22%)] border-[hsl(var(--border))]">
                <CardHeader>
                  <CardTitle>Usuarios ({filteredCustomers.length})</CardTitle>
                  <CardDescription>Gestiona los clientes del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Cargando...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left p-3 font-semibold">Teléfono</th>
                            <th className="text-left p-3 font-semibold">Nombre</th>
                            <th className="text-left p-3 font-semibold">Email</th>
                            <th className="text-left p-3 font-semibold">Pedidos</th>
                            <th className="text-left p-3 font-semibold">Total Gastado</th>
                            <th className="text-right p-3 font-semibold">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCustomers.map((customer) => (
                            <tr key={customer._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="p-3">{customer.phone}</td>
                              <td className="p-3 font-medium">{customer.name}</td>
                              <td className="p-3">{customer.email || '-'}</td>
                              <td className="p-3">{customer.totalOrders}</td>
                              <td className="p-3">S/ {customer.totalSpent.toFixed(2)}</td>
                              <td className="p-3">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setItemToDelete({ type: 'customer', id: customer._id, name: customer.name });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card className="bg-white dark:bg-[hsl(220_13%_22%)] border-[hsl(var(--border))]">
                <CardHeader>
                  <CardTitle>Órdenes ({filteredOrders.length})</CardTitle>
                  <CardDescription>Gestiona las órdenes del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Cargando...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left p-3 font-semibold">Número</th>
                            <th className="text-left p-3 font-semibold">Cliente</th>
                            <th className="text-left p-3 font-semibold">Total</th>
                            <th className="text-left p-3 font-semibold">Estado</th>
                            <th className="text-left p-3 font-semibold">Pago</th>
                            <th className="text-left p-3 font-semibold">Fecha</th>
                            <th className="text-right p-3 font-semibold">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order) => (
                            <tr key={order._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="p-3 font-medium">{order.orderNumber}</td>
                              <td className="p-3">
                                {typeof order.customerId === 'object' ? order.customerId?.name : order.customerPhone}
                              </td>
                              <td className="p-3">S/ {order.totalAmount.toFixed(2)}</td>
                              <td className="p-3">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateStatus('order', order._id, e.target.value)}
                                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)} border-0`}
                                >
                                  {ORDER_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                                  {order.paymentStatus}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-gray-500">
                                {format(new Date(order.createdAt), 'dd/MM/yyyy')}
                              </td>
                              <td className="p-3">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setItemToDelete({ type: 'order', id: order._id, name: order.orderNumber });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card className="bg-white dark:bg-[hsl(220_13%_22%)] border-[hsl(var(--border))]">
                <CardHeader>
                  <CardTitle>Pagos ({filteredPayments.length})</CardTitle>
                  <CardDescription>Gestiona los pagos del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Cargando...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left p-3 font-semibold">Orden</th>
                            <th className="text-left p-3 font-semibold">Monto</th>
                            <th className="text-left p-3 font-semibold">Método</th>
                            <th className="text-left p-3 font-semibold">Estado</th>
                            <th className="text-left p-3 font-semibold">Transacción</th>
                            <th className="text-left p-3 font-semibold">Fecha</th>
                            <th className="text-right p-3 font-semibold">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((payment) => (
                            <tr key={payment._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="p-3 font-medium">{payment.orderNumber}</td>
                              <td className="p-3">S/ {payment.amount.toFixed(2)}</td>
                              <td className="p-3">{payment.method}</td>
                              <td className="p-3">
                                <select
                                  value={payment.status}
                                  onChange={(e) => handleUpdateStatus('payment', payment._id, e.target.value)}
                                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)} border-0`}
                                >
                                  {PAYMENT_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3 text-sm">{payment.transactionId || '-'}</td>
                              <td className="p-3 text-sm text-gray-500">
                                {format(new Date(payment.createdAt), 'dd/MM/yyyy')}
                              </td>
                              <td className="p-3">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(payment)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setItemToDelete({ type: 'payment', id: payment._id, name: payment.orderNumber });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card className="bg-white dark:bg-[hsl(220_13%_22%)] border-[hsl(var(--border))]">
                <CardHeader>
                  <CardTitle>Productos ({filteredProducts.length})</CardTitle>
                  <CardDescription>Gestiona los productos del catálogo</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Cargando...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left p-3 font-semibold">Nombre</th>
                            <th className="text-left p-3 font-semibold">Categoría</th>
                            <th className="text-left p-3 font-semibold">Precio</th>
                            <th className="text-left p-3 font-semibold">Stock</th>
                            <th className="text-left p-3 font-semibold">Estado</th>
                            <th className="text-right p-3 font-semibold">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => (
                            <tr key={product._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="p-3 font-medium">{product.name}</td>
                              <td className="p-3">{product.category}</td>
                              <td className="p-3">S/ {product.price.toFixed(2)}</td>
                              <td className="p-3">{product.stock}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  product.isActive 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {product.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setItemToDelete({ type: 'product', id: product._id, name: product.name });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Customer Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="bg-white dark:bg-[hsl(220_13%_22%)]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Modifica los datos del usuario' : 'Completa los datos del nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Teléfono *</label>
              <Input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="999999999"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="Nombre completo"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Dirección</label>
              <Input
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                placeholder="Dirección completa"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCustomerDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCustomer} className="bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:opacity-90">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="bg-white dark:bg-[hsl(220_13%_22%)]">
          <DialogHeader>
            <DialogTitle>Editar Orden</DialogTitle>
            <DialogDescription>Modifica el estado y detalles de la orden</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Estado</label>
              <select
                value={orderForm.status}
                onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Estado de Pago</label>
              <select
                value={orderForm.paymentStatus}
                onChange={(e) => setOrderForm({ ...orderForm, paymentStatus: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="refunded">refunded</option>
                <option value="failed">failed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Dirección de Entrega</label>
              <Input
                value={orderForm.deliveryAddress}
                onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })}
                placeholder="Dirección"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notas</label>
              <Input
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                placeholder="Notas adicionales"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOrderDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveOrder} className="bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:opacity-90">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-white dark:bg-[hsl(220_13%_22%)]">
          <DialogHeader>
            <DialogTitle>Editar Pago</DialogTitle>
            <DialogDescription>Modifica los datos del pago</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Estado</label>
              <select
                value={paymentForm.status}
                onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                {PAYMENT_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Método</label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Monto</label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePayment} className="bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:opacity-90">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="bg-white dark:bg-[hsl(220_13%_22%)] max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Modifica los datos del producto' : 'Completa los datos del nuevo producto'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Nombre del producto"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción *</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Descripción del producto"
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Precio (S/) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stock *</label>
                <Input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Categoría *</label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
              >
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">URL de Imagen</label>
              <Input
                type="url"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={productForm.isActive}
                onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Producto activo
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProductDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProduct} className="bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:opacity-90">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-[hsl(220_13%_22%)]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar {itemToDelete?.name}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

