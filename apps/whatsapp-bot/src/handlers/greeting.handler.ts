import { getMainMenu } from "../utils/messages";
import { api } from "../services/whatsapp.service";

export async function handleGreeting(ctx: any) {
  // ctx is the session object. We expect ctx.phone and ctx.contactName to be present.
  const phone = ctx.phone;
  const name = ctx.contactName || "Desconocido";

  try {
    // Intentamos obtener el cliente por teléfono desde el backend
    let customer = null;
    try {
      customer = await api.getCustomerByPhone(phone);
    } catch (err) {
      // si devuelve 404 o falla, customer quedará null y procedemos a crear
      customer = null;
    }

    if (!customer) {
      // crear cliente usando el nombre del contacto
      const payload = { phone, name };
      try {
        customer = await api.createCustomer(payload);
      } catch (err) {
        // si falla la creación, no bloqueamos el flujo; solo lo logueamos
        console.error("Error creando cliente en backend:", err);
      }
    }

    // guardar referencia de cliente en la sesión
    if (customer && customer._id) ctx.customerId = customer._id;

    // También crear/asegurar una conversación en el backend
    try {
      await api.createConversation({ phone });
    } catch (err) {
      // no bloquear flujo si falla
      // console.warn("No se pudo crear conversación en backend:", err);
    }

    ctx.step = "menu";
    return getMainMenu();
  } catch (error) {
    console.error("Error en handleGreeting:", error);
    ctx.step = "menu";
    return getMainMenu();
  }
}