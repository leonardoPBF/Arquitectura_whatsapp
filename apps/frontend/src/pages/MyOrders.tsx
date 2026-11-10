import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Search, ArrowUpRight, ArrowLeft, ArrowRight, ChevronDown, CreditCard, Check, RefreshCw, ShoppingBag, MapPin, ReceiptText, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ordersAPI } from '@/services/api';
import { takePurchasedCart } from '@/lib/purchased-cart';
import { filterOrders } from '@/lib/order-history';
import type { HistoryOrder } from '@/lib/order-history';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import './MyOrders.css';

const statuses: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
const payments: Record<string, string> = { pending: 'Pendiente', paid: 'Pagado', failed: 'Fallido', refunded: 'Reembolsado' };
const sorts: Record<string, string> = { newest: 'Más recientes', oldest: 'Más antiguos', 'amount-high': 'Mayor importe', 'amount-low': 'Menor importe' };
const money = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
const dateLabel = (value: string) => Number.isNaN(Date.parse(value)) ? 'Fecha no disponible' : new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const pageSize = 6;

export default function MyOrders() {
  const { user } = useAuth();
  const { removePurchasedItems } = useCart();
  const [params, setParams] = useSearchParams();
  const status = Object.hasOwn(statuses, params.get('estado') || '') ? params.get('estado')! : 'all';
  const payment = Object.hasOwn(payments, params.get('pago') || '') ? params.get('pago')! : 'all';
  const period = ['7', '30', '90'].includes(params.get('periodo') || '') ? params.get('periodo')! : 'all';
  const sort = Object.hasOwn(sorts, params.get('orden') || '') ? params.get('orden')! : 'newest';
  const search = params.get('q') || '';
  const hasFilters = !!search || status !== 'all' || payment !== 'all' || period !== 'all';
  const update = (key: string, value: string) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (!value || value === 'all' || (key === 'orden' && value === 'newest')) next.delete(key); else next.set(key, value);
    if (key !== 'pagina') next.delete('pagina');
    return next;
  }, { replace: true });
  const reset = () => setParams({}, { replace: true });
  const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['customer-orders', user?.id, user?.customerId],
    queryFn: async (): Promise<HistoryOrder[]> => {
      const response = await ordersAPI.getAllOrders();
      if (!Array.isArray(response.data)) throw new Error('Respuesta de pedidos inválida');
      return response.data;
    }, enabled: !!user, refetchOnWindowFocus: true, refetchInterval: 30000,
  });
  const myOrders = (data || []).filter(order => (typeof order.customerId === 'string' ? order.customerId : order.customerId?._id) === user?.customerId);
  useEffect(() => {
    if (!user || !data) return;
    for (const order of data) if (order.paymentStatus === 'paid') {
      const purchased = takePurchasedCart(user.id, order._id);
      if (purchased.length) removePurchasedItems(purchased);
    }
  }, [data, user, removePurchasedItems]);
  const filtered = filterOrders(myOrders, { search, status, payment, period, sort });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number(params.get('pagina'));
  const page = Math.min(pages, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pending = myOrders.filter(order => order.status !== 'cancelled' && ['pending', 'failed'].includes(order.paymentStatus)).length;
  const paidTotal = myOrders.filter(order => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.totalAmount, 0);

  return <><Navbar /><main className="orders-page">
    <header className="orders-heading"><div><Link className="orders-back" to="/tienda"><ArrowLeft size={14} />Volver a la colección</Link><p className="orders-eyebrow">TU ESPACIO EN LUMINA</p><h1>Mis pedidos<span>.</span></h1><p>De tu primera elección hasta la entrega. Todo, en un solo lugar.</p></div><Button variant="outline" disabled={isFetching} onClick={() => refetch()}><RefreshCw size={15} className={isFetching ? 'mr-2 animate-spin' : 'mr-2'} />Actualizar</Button></header>
    {!isError && <section className="orders-stats" aria-label="Resumen de tus compras">{[{ label: 'Pedidos realizados', value: myOrders.length, icon: ShoppingBag }, { label: 'Por completar el pago', value: pending, icon: CreditCard }, { label: 'Entregados', value: myOrders.filter(order => order.status === 'delivered').length, icon: Package }, { label: 'Total pagado', value: money(paidTotal), icon: ReceiptText }].map(({ label, value, icon: Icon }) => <div className="orders-stat" key={label}><Icon size={18} strokeWidth={1.4} /><span>{label}</span><strong>{isLoading ? '—' : value}</strong></div>)}</section>}
    <section className="orders-filter-panel" aria-label="Filtros de pedidos">
      <div className="orders-search"><Search size={17} aria-hidden="true" /><input aria-label="Buscar pedido o producto" value={search} onChange={event => update('q', event.target.value)} placeholder="Buscar por pedido o producto…" />{search && <button aria-label="Limpiar búsqueda" onClick={() => update('q', '')}><X size={15} /></button>}</div>
      <div className="orders-filters">
        <label>Estado del pedido<select value={status} onChange={event => update('estado', event.target.value)}><option value="all">Todos los estados</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Estado del pago<select value={payment} onChange={event => update('pago', event.target.value)}><option value="all">Todos los pagos</option>{Object.entries(payments).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Período<select value={period} onChange={event => update('periodo', event.target.value)}><option value="all">Todo el historial</option><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option></select></label>
        <label>Ordenar por<select value={sort} onChange={event => update('orden', event.target.value)}>{Object.entries(sorts).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      </div>{hasFilters && <div className="orders-active-filters"><span>Filtros aplicados</span><button onClick={reset}>Limpiar filtros<X size={13} /></button></div>}
    </section>
    <div className="orders-results"><p aria-live="polite">{isLoading ? 'Cargando tus pedidos…' : isError ? 'Historial no disponible' : `${filtered.length} ${filtered.length === 1 ? 'pedido' : 'pedidos'}${hasFilters ? ` de ${myOrders.length}` : ' en tu historial'}`}</p>{!isError && !!dataUpdatedAt && <span>Actualizado a las {new Date(dataUpdatedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>}</div>
    {isLoading ? <div role="status" className="orders-empty"><RefreshCw className="animate-spin" size={25} /><p>Preparando tu historial…</p></div> : isError ? <div role="alert" className="orders-empty"><Package size={30} /><h2>No pudimos cargar tus pedidos</h2><p>Tu historial estará aquí cuando se restablezca la conexión.</p><Button onClick={() => refetch()}>Reintentar</Button></div> : !filtered.length ? <div className="orders-empty"><Search size={30} /><h2>{myOrders.length ? 'No encontramos coincidencias' : 'Tu historia comienza aquí'}</h2><p>{myOrders.length ? 'Prueba con otro producto, número de pedido o ajusta los filtros.' : 'Explora la colección. Tus próximos pedidos aparecerán en este espacio.'}</p>{hasFilters ? <Button variant="outline" onClick={reset}>Limpiar filtros</Button> : <Button asChild><Link to="/tienda">Explorar productos<ArrowUpRight size={15} className="ml-2" /></Link></Button>}</div> : <>
      <div className="orders-grid">{visible.map(order => {
        const items = order.items || [];
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        const payable = order.status !== 'cancelled' && ['pending', 'failed'].includes(order.paymentStatus);
        const stages = ['confirmed', 'preparing', 'shipped', 'delivered'];
        const stage = stages.indexOf(order.status);
        return <article className="order-card" key={order._id} aria-label={`Pedido ${order.orderNumber}`}>
          <div className="order-card-top"><div><span className="orders-eyebrow">PEDIDO</span><h2>{order.orderNumber}</h2><time dateTime={order.createdAt}>{dateLabel(order.createdAt)}</time></div><div className="order-amount"><span>Total del pedido</span><strong>{money(order.totalAmount)}</strong></div></div>
          <div className="order-badges"><span className={`order-badge order-status-${order.status}`}><span />{statuses[order.status] || order.status}</span><span className={`order-badge order-payment-${order.paymentStatus}`}>{order.paymentStatus === 'paid' ? <Check size={13} /> : <CreditCard size={13} />}{payments[order.paymentStatus] || order.paymentStatus}</span></div>
          <div className="order-preview"><div className="order-package"><Package size={22} strokeWidth={1.3} /></div><div><p>{items[0]?.productName || 'Detalle del pedido'}</p><span>{count} {count === 1 ? 'unidad' : 'unidades'}{items.length > 1 ? ` · ${items.length - 1} ${items.length === 2 ? 'producto más' : 'productos más'}` : ''}</span></div></div>
          {stage >= 0 && <ol className="order-progress" aria-label="Progreso del pedido">{stages.map((step, index) => <li key={step} className={index <= stage ? 'reached' : ''} aria-current={index === stage ? 'step' : undefined}><span>{index < stage ? <Check size={11} /> : index + 1}</span><small>{['Confirmado', 'Preparando', 'Enviado', 'Entregado'][index]}</small></li>)}</ol>}
          <details className="order-details"><summary>Ver detalles del pedido<ChevronDown size={16} /></summary><div className="order-details-body"><ul>{items.map((item, index) => <li key={`${item.productId || index}`}><div><strong>{item.productName}</strong><span>{item.quantity} × {money(item.price)}</span></div><b>{money(item.price * item.quantity)}</b></li>)}</ul>{order.deliveryAddress && <div className="order-address"><MapPin size={15} /><p><span>Dirección de entrega</span>{order.deliveryAddress}</p></div>}{order.notes && <p className="order-notes">{order.notes}</p>}</div></details>
          <footer className="order-card-footer"><span>{order.paymentStatus === 'paid' ? 'Pago confirmado' : order.status === 'cancelled' ? 'Este pedido está cancelado' : order.paymentStatus === 'refunded' ? 'Pago reembolsado' : order.paymentLock ? 'Tu pago necesita revisión' : 'Tu pedido te está esperando'}</span>{payable ? <Button asChild size="sm"><Link to={`/checkout?order=${encodeURIComponent(order._id)}`}>{order.paymentLock ? 'Revisar pago' : order.paymentStatus === 'failed' ? 'Reintentar pago' : 'Continuar al pago'}<ArrowUpRight size={14} className="ml-2" /></Link></Button> : order.paymentStatus === 'paid' ? <Link className="order-receipt" to={`/success?order=${encodeURIComponent(order._id)}`}>Ver pago<ArrowUpRight size={14} /></Link> : null}</footer>
        </article>;
      })}</div>
      {pages > 1 && <nav className="orders-pagination" aria-label="Páginas de pedidos"><Button variant="outline" disabled={page === 1} onClick={() => update('pagina', String(page - 1))}><ArrowLeft size={15} className="mr-2" />Anterior</Button><span aria-live="polite">Página {page} de {pages}</span><Button variant="outline" disabled={page === pages} onClick={() => update('pagina', String(page + 1))}>Siguiente<ArrowRight size={15} className="ml-2" /></Button></nav>}
    </>}
  </main></>;
}
