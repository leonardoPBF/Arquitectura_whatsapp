import { api } from '../services/whatsapp.service';
import { authService } from '../services/auth.service';

export async function handleOrder(ctx: any, text: string) {
  // Usamos ctx.orderPhase para controlar subpasos: undefined|'name'|'email'|'address'|'confirm'
  if (!ctx.orderPhase) ctx.orderPhase = 'name';

  // fase de nombre
  if (ctx.orderPhase === 'name') {
    ctx.customerData = ctx.customerData || {};
    ctx.customerData.name = text.trim();
    // Si existe un customer en backend con email registrado, no preguntamos el email
    if (ctx.phone) {
      try {
        const existing = await api.getCustomerByPhone(ctx.phone);
        if (existing && existing.email) {
          ctx.customerData.email = existing.email;
          ctx.orderPhase = 'address';
          return 'Perfecto. Ya tenemos tu correo registrado. Ahora indícame tu dirección de entrega:';
        }
      } catch {
        // no existe o error, seguiremos pidiendo el email
      }
    }

    ctx.orderPhase = 'email';
    return 'Gracias. Ahora indícame tu correo electrónico (para recibir notificaciones):';
  }

  // fase de email
  if (ctx.orderPhase === 'email') {
    ctx.customerData = ctx.customerData || {};
    const email = text.trim();
    // validación mínima
    if (!email.includes('@')) {
      return 'Por favor ingresa un correo válido (ej: usuario@dominio.com).';
    }
    ctx.customerData.email = email;
    ctx.orderPhase = 'address';
    return 'Perfecto. Ahora indícame tu dirección de entrega:';
  }

  // fase de dirección
  if (ctx.orderPhase === 'address') {
    ctx.customerData = ctx.customerData || {};
    ctx.customerData.address = text.trim();
    // mostrar resumen y pedir confirmación
    const total = ctx.cart.reduce((s: number, i: { price: number; quantity: number; }) => s + i.price * i.quantity, 0);
    ctx.orderPhase = 'confirm';

    const summaryLines = ctx.cart.map((it: any, idx: number) => `${idx + 1}. ${it.productName || it.name || 'producto'} - ${it.quantity}x S/.${it.price} = S/.${(it.price * it.quantity).toFixed(2)}`);
    const summary = `📋 *Resumen de tu pedido:*\n${summaryLines.join('\n')}\n\n👤 ${ctx.customerData.name}\n📧 ${ctx.customerData.email || '(no proporcionado)'}\n� ${ctx.customerData.address}\n\n💰 *Total:* S/.${total.toFixed(2)}\n\n¿Confirmas tu pedido? (Responde *SI* o *NO*)`;
    return summary;
  }

  // fase de confirmación
  if (ctx.orderPhase === 'confirm') {
    const t = (text || '').trim().toLowerCase();
    if (['si', 'sí'].includes(t)) {
      // asegurar customerId
      try {
        if (!ctx.customerId) {
          // intenta buscar por teléfono
          if (ctx.phone) {
            try {
              const c = await api.getCustomerByPhone(ctx.phone);
              if (c && c._id) ctx.customerId = c._id;
            } catch {
              // no existe
            }
          }
        }

        // crear o actualizar customer con nombre y correo
        if (ctx.phone) {
          try {
            const existing = await api.getCustomerByPhone(ctx.phone);
            if (existing && existing._id) {
              // actualizar si es necesario
              await api.updateCustomer(existing._id, { name: ctx.customerData?.name || existing.name, email: ctx.customerData?.email || existing.email });
              ctx.customerId = existing._id;
            } else {
              const created = await api.createCustomer({ phone: ctx.phone, name: ctx.customerData?.name || ctx.contactName, email: ctx.customerData?.email });
              if (created && created._id) ctx.customerId = created._id;
            }
          } catch {
            // fallback: crear
            try {
              const created = await api.createCustomer({ phone: ctx.phone, name: ctx.customerData?.name || ctx.contactName, email: ctx.customerData?.email });
              if (created && created._id) ctx.customerId = created._id;
            } catch {
              console.warn('No se pudo crear/actualizar customer, continuando sin customerId');
            }
          }
        }

        // construir items defensivamente: aceptar productId, id o _id
        const itemsPayload = (ctx.cart || []).map((i: any) => {
          const pid = i.productId || i.id || i._id || (i.productId?._id) || undefined;
          return { productId: pid ? String(pid) : undefined, quantity: Number(i.quantity || 0) };
        });

        // validar items
        const invalid = itemsPayload.find((it: any) => !it.productId || !it.quantity || it.quantity <= 0);
        if (!itemsPayload.length || invalid) {
          console.error('Payload items inválidos:', itemsPayload);
          return '❌ Hay un problema con los productos del carrito. Por favor revisa tu carrito e intenta de nuevo.';
        }

        const payload: any = {
          customerId: ctx.customerId,
          deliveryAddress: ctx.customerData?.address,
          customerEmail: ctx.customerData?.email,
          items: itemsPayload,
        };

        console.log('📦 Creando orden con payload:', JSON.stringify(payload));

        const order = await api.createOrder(payload);

        // 🔐 Registrar usuario automáticamente desde WhatsApp
        let passwordMessage = '';
        if (ctx.customerData?.email && ctx.customerData?.name && ctx.phone) {
          try {
            const authResult = await authService.registerFromWhatsApp({
              email: ctx.customerData.email,
              name: ctx.customerData.name,
              phone: ctx.phone,
            });

            if (!authResult.userExists && authResult.generatedPassword) {
              passwordMessage = `\n\n🔐 *Acceso a tu cuenta web:*\nEmail: ${ctx.customerData.email}\nContraseña: ${authResult.generatedPassword}\n\n⚠️ Guarda esta contraseña para acceder a tu cuenta en nuestra página web y revisar tus pedidos.`;
            }
          } catch (authError) {
            console.warn('No se pudo crear usuario automáticamente:', authError);
            // No bloqueamos el flujo si falla la creación del usuario
          }
        }

        // Intenta crear un payment/checkout en Culqi y enviar link al cliente
        try {
          const culqiRes = await api.createCulqiOrder({ orderId: order._id, method: 'card' });
          const checkoutUrl = culqiRes?.checkoutUrl || culqiRes?.culqiOrder?.checkoutUrl || (culqiRes?.culqiOrder?.id ? `${process.env.LOCAL_LINK}?order=${culqiRes.culqiOrder.id}` : undefined);

          // Limpieza del carrito en backend si tenemos el phone
          if (ctx.phone) {
            try {
              await api.clearConversationCart(ctx.phone);
              // marcar paso como menu/finished
              await api.updateConversationStep(ctx.phone, 'menu', 'Orden confirmada');
            } catch (e) {
              console.warn('No se pudo limpiar carrito en backend:', (e as any)?.message || e);
            }
          }

          ctx.cart = [];
          ctx.step = 'menu';
          ctx.orderPhase = undefined;

          let baseMsg = `✅ Pedido confirmado\nNúmero de orden: ${order.orderNumber || '(sin número)'}\n💰 Total: S/.${(order.totalAmount ?? 0).toFixed(2)}\n\nGracias por tu compra.`;

          if (checkoutUrl) {
            baseMsg += `\n\n💳 Para pagar con tarjeta, abre este enlace: ${checkoutUrl}`;
          } else if (culqiRes && culqiRes.success === false) {
            baseMsg += '\n\n⚠️ No se pudo generar el link de pago automáticamente. Intenta desde la app o contacta al vendedor.';
          }

          // Agregar información de contraseña si se generó
          baseMsg += passwordMessage;

          return baseMsg;
        } catch (err) {
          console.warn('No se pudo generar checkoutUrl en Culqi:', (err as any)?.message || err);

          // Intentar limpiar carrito en backend aun cuando la generación falle
          if (ctx.phone) {
            try {
              await api.clearConversationCart(ctx.phone);
              await api.updateConversationStep(ctx.phone, 'menu', 'Orden confirmada (checkout fallido)');
            } catch (e) {
              console.warn('No se pudo limpiar carrito en backend tras fallo de checkout:', (e as any)?.message || e);
            }
          }

          ctx.cart = [];
          ctx.step = 'menu';
          ctx.orderPhase = undefined;
          return `✅ Pedido confirmado\nNúmero de orden: ${order.orderNumber || '(sin número)'}\n💰 Total: S/.${(order.totalAmount ?? 0).toFixed(2)}\n\nGracias por tu compra.${passwordMessage}\n\n⚠️ Nota: No se pudo generar el link de pago automáticamente. Puedes pagar desde la web o contactarnos.`;
        }
      } catch (err: any) {
        console.error('Error creando orden:', err?.message || err);
        // log response body if available
        if (err?.response?.data) console.error('Backend response:', err.response.data);
        return '❌ Ocurrió un error al crear tu pedido. Intenta nuevamente más tarde.';
      }
    }

    if (t === 'no') {
      ctx.step = 'menu';
      ctx.orderPhase = undefined;
      return 'Pedido cancelado. Escribe \'menu\' para volver al inicio.';
    }

    return 'Por favor responde \'SI\' o \'NO\'.';
  }

  return 'Error en el flujo de pedido. Escribe \'menu\' para reiniciar.';
}