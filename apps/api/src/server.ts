import app from './app';
import { connectDB } from './database';
import { jwtSecret } from './middlewares/security';
import { migratePaymentIndex } from './models/Payment';
import { startPaymentReconciliation } from './service/direct-payment';
import { Order } from './models/Order';

jwtSecret();

const port = process.env.PORT || 3000;

connectDB().then(async () => {
  await migratePaymentIndex();
  await Order.init();
  app.listen(port, () => console.log(`🌐 API corriendo en http://localhost:${port}`));
  startPaymentReconciliation();
});
