import app from "./app";
import { connectDB } from "./database";

const port = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(port, () => console.log(`🌐 API corriendo en http://localhost:${port}`));
});
