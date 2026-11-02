# Auditoría de entrenamiento, consultas y seguridad de Rasa

Actualización 26/10/2026: se implementaron controles de acceso y acciones de solo
lectura. Ver `SEGURIDAD_BOT.md` para el comportamiento vigente y sus límites.
Los hallazgos siguientes describen el estado anterior a las correcciones.

Fecha: 25/10/2026. Alcance: revisión de código, inventario YAML, validación de datos
en Docker, consultas locales de lectura y ejecución de acciones con HTTP simulado.
Este documento propone cambios; no modifica el modelo ni las reglas de negocio.

## Resultado

Sí se puede mejorar. El orden recomendado es: autorización y aislamiento de sesiones,
corrección de acciones, consultas acotadas, evaluación reproducible y ajuste del modelo.
Más entrenamiento no corrige una API abierta ni respuestas calculadas incorrectamente.

Rasa se consume desde `apps/frontend/src/hooks/useRasa.ts` por `/api/chatbot`.
El bot WhatsApp usa `apps/whatsapp-bot/src/handlers/index.ts` y sus propios flujos;
no encontré una llamada desde ese bot a Rasa. Una futura integración debe separar
las capacidades del cliente de las capacidades administrativas del dashboard.

## Mediciones y pruebas realizadas

| Comprobación | Resultado |
| --- | --- |
| Intenciones NLU | 39 |
| Ejemplos NLU | 290; entre 4 y 11 por intención |
| Historias / reglas | 29 / 33 |
| Duplicados textuales normalizados | Ninguno; esto no descarta ambigüedad semántica |
| Historias de prueba | 7, heredadas del ejemplo en inglés |
| Intenciones inexistentes en tests | `mood_great`, `mood_unhappy` |
| Respuestas inexistentes en tests | `utter_happy`, `utter_cheer_up`, `utter_did_that_help` |
| Llamadas HTTP en acciones | 33, ninguna configura `timeout` |
| GET sin Authorization: orders, customers, payments | HTTP 200, respuesta de tipo array |
| POST sin Authorization: chatbot, pregunta sobre cantidad de clientes | HTTP 200, respuesta relativa a clientes |
| Top clientes, con `customerId` poblado simulado | `unhashable type: 'dict'` |
| Stock, sin slot `product_name`, catálogo simulado no vacío | `'NoneType' object has no attribute 'lower'` |
| Ventas por período | Devuelve literalmente `S/ 1,234.56 (placeholder)` |
| Cancelación, cliente HTTP simulado | Invoca DELETE sin verificar confirmación en la acción |

No se hicieron escrituras de negocio ni cancelaciones reales. Se usó un identificador
de conversación nuevo para la consulta de lectura. No se imprimieron datos de clientes.

`rasa data validate --fail-on-warnings` terminó con código 0 en la imagen existente:
sin conflictos estructurales de historias y con advertencia por `utter_default` no usada.
No demuestra precisión NLU, corrección de acciones ni compatibilidad de los tests.
No se ejecutó validación cruzada ni se midieron F1, p95 o rendimiento con volumen real.

## Prioridad 0: autorización y operaciones peligrosas

### API y chatbot accesibles sin autenticar

Evidencia: `apps/api/src/routes/chatbot.routes.ts:29`,
`apps/api/src/controllers/chatbot.controller.ts:6`,
`apps/api/src/routes/orders.routes.ts:81`, `customers.routes.ts:55`, `payments.routes.ts:67`.
La API monta esas rutas sin un middleware global de autenticación.
El frontend envía un token cuando existe, pero el servidor no lo exige en estas rutas.

Implementar autenticación verificada en backend y permisos por operación. Las
consultas administrativas requieren rol administrativo; las de clientes deben
filtrar por la identidad autenticada y comprobar acceso a cada orden. Proteger solo
`/api/chatbot` dejaría abiertos los endpoints directos. CORS y la confianza del NLU
no sustituyen esta autorización. Los controles por objeto son la medida relevante
para este tipo de acceso indebido. [OWASP API1](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)

Las acciones necesitan una identidad de servicio con permisos limitados y contexto
de usuario verificable por la API. No confiar en `sender`, roles o IDs enviados por
el navegador ni en slots extraídos del texto para otorgar permisos. Coordinar este
cambio con frontend y WhatsApp para no romper sus llamadas actuales.

Compose publica Nginx en loopback y mantiene Rasa/actions internos, lo que limita
la exposición actual. Publicar ese Nginx con un dominio ampliaría el alcance del
problema: la red privada de Rasa no protege las rutas abiertas del proxy/API.

### Sesión administrativa compartida

`apps/frontend/src/hooks/useRasa.ts:21` usa `admin_user` por defecto para todos.
El controlador acepta cualquier `sender`; `domain.yml:311` conserva slots entre
sesiones. Distintos usuarios pueden compartir contexto, IDs y confirmaciones.

Derivar en servidor una identidad de conversación asociada al usuario autenticado
y una sesión validada. Invalidarla al cerrar sesión. Reiniciar los slots de órdenes
y operaciones pendientes; no arrastrar una confirmación a otra sesión o recurso.

### Cancelar elimina físicamente la orden

`actions.py:220` llama DELETE; `orders.controller.ts:179` ejecuta
`findByIdAndDelete`. Ya existe `POST /orders/:id/cancel` que cambia el estado,
pero la acción no lo utiliza. La historia pregunta por confirmación, mientras que
la acción y la API no comprueban una autorización de cancelación vinculada al recurso.

Usar el endpoint de cancelación y validar propietario/rol, estado actual y transiciones
permitidas. Para confirmaciones, guardar una operación pendiente con orden exacta,
usuario, expiración y consumo único; revalidar antes de modificar. Incorporar
idempotencia y auditoría. No habilitar borrado físico mediante lenguaje natural.
La cancelación de una orden pagada necesita una política explícita de reembolso.

El PUT genérico (`orders.controller.ts:159`) pasa `req.body` a Mongoose. Usar una
lista de campos permitidos por operación. El PATCH de estado carece de
`runValidators`; ambos requieren además reglas de transición, no solo un enum.

## Prioridad 1: exactitud y rendimiento de consultas

1. **Clientes:** `Order.find().populate('customerId')` devuelve un objeto;
   `actions.py:340` lo usa como clave de diccionario. Normalizar el ID o, preferiblemente,
   calcular el ranking en Mongo y devolver un DTO pequeño y estable.
2. **Períodos:** implementar el filtro solicitado en `actions.py:760`; definir zona
   `America/Lima`, convertir límites a UTC y usar intervalos `[inicio, fin)`.
   Nunca presentar cifras de demostración como resultado de una consulta.
3. **Identificadores:** NLU etiqueta `12345` como `order_id`, mientras Mongo espera
   ObjectId. Las frases de cancelación suelen extraer `order_number`, pero la acción
   exige `order_id`. Resolver `ORD-000012` en backend con autorización; no pedir IDs internos.
4. **Estados:** normalizar `confirmada`, `enviada`, `entregada` a los enums ingleses
   del backend. Rechazar estados desconocidos y transiciones prohibidas.
5. **Datos faltantes:** solicitar producto, cliente u orden antes de consultar.
   `action_get_customer_info` solo usa ID aunque sus ejemplos incluyen nombre/correo;
   `action_get_payment_status` solo usa número aunque hay ejemplos con ID.
6. **Métricas:** los rankings suman órdenes sin filtrar pagos; "carritos abandonados"
   significa actualmente órdenes pendientes, sin umbral de tiempo. Definir las métricas
   de negocio antes de entrenar las frases que las solicitan.

Las acciones descargan colecciones completas, filtran y ordenan en Python. Proponer
endpoints acotados como consulta por número de orden, búsqueda paginada de productos
y resumen de ventas por período. Aplicar filtros y autorización en Mongo, proyecciones
de campos y agregaciones; usar `lean()` cuando no se necesiten documentos Mongoose.

Evaluar índices según las consultas reales, por ejemplo `(customerId, createdAt)`
y `(paymentStatus, createdAt)`. Verificar los índices desplegados y usar `explain`
antes/después; no crear todos los índices posibles sin medir. Mantener la unicidad
del número de orden. Limitar resultados y amplitud del período solicitado.

Crear un cliente HTTP común para acciones: timeout de conexión/lectura, errores
genéricos al usuario y logs con identificador de correlación. Considerar cliente
asíncrono reutilizable y límites de concurrencia. Reintentar únicamente lecturas
transitorias con límites; escrituras solo con garantías de idempotencia. El timeout
de 30 segundos en Express no detiene la petición Python que sigue sin límite.

Añadir validación de tipo y longitud del mensaje, rate limiting por identidad/IP y
presupuesto de consultas. Cualquier caché debe incluir permisos, usuario o ámbito,
filtros y período, con invalidación tras cambios. Estos controles también limitan
consumo abusivo. [OWASP API4](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/)

El controlador registra mensajes y respuestas completos y varias acciones devuelven
`str(e)`. Reducir logs a metadatos necesarios, redactar datos personales y definir
retención. No devolver excepciones internas ni cuerpos de error de proveedores.

## Prioridad 2: mejorar NLU y diálogo con evidencia

- Declarar pipeline y políticas explícitos: ahora ambos están en `null`, por lo que
  Rasa elige configuración automática. Guardar versiones, semillas y configuración
  efectiva para comparar experimentos.
- Separar ejemplos solapados: `ask_orders` incluye "ver órdenes pendientes" y
  "pedidos de hoy", que compiten con `ask_pending_orders` y `ask_recent_orders`.
  Considerar una consulta de órdenes con entidades de estado/período si simplifica
  el contrato; medir antes de consolidar intenciones.
- Recoger frases reales anonimizadas: faltas ortográficas, abreviaturas, expresiones
  peruanas, consultas ambiguas y preguntas fuera de alcance. Ampliar primero las
  intenciones de mayor error; multiplicar paráfrasis casi idénticas no basta.
- Normalizar estados y números; añadir regex/sinónimos cuando sean apropiados al
  pipeline. Toda entidad sigue siendo entrada no confiable para la API.
- Añadir manejo explícito de `nlu_fallback`, preguntas de aclaración y flujos de
  captura de datos faltantes. Calibrar umbrales sobre ejemplos etiquetados; una
  confianza alta no concede permisos. [Componentes Rasa 3.6](https://github.com/RasaHQ/rasa/blob/3.6.x/docs/docs/components.mdx)
- Probar una configuración más simple, evaluando retirar `ResponseSelector` si no
  hay intents de recuperación y `UnexpecTEDIntentPolicy` si no aporta valor medido.
  Mantener las capacidades conversacionales necesarias para los flujos de varios turnos.
  No subir épocas automáticamente: comparar precisión, errores críticos y tiempo.

Reemplazar los tests de ejemplo por conversaciones reales en español. Separar tests
de NLU, diálogo, acciones Python y autorización API; los tests de historias de Rasa
OSS no ejecutan las acciones personalizadas. Para medir generalización, reservar
ejemplos independientes y usar validación cruzada cuando cambie significativamente
el dataset; evitar que paráfrasis de una misma conversación aparezcan a ambos lados
del split. [Pruebas oficiales Rasa](https://legacy-docs-oss.rasa.com/docs/rasa/testing-your-assistant/)

Reportar macro-F1 y matriz de confusión por intención, F1 de entidades, fallbacks,
éxito de tarea y latencia p50/p95. No hay aún una línea base fiable para prometer
una mejora porcentual. Priorizar evitar escrituras incorrectas sobre reducir fallbacks.

## Prioridad 3: robustecer rasa-train y CI

El script `docker/rasa/train-if-needed.py` ya evita entrenamientos redundantes con
un hash de versión/config/domain/data y conserva el modelo en volumen. Es una buena base.

Mejoras propuestas:

- Incluir también `.yaml` en el inventario (hoy solo `.yml`) y registrar versiones
  de dependencias, receta de build y componentes personalizados que influyan en el modelo.
- Entrenar un candidato con nombre versionado en una ubicación separada, validar
  que carga y ejecutar evaluaciones antes de promoverlo. Conservar el modelo anterior
  para rollback y publicar modelo/manifiesto de forma atómica; no sobrescribir el activo.
- Evitar entrenadores simultáneos sobre el mismo volumen mediante bloqueo/exclusión.
- Ejecutar validación y tests aunque el hash permita reutilizar el modelo: cambios en
  actions o seguridad no necesariamente requieren entrenar, pero sí requieren pruebas.
- Distinguir evaluación de datos, historias y pruebas de integración. La validación
  actual no sustituye esos controles. Incorporar explícitamente tests a la imagen/job;
  el Dockerfile actual copia `data`, pero no `tests`.
- En PR a main/dev: validación, tests de acciones/API y evaluación relacionada con
  los archivos modificados. Para promoción: evaluación completa del candidato,
  comparación con línea base y pruebas de permisos/cancelación. Mantener entrenamiento
  costoso fuera de cambios que no afectan al modelo.

## Criterios de aceptación para la implementación

1. Sin token válido: 401. Sin permiso sobre recurso/acción: 403 o 404 según contrato.
2. Dos usuarios no comparten slots ni pueden seleccionar el sender del otro.
3. Cancelar conserva la orden y exige autorización y confirmación vigente; reintentar
   no duplica efectos. Una respuesta "sí" fuera de contexto no modifica datos.
4. Datos faltantes producen aclaraciones; no errores Python ni cifras de ejemplo.
5. Pruebas de consultas usan fixtures con relaciones pobladas, catálogos vacíos,
   pagos fallidos/reembolsados y límites de fecha en Lima.
6. Acciones con API lenta/fallida terminan dentro de límites medidos; listados y
   agregaciones respetan paginación, rango temporal y permisos.
7. Existe un reporte NLU independiente, sin fuga entre entrenamiento/evaluación,
   antes de decidir si el siguiente modelo mejora al actual.

La revisión deja estos riesgos documentados; todavía no están corregidos en la aplicación.
