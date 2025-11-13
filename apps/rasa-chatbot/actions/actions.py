from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import requests
from datetime import datetime, timedelta

# Configuración de la API
API_BASE_URL = "http://localhost:3000/api"

# ============================================
# ACCIONES DE ÓRDENES Y PEDIDOS
# ============================================

class ActionGetOrders(Action):
    def name(self) -> Text:
        return "action_get_orders"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                total = len(orders)
                
                # Ordenar por fecha (más recientes primero)
                sorted_orders = sorted(orders, key=lambda x: x.get('createdAt', ''), reverse=True)
                recent = sorted_orders[:5]
                
                msg = f"📦 Tienes {total} órdenes en total.\n\n"
                msg += f"📋 Últimas {len(recent)} órdenes:\n\n"
                for order in recent:
                    msg += f"• {order.get('orderNumber', 'N/A')}: S/ {order.get('totalAmount', 0):.2f} - {order.get('status', 'N/A')}\n"
                
                dispatcher.utter_message(text=msg)
            else:
                dispatcher.utter_message(text="❌ No pude obtener las órdenes.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetOrderStatus(Action):
    def name(self) -> Text:
        return "action_get_order_status"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        order_id = tracker.get_slot("order_id")
        order_number = tracker.get_slot("order_number")
        
        if not order_id and not order_number:
            dispatcher.utter_message(text="Por favor, indícame el número de orden.")
            return []
        
        try:
            # Buscar por order_number si está disponible
            if order_number:
                response = requests.get(f"{API_BASE_URL}/orders")
                if response.status_code == 200:
                    orders = response.json()
                    order = next((o for o in orders if o.get('orderNumber') == order_number), None)
                    if order:
                        status = order.get('status', 'desconocido')
                        payment_status = order.get('paymentStatus', 'desconocido')
                        total = order.get('totalAmount', 0)
                        
                        dispatcher.utter_message(
                            text=f"📦 Orden {order_number}:\n"
                                 f"Estado: {status}\n"
                                 f"Pago: {payment_status}\n"
                                 f"Total: S/ {total:.2f}"
                        )
                    else:
                        dispatcher.utter_message(text=f"❌ No encontré la orden {order_number}.")
            else:
                response = requests.get(f"{API_BASE_URL}/orders/{order_id}")
                if response.status_code == 200:
                    order = response.json()
                    dispatcher.utter_message(text=f"Estado de la orden: {order['status']}")
                else:
                    dispatcher.utter_message(text="❌ No encontré la orden.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetPendingOrders(Action):
    def name(self) -> Text:
        return "action_get_pending_orders"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                pending = [o for o in orders if o.get('paymentStatus') == 'pending']
                
                if pending:
                    msg = f"📦 Tienes {len(pending)} órdenes pendientes:\n\n"
                    for order in pending[:5]:  # Máximo 5
                        msg += f"• {order['orderNumber']}: S/ {order['totalAmount']:.2f}\n"
                    dispatcher.utter_message(text=msg)
                else:
                    dispatcher.utter_message(text="✅ No tienes órdenes pendientes.")
            else:
                dispatcher.utter_message(text="❌ No pude obtener las órdenes.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetRecentOrders(Action):
    def name(self) -> Text:
        return "action_get_recent_orders"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                # Ordenar por fecha (más recientes primero)
                sorted_orders = sorted(orders, key=lambda x: x.get('createdAt', ''), reverse=True)
                recent = sorted_orders[:5]
                
                msg = f"📦 Últimas {len(recent)} órdenes:\n\n"
                for order in recent:
                    msg += f"• {order['orderNumber']}: S/ {order['totalAmount']:.2f} - {order['status']}\n"
                
                dispatcher.utter_message(text=msg)
            else:
                dispatcher.utter_message(text="❌ No pude obtener las órdenes.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetMostExpensiveOrder(Action):
    def name(self) -> Text:
        return "action_get_most_expensive_order"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            orders_resp = requests.get(f"{API_BASE_URL}/orders")
            customers_resp = requests.get(f"{API_BASE_URL}/customers")
            
            if orders_resp.status_code == 200 and customers_resp.status_code == 200:
                orders = orders_resp.json()
                customers = customers_resp.json()
                
                if orders:
                    # Encontrar la orden más cara
                    most_expensive = max(orders, key=lambda x: x.get('totalAmount', 0))
                    
                    # Obtener información del cliente
                    customer_id = most_expensive.get('customerId')
                    customer = next((c for c in customers if (c.get('_id') or c.get('id')) == customer_id), None)
                    customer_name = customer.get('name', 'Cliente desconocido') if customer else 'Cliente desconocido'
                    
                    msg = f"💰 **Orden de Compra Más Cara:**\n\n"
                    msg += f"Número: {most_expensive.get('orderNumber', 'N/A')}\n"
                    msg += f"Cliente: {customer_name}\n"
                    msg += f"Total: S/ {most_expensive.get('totalAmount', 0):.2f}\n"
                    msg += f"Estado: {most_expensive.get('status', 'N/A')}\n"
                    msg += f"Pago: {most_expensive.get('paymentStatus', 'N/A')}\n"
                    
                    # Mostrar productos de la orden
                    items = most_expensive.get('items', [])
                    if items:
                        msg += f"\n📦 Productos ({len(items)}):\n"
                        for item in items[:5]:  # Mostrar máximo 5 productos
                            msg += f"  • {item.get('productName', 'N/A')}: {item.get('quantity', 0)} x S/ {item.get('price', 0):.2f}\n"
                        if len(items) > 5:
                            msg += f"  ... y {len(items) - 5} más\n"
                    
                    dispatcher.utter_message(text=msg)
                else:
                    dispatcher.utter_message(text="❌ No hay órdenes registradas.")
            else:
                dispatcher.utter_message(text="❌ No pude obtener las órdenes.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionCancelOrder(Action):
    def name(self) -> Text:
        return "action_cancel_order"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        order_id = tracker.get_slot("order_id")
        if not order_id:
            dispatcher.utter_message(text="Por favor, indícame el número de orden a cancelar.")
            return []
        
        try:
            response = requests.delete(f"{API_BASE_URL}/orders/{order_id}")
            if response.status_code == 200:
                dispatcher.utter_message(text=f"✅ Orden {order_id} cancelada exitosamente.")
            else:
                dispatcher.utter_message(text="❌ No se pudo cancelar la orden.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionUpdateOrderStatus(Action):
    def name(self) -> Text:
        return "action_update_order_status"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        order_id = tracker.get_slot("order_id")
        new_status = tracker.get_slot("order_status")
        
        if not order_id or not new_status:
            dispatcher.utter_message(text="Necesito el ID de orden y el nuevo estado.")
            return []
        
        try:
            response = requests.put(f"{API_BASE_URL}/orders/{order_id}", json={"status": new_status})
            if response.status_code == 200:
                dispatcher.utter_message(text=f"✅ Orden actualizada a: {new_status}")
            else:
                dispatcher.utter_message(text="❌ No se pudo actualizar la orden.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionFilterOrders(Action):
    def name(self) -> Text:
        return "action_filter_orders"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        filter_status = tracker.get_slot("order_status")
        
        try:
            response = requests.get(f"{API_BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                filtered = [o for o in orders if o.get('status') == filter_status]
                
                msg = f"📦 Órdenes con estado '{filter_status}': {len(filtered)}\n\n"
                for order in filtered[:5]:
                    msg += f"• {order['orderNumber']}: S/ {order['totalAmount']:.2f}\n"
                
                dispatcher.utter_message(text=msg)
            else:
                dispatcher.utter_message(text="❌ No pude obtener las órdenes.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


# ============================================
# ACCIONES DE CLIENTES
# ============================================

class ActionGetCustomerInfo(Action):
    def name(self) -> Text:
        return "action_get_customer_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        customer_id = tracker.get_slot("customer_id")
        
        try:
            response = requests.get(f"{API_BASE_URL}/customers/{customer_id}")
            if response.status_code == 200:
                customer = response.json()
                dispatcher.utter_message(
                    text=f"👤 Cliente: {customer['name']}\n"
                         f"📧 Email: {customer['email']}\n"
                         f"📞 Teléfono: {customer.get('phone', 'N/A')}"
                )
            else:
                dispatcher.utter_message(text="❌ No encontré al cliente.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetTopCustomers(Action):
    def name(self) -> Text:
        return "action_get_top_customers"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            customers_resp = requests.get(f"{API_BASE_URL}/customers")
            orders_resp = requests.get(f"{API_BASE_URL}/orders")
            
            if customers_resp.status_code == 200 and orders_resp.status_code == 200:
                customers = customers_resp.json()
                orders = orders_resp.json()
                
                # Calcular total gastado por cliente
                customer_totals = {}
                for order in orders:
                    customer_id = order.get('customerId')
                    if customer_id:
                        if customer_id not in customer_totals:
                            customer_totals[customer_id] = {'total': 0, 'orders': 0}
                        customer_totals[customer_id]['total'] += order.get('totalAmount', 0)
                        customer_totals[customer_id]['orders'] += 1
                
                # Crear lista de clientes con sus totales
                customer_list = []
                for customer in customers:
                    cid = customer.get('_id') or customer.get('id')
                    if cid in customer_totals:
                        customer_list.append({
                            'name': customer.get('name', 'N/A'),
                            'email': customer.get('email', 'N/A'),
                            'total': customer_totals[cid]['total'],
                            'orders': customer_totals[cid]['orders']
                        })
                
                # Ordenar por total gastado
                customer_list.sort(key=lambda x: x['total'], reverse=True)
                
                msg = "🏆 Top 10 Clientes:\n\n"
                for i, customer in enumerate(customer_list[:10], 1):
                    msg += f"{i}. {customer['name']}: S/ {customer['total']:.2f} ({customer['orders']} órdenes)\n"
                
                dispatcher.utter_message(text=msg)
            else:
                dispatcher.utter_message(text="❌ No pude obtener los clientes.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetBestActiveCustomer(Action):
    def name(self) -> Text:
        return "action_get_best_active_customer"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            customers_resp = requests.get(f"{API_BASE_URL}/customers")
            orders_resp = requests.get(f"{API_BASE_URL}/orders")
            
            if customers_resp.status_code == 200 and orders_resp.status_code == 200:
                customers = customers_resp.json()
                orders = orders_resp.json()
                
                # Calcular total gastado por cliente
                customer_totals = {}
                for order in orders:
                    customer_id = order.get('customerId')
                    if customer_id:
                        if customer_id not in customer_totals:
                            customer_totals[customer_id] = {'total': 0, 'orders': 0, 'name': ''}
                        customer_totals[customer_id]['total'] += order.get('totalAmount', 0)
                        customer_totals[customer_id]['orders'] += 1
                
                # Obtener nombres de clientes
                customer_dict = {c.get('_id') or c.get('id'): c for c in customers}
                for cid, data in customer_totals.items():
                    customer = customer_dict.get(cid)
                    if customer:
                        data['name'] = customer.get('name', 'Cliente desconocido')
                        data['email'] = customer.get('email', 'N/A')
                
                # Encontrar el mejor cliente activo
                if customer_totals:
                    best = max(customer_totals.values(), key=lambda x: x['total'])
                    msg = f"👑 **Mejor Cliente Activo:**\n\n"
                    msg += f"Nombre: {best['name']}\n"
                    msg += f"Email: {best.get('email', 'N/A')}\n"
                    msg += f"Total gastado: S/ {best['total']:.2f}\n"
                    msg += f"Órdenes: {best['orders']}"
                    
                    dispatcher.utter_message(text=msg)
                else:
                    dispatcher.utter_message(text="❌ No hay clientes con órdenes registradas.")
            else:
                dispatcher.utter_message(text="❌ No pude obtener los datos.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetCustomerCount(Action):
    def name(self) -> Text:
        return "action_get_customer_count"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/customers")
            if response.status_code == 200:
                customers = response.json()
                dispatcher.utter_message(text=f"👥 Total de clientes: {len(customers)}")
            else:
                dispatcher.utter_message(text="❌ No pude obtener los clientes.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionSearchCustomer(Action):
    def name(self) -> Text:
        return "action_search_customer"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        customer_name = tracker.get_slot("customer_name")
        customer_email = tracker.get_slot("customer_email")
        
        try:
            response = requests.get(f"{API_BASE_URL}/customers")
            if response.status_code == 200:
                customers = response.json()
                
                # Buscar por nombre o email
                found = None
                if customer_email:
                    found = next((c for c in customers if c.get('email') == customer_email), None)
                elif customer_name:
                    found = next((c for c in customers if customer_name.lower() in c.get('name', '').lower()), None)
                
                if found:
                    dispatcher.utter_message(
                        text=f"👤 Cliente encontrado:\n"
                             f"Nombre: {found['name']}\n"
                             f"Email: {found.get('email', 'N/A')}\n"
                             f"Teléfono: {found.get('phone', 'N/A')}"
                    )
                else:
                    dispatcher.utter_message(text="❌ No encontré al cliente.")
            else:
                dispatcher.utter_message(text="❌ Error al buscar cliente.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


# ============================================
# ACCIONES DE PRODUCTOS
# ============================================

class ActionGetProducts(Action):
    def name(self) -> Text:
        return "action_get_products"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/products")
            if response.status_code == 200:
                products = response.json()
                msg = f"🛍️ Productos disponibles ({len(products)}):\n\n"
                for product in products[:10]:  # Máximo 10
                    msg += f"• {product['name']}: S/ {product['price']:.2f}\n"
                
                dispatcher.utter_message(text=msg)
            else:
                dispatcher.utter_message(text="❌ No pude obtener los productos.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetTopProducts(Action):
    def name(self) -> Text:
        return "action_get_top_products"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            products_resp = requests.get(f"{API_BASE_URL}/products")
            orders_resp = requests.get(f"{API_BASE_URL}/orders")
            
            if products_resp.status_code == 200 and orders_resp.status_code == 200:
                products = products_resp.json()
                orders = orders_resp.json()
                
                # Calcular ventas por producto
                product_sales = {}
                for order in orders:
                    items = order.get('items', [])
                    for item in items:
                        product_name = item.get('productName', '')
                        quantity = item.get('quantity', 0)
                        if product_name:
                            if product_name not in product_sales:
                                product_sales[product_name] = {'quantity': 0, 'revenue': 0}
                            product_sales[product_name]['quantity'] += quantity
                            product_sales[product_name]['revenue'] += item.get('price', 0) * quantity
                
                # Ordenar por cantidad vendida
                sorted_products = sorted(product_sales.items(), key=lambda x: x[1]['quantity'], reverse=True)
                
                msg = "🏆 Top 10 Productos Más Vendidos:\n\n"
                for i, (name, data) in enumerate(sorted_products[:10], 1):
                    msg += f"{i}. {name}: {data['quantity']} unidades - S/ {data['revenue']:.2f}\n"
                
                dispatcher.utter_message(text=msg)
            else:
                dispatcher.utter_message(text="❌ No pude obtener los productos.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetMostSoldProduct(Action):
    def name(self) -> Text:
        return "action_get_most_sold_product"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            products_resp = requests.get(f"{API_BASE_URL}/products")
            orders_resp = requests.get(f"{API_BASE_URL}/orders")
            
            if products_resp.status_code == 200 and orders_resp.status_code == 200:
                products = products_resp.json()
                orders = orders_resp.json()
                
                # Calcular ventas por producto
                product_sales = {}
                for order in orders:
                    items = order.get('items', [])
                    for item in items:
                        product_name = item.get('productName', '')
                        quantity = item.get('quantity', 0)
                        if product_name:
                            if product_name not in product_sales:
                                product_sales[product_name] = {'quantity': 0, 'revenue': 0}
                            product_sales[product_name]['quantity'] += quantity
                            product_sales[product_name]['revenue'] += item.get('price', 0) * quantity
                
                # Encontrar el producto más vendido
                if product_sales:
                    most_sold = max(product_sales.items(), key=lambda x: x[1]['quantity'])
                    product_name = most_sold[0]
                    data = most_sold[1]
                    
                    # Buscar precio del producto
                    product_info = next((p for p in products if p.get('name') == product_name), None)
                    price = product_info.get('price', 0) if product_info else 0
                    
                    msg = f"🏆 **Producto Más Vendido:**\n\n"
                    msg += f"Nombre: {product_name}\n"
                    msg += f"Cantidad vendida: {data['quantity']} unidades\n"
                    msg += f"Ingresos: S/ {data['revenue']:.2f}\n"
                    if price > 0:
                        msg += f"Precio unitario: S/ {price:.2f}"
                    
                    dispatcher.utter_message(text=msg)
                else:
                    dispatcher.utter_message(text="❌ No hay productos vendidos aún.")
            else:
                dispatcher.utter_message(text="❌ No pude obtener los datos.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetLowestStockProduct(Action):
    def name(self) -> Text:
        return "action_get_lowest_stock_product"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/products")
            if response.status_code == 200:
                products = response.json()
                
                # Filtrar solo productos activos
                active_products = [p for p in products if p.get('isActive', True) != False]
                
                if active_products:
                    # Ordenar por stock (menor a mayor)
                    sorted_products = sorted(active_products, key=lambda x: x.get('stock', 0))
                    
                    # Obtener el producto con menos stock
                    lowest = sorted_products[0]
                    stock = lowest.get('stock', 0)
                    name = lowest.get('name', 'N/A')
                    price = lowest.get('price', 0)
                    
                    msg = f"⚠️ **Producto con Menos Stock:**\n\n"
                    msg += f"Nombre: {name}\n"
                    msg += f"Stock disponible: {stock} unidades\n"
                    msg += f"Precio: S/ {price:.2f}\n"
                    
                    if stock < 10:
                        msg += f"\n🔴 **Alerta:** Stock bajo, requiere reposición urgente."
                    elif stock < 20:
                        msg += f"\n🟡 **Atención:** Stock medio, considerar reposición."
                    
                    dispatcher.utter_message(text=msg)
                else:
                    dispatcher.utter_message(text="❌ No hay productos activos.")
            else:
                dispatcher.utter_message(text="❌ No pude obtener los productos.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetProductStock(Action):
    def name(self) -> Text:
        return "action_get_product_stock"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        product_name = tracker.get_slot("product_name")
        
        try:
            response = requests.get(f"{API_BASE_URL}/products")
            if response.status_code == 200:
                products = response.json()
                product = next((p for p in products if product_name.lower() in p.get('name', '').lower()), None)
                
                if product:
                    stock = product.get('stock', 'N/A')
                    dispatcher.utter_message(
                        text=f"📦 {product['name']}\n"
                             f"Stock disponible: {stock} unidades\n"
                             f"Precio: S/ {product['price']:.2f}"
                    )
                else:
                    dispatcher.utter_message(text=f"❌ No encontré el producto '{product_name}'.")
            else:
                dispatcher.utter_message(text="❌ Error al consultar productos.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


# ============================================
# ACCIONES DE VENTAS Y ANÁLISIS
# ============================================

class ActionGetTotalSales(Action):
    def name(self) -> Text:
        return "action_get_total_sales"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                total_sales = sum(order.get('totalAmount', 0) for order in orders)
                paid_orders = [o for o in orders if o.get('paymentStatus') == 'paid']
                total_paid = sum(order.get('totalAmount', 0) for order in paid_orders)
                
                dispatcher.utter_message(
                    text=f"💰 Ventas Totales:\n\n"
                         f"Total general: S/ {total_sales:.2f}\n"
                         f"Total pagado: S/ {total_paid:.2f}\n"
                         f"Órdenes: {len(orders)} (Pagadas: {len(paid_orders)})"
                )
            else:
                dispatcher.utter_message(text="❌ No pude obtener las ventas.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetRevenue(Action):
    def name(self) -> Text:
        return "action_get_revenue"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                paid_orders = [o for o in orders if o.get('paymentStatus') == 'paid']
                revenue = sum(order.get('totalAmount', 0) for order in paid_orders)
                
                dispatcher.utter_message(
                    text=f"💰 Ingresos (pagos confirmados):\n\n"
                         f"Total: S/ {revenue:.2f}\n"
                         f"Órdenes pagadas: {len(paid_orders)}"
                )
            else:
                dispatcher.utter_message(text="❌ No pude obtener los ingresos.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetSalesByPeriod(Action):
    def name(self) -> Text:
        return "action_get_sales_by_period"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Por ahora, mostrar ventas de hoy
        dispatcher.utter_message(text="📊 Ventas del día: S/ 1,234.56 (placeholder)")
        return []


class ActionGetAbandonedCarts(Action):
    def name(self) -> Text:
        return "action_get_abandoned_carts"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                abandoned = [o for o in orders if o.get('status') == 'pending' and o.get('paymentStatus') == 'pending']
                
                if abandoned:
                    total_lost = sum(order.get('totalAmount', 0) for order in abandoned)
                    msg = f"🛒 Carritos Abandonados: {len(abandoned)}\n\n"
                    msg += f"💰 Valor total: S/ {total_lost:.2f}\n\n"
                    
                    for order in abandoned[:5]:
                        msg += f"• {order['orderNumber']}: S/ {order['totalAmount']:.2f}\n"
                    
                    dispatcher.utter_message(text=msg)
                else:
                    dispatcher.utter_message(text="✅ No hay carritos abandonados.")
            else:
                dispatcher.utter_message(text="❌ Error al consultar carritos.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


# ============================================
# ACCIONES DE PAGOS
# ============================================

class ActionGetPaymentStatus(Action):
    def name(self) -> Text:
        return "action_get_payment_status"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        order_number = tracker.get_slot("order_number")
        
        try:
            response = requests.get(f"{API_BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                order = next((o for o in orders if o.get('orderNumber') == order_number), None)
                
                if order:
                    payment_status = order.get('paymentStatus', 'desconocido')
                    dispatcher.utter_message(
                        text=f"💳 Estado de pago de {order_number}:\n\n"
                             f"Estado: {payment_status}\n"
                             f"Total: S/ {order['totalAmount']:.2f}"
                    )
                else:
                    dispatcher.utter_message(text=f"❌ No encontré la orden {order_number}.")
            else:
                dispatcher.utter_message(text="❌ Error al consultar pago.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetPendingPayments(Action):
    def name(self) -> Text:
        return "action_get_pending_payments"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/payments")
            if response.status_code == 200:
                payments = response.json()
                pending = [p for p in payments if p.get('status') == 'pending']
                
                if pending:
                    total = sum(p.get('amount', 0) for p in pending)
                    msg = f"💳 Pagos Pendientes: {len(pending)}\n\n"
                    msg += f"💰 Total: S/ {total:.2f}\n"
                    
                    dispatcher.utter_message(text=msg)
                else:
                    dispatcher.utter_message(text="✅ No hay pagos pendientes.")
            else:
                dispatcher.utter_message(text="❌ Error al consultar pagos.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


# ============================================
# ACCIONES DE MÉTRICAS
# ============================================

class ActionGetConversionRate(Action):
    def name(self) -> Text:
        return "action_get_conversion_rate"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                paid = [o for o in orders if o.get('paymentStatus') == 'paid']
                
                if len(orders) > 0:
                    rate = (len(paid) / len(orders)) * 100
                    dispatcher.utter_message(
                        text=f"📈 Tasa de Conversión:\n\n"
                             f"{rate:.1f}%\n\n"
                             f"Pagadas: {len(paid)} / Total: {len(orders)}"
                    )
                else:
                    dispatcher.utter_message(text="No hay datos suficientes.")
            else:
                dispatcher.utter_message(text="❌ Error al calcular conversión.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetAverageOrder(Action):
    def name(self) -> Text:
        return "action_get_average_order"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            response = requests.get(f"{API_BASE_URL}/orders")
            if response.status_code == 200:
                orders = response.json()
                paid = [o for o in orders if o.get('paymentStatus') == 'paid']
                
                if len(paid) > 0:
                    total = sum(order.get('totalAmount', 0) for order in paid)
                    average = total / len(paid)
                    
                    dispatcher.utter_message(
                        text=f"💰 Ticket Promedio:\n\n"
                             f"S/ {average:.2f}\n\n"
                             f"Basado en {len(paid)} órdenes pagadas"
                    )
                else:
                    dispatcher.utter_message(text="No hay órdenes pagadas para calcular.")
            else:
                dispatcher.utter_message(text="❌ Error al calcular ticket promedio.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []


class ActionGetDashboardSummary(Action):
    def name(self) -> Text:
        return "action_get_dashboard_summary"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        try:
            # Obtener datos de múltiples endpoints
            orders_resp = requests.get(f"{API_BASE_URL}/orders")
            customers_resp = requests.get(f"{API_BASE_URL}/customers")
            
            if orders_resp.status_code == 200 and customers_resp.status_code == 200:
                orders = orders_resp.json()
                customers = customers_resp.json()
                
                paid = [o for o in orders if o.get('paymentStatus') == 'paid']
                total_revenue = sum(order.get('totalAmount', 0) for order in paid)
                conversion = (len(paid) / len(orders) * 100) if len(orders) > 0 else 0
                
                msg = "📊 **Resumen del Dashboard**\n\n"
                msg += f"💰 Ingresos: S/ {total_revenue:.2f}\n"
                msg += f"📦 Órdenes: {len(orders)} (Pagadas: {len(paid)})\n"
                msg += f"👥 Clientes: {len(customers)}\n"
                msg += f"📈 Conversión: {conversion:.1f}%\n"
                
                dispatcher.utter_message(text=msg)
            else:
                dispatcher.utter_message(text="❌ Error al obtener resumen.")
        except Exception as e:
            dispatcher.utter_message(text=f"❌ Error: {str(e)}")
        
        return []
