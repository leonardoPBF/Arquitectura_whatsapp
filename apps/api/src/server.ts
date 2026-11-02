import app from "./app";
import { connectDB } from "./database";
import { jwtSecret } from './middlewares/security';

jwtSecret();

const port = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(port, () => console.log(`🌐 API corriendo en http://localhost:${port}`));
});
