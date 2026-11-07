import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

export const setupSwagger = (app: Express) => {
  const options = {
    definition: {
      openapi: '3.0.0',
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
      info: {
        title: 'WhatsApp Sales Bot API',
        version: '1.0.0',
        description:
          'Documentación de la API para el sistema de ventas automatizado con WhatsApp y Culqi',
      },
      servers: [
        {
          url: '/',
        },
      ],
    },
    apis: ['./src/routes/*.ts'], // rutas donde estarán las anotaciones
  };

  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
