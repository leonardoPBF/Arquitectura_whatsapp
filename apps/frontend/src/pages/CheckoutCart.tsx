import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import api, { culqiAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function CheckoutCart() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const { user, refreshUser } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    zipCode: '',
  });

  const [processing, setProcessing] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Tu carrito está vacío
                </p>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="flex items-center gap-2 mx-auto border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a Productos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCulqiPayment = async () => {
    setProcessing(true);

    try {
      let orderId = createdOrderId;

      if (!orderId) {
        // 1. Crear orden en backend (primera vez)
        const orderResponse = await api.post('/api/orders', {
          customerId: user?.customerId || null,
          customer: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
          },
          items: items.map((item) => ({
            productId: item._id,
            quantity: item.quantity,
            price: item.price,
          })),
          total: getTotal(),
          shippingAddress: {
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
          },
          status: 'pending',
        });

        orderId = orderResponse.data._id;
        setCreatedOrderId(orderId);
        console.log('Orden creada en backend:', orderId);

        // Actualizar el context de usuario para obtener el customerId nuevo si se creó
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        console.log('Reutilizando orden existente en backend:', orderId);
        // Actualizar la dirección de entrega por si el usuario la modificó antes de reintentar
        const finalAddress = [formData.address, formData.city, formData.zipCode].filter(Boolean).join(", ");
        await api.put(`/api/orders/${orderId}`, {
          deliveryAddress: finalAddress,
        });
      }

      // 2. Crear orden en Culqi
      const culqiResponse = await culqiAPI.createOrder({
        orderId: orderId!,
        method: 'card',
      });

      clearCart();

      const checkoutUrlParam = culqiResponse.data.checkoutUrl
        ? `&checkoutUrl=${encodeURIComponent(culqiResponse.data.checkoutUrl)}`
        : '';

      // Redirigir a la página de checkout con la orden de Culqi
      navigate(`/checkout?order=${culqiResponse.data.culqiOrder.id}${checkoutUrlParam}`);
    } catch (error: any) {
      console.error('Error creando orden:', error);
      toast.error(error.response?.data?.message || 'Error al crear la orden');
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    handleCulqiPayment();
  };

  const total = getTotal();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2 border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Carrito
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Formulario */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Envío</CardTitle>
                  <CardDescription>
                    Completa tus datos para procesar la orden
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Nombre Completo *
                        </label>
                        <Input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Juan Pérez"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="juan@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Teléfono *
                        </label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="987654321"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Ciudad *
                        </label>
                        <Input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Lima"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Dirección *
                        </label>
                        <Input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Av. Principal 123, Apto 4B"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Código Postal
                        </label>
                        <Input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          placeholder="15001"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={processing}
                      className="w-full bg-gradient-to-r from-[#10B981] to-[#14B8A6] hover:opacity-90 text-white font-bold h-12 shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-150"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Pagar S/ {total.toFixed(2)}
                        </>
                      )}
                    </Button>

                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-4">
                      <Lock className="w-3 h-3" />
                      Tu pago es seguro y encriptado con Culqi
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Resumen de Orden */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Resumen de Orden</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className="flex justify-between items-start text-sm pb-2 border-b dark:border-gray-800"
                      >
                        <div className="flex-1">
                          <p className="font-medium line-clamp-2">{item.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Cantidad: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-emerald-600">
                          S/ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t dark:border-gray-800 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span>S/ {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Envío</span>
                      <span className="text-green-600 dark:text-green-400">Gratis</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Impuestos</span>
                      <span>Incluido</span>
                    </div>

                    <div className="border-t dark:border-gray-800 pt-4 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        S/ {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-xs text-emerald-800 dark:text-emerald-200">
                    ✓ Envío gratis a todo Perú
                    <br />
                    ✓ Pago seguro con Culqi
                    <br />
                    ✓ Garantía de compra
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
