# 📦 LUMINA - Directorio de Aplicaciones (apps/)

Este directorio contiene las 5 aplicaciones principales que conforman el ecosistema de **LUMINA**, una solución integral para ventas electrónicas automatizadas a través de WhatsApp, con pasarela de pagos, hoja de cálculo de control y un dashboard administrativo inteligente potenciado por IA (Rasa Chatbot).

---

## 🗺️ Arquitectura del Sistema

El siguiente diagrama muestra cómo interactúan y se comunican los diferentes componentes del proyecto:

```mermaid
graph TD
    %% Clientes e Interfaces
    WhatsApp[📱 WhatsApp User] <-->|Conversación y Pedidos| WABot[🤖 whatsapp-bot]
    Admin[👤 Administrador] <-->|Dashboard y Gestión| FE[💻 frontend]

    %% Servicios y Controladores
    WABot <-->|Sincronización de Sesiones y Catálogo| API[🔌 api (Express)]
    FE <-->|Autenticación y CRUDs| API
    FE <-->|Chatbot Administrativo (BI)| API

    %% Bases de Datos y Backend
    API <-->|Persistencia de Datos| DB[(🗄️ MongoDB)]
    API <-->|Proxy de Mensajes| Rasa[🧠 rasa-chatbot]
    Rasa <-->|Consultas de BI e Indicadores| DB

    %% Pasarelas y Terceros
    API <-->|Generación de Enlaces de Pago y Webhooks| Culqi[💳 Pasarela Culqi]
    API <-->|Exportación de Reportes| GoogleSheets[📊 Google Sheets API]

    %% Marketing
    Docs[🌐 docs (Landing Page)] -.->|Portal Comercial| FE
```

---

## 🛠️ Detalles de las Aplicaciones

A continuación se detallan las características, tecnologías y funcionalidades de cada una de las sub-aplicaciones en `apps/`:

### 1. 🔌 [api](file:///d:/Leonardo/Arquitectura/Arquitectura_whatsapp/apps/api) (Backend & API Gateway)
El núcleo transaccional del sistema. Coordina la lógica de negocio, la base de datos y los servicios de terceros.
* **Tecnologías**: Node.js, Express, TypeScript, Mongoose, Swagger.
* **Características principales**:
  * **Persistencia MongoDB**: Gestión de colecciones para `User` (Autenticación), `Product` (Inventario), `Customer` (Clientes), `Order` (Pedidos), `Payment` (Pagos) y `Conversation` (Estado del chatbot de WhatsApp).
  * **Integración con Culqi**: Pasarela de pagos peruana que genera órdenes de pago, cargos con tarjeta directos, PagoEfectivo y Billeteras Móviles (Yape/Plin). Cuenta con un controlador de **Webhooks** para actualizar estados en tiempo real al detectar pagos exitosos.
  * **Exportación Google Sheets**: Servicio que extrae información de pedidos de MongoDB y los sincroniza mediante la API oficial de Google Sheets, además de permitir exportaciones en formato CSV.
  * **Proxy de Inteligencia Artificial**: Recibe las consultas administrativas del frontend y las redirige hacia el servidor de Rasa Chatbot.
  * **Documentación Interactiva**: Integración de Swagger UI expuesta en `/api-docs` para probar endpoints.

### 2. 💻 [frontend](file:///d:/Leonardo/Arquitectura/Arquitectura_whatsapp/apps/frontend) (Panel de Control y Analíticas)
La interfaz administrativa web que permite a los dueños del negocio supervisar las operaciones y analizar datos de ventas.
* **Tecnologías**: React, Vite, TypeScript, Tailwind CSS, Shadcn UI, Recharts.
* **Características principales**:
  * **Dashboard de Inteligencia de Negocio**: Visualización en tiempo real de métricas mediante gráficos interactivos:
    * Ingresos y Ventas periódicas.
    * Estado de los Pedidos (Pendiente, Confirmado, Cancelado).
    * Clientes Top (por volumen de compra).
    * Carritos Abandonados (conversión de WhatsApp).
    * Productos más Vendidos y Alertas de Stock Bajo.
    * Estados y Métodos de Pago más utilizados.
  * **Módulos CRUD de Administración**: Pestañas dedicadas para gestionar de forma completa:
    * **Clientes**: Perfil, dirección, correos y contacto.
    * **Pedidos**: Modificación de estados de despacho y dirección.
    * **Pagos**: Historial detallado de transacciones Culqi.
    * **Productos**: Gestión del catálogo (precio, stock, categoría, URL de imagen).
  * **Chatbot Administrativo Integrado**: Un chat persistente en pantalla donde el administrador puede pedir resúmenes de venta o consultar datos a través de lenguaje natural (Rasa).

### 3. 🧠 [rasa-chatbot](file:///d:/Leonardo/Arquitectura/Arquitectura_whatsapp/apps/rasa-chatbot) (Asistente de Business Intelligence)
Un agente conversacional inteligente programado para responder consultas de negocio avanzadas.
* **Tecnologías**: Python, Rasa NLU/Core, Spacy.
* **Características principales**:
  * **Comprensión en Español**: Configurado para interpretar intenciones sobre transacciones comerciales en idioma español.
  * **Acciones Personalizadas (`actions.py`)**: Conexión directa a MongoDB para procesar consultas complejas de BI:
    * *Pedidos*: Buscar pedidos recientes, estados de órdenes específicas, cancelar pedidos o cambiar sus estados.
    * *Métricas*: Cálculo de tasa de conversión de carritos, ticket promedio de compra, ingresos totales del mes o día.
    * *Inventario*: Listar productos agotados o consultar el stock exacto de un producto en base a su nombre.
    * *Clientes*: Identificar al mejor cliente activo del mes.

### 4. 🤖 [whatsapp-bot](file:///d:/Leonardo/Arquitectura/Arquitectura_whatsapp/apps/whatsapp-bot) (Agente de Ventas en WhatsApp)
El canal de atención al cliente directo. Automatiza todo el embudo de ventas directamente en WhatsApp.
* **Tecnologías**: Node.js, TypeScript, `whatsapp-web.js`, Puppeteer.
* **Características principales**:
  * **Máquina de Estados Conversacional**:
    * `greeting`: Saludo personalizado y recuperación de sesiones previas persistidas.
    * `menu`: Navegación principal (Catálogo, Carrito, Pedidos, Ayuda).
    * `product`: Exploración del catálogo dinámico y detalles del producto.
    * `quantity_selection`: Pregunta la cantidad exacta antes de agregar al carrito.
    * `cart`: Visualización de items del carrito de compras, editar cantidades o vaciar el carrito.
    * `order`: Fase de recolección de dirección de envío y generación del enlace de pago de Culqi.
  * **Resiliencia de Sesiones**: Si el bot se desconecta o reinicia, rehidrata el estado de la conversación y el carrito del usuario directamente desde la base de datos de MongoDB.

### 5. 🌐 [docs](file:///d:/Leonardo/Arquitectura/Arquitectura_whatsapp/apps/docs) (Landing Page Comercial)
La web promocional y de marketing del ecosistema de LUMINA.
* **Tecnologías**: React, Vite, TypeScript, Tailwind CSS.
* **Características principales**:
  * **Portal de Negocio**: Landing page corporativa que expone las ventajas, estadísticas de conversión de la herramienta, tabla de precios de planes, integraciones y preguntas frecuentes.

---

## 🚀 Cómo Iniciar las Aplicaciones

El proyecto está estructurado con **npm workspaces**. Para iniciar el entorno completo, consulta los comandos en el [Readme.md del root](file:///d:/Leonardo/Arquitectura/Arquitectura_whatsapp/Readme.md).
