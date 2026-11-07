# Revisión de lint y dependencias — 07/11/2026

El informe inicial tenía 1663 errores: 1481 por comillas, 3 por punto y coma,
150 usos de `any` y 29 incidencias restantes. Las correcciones de formato usan
ESLint; Prettier ahora comparte comillas simples y punto y coma.

Se eliminaron imports, bindings de catch y variables sin uso, se explicitó la
firma de `asyncHandler` y se sustituyó una interfaz vacía por un alias equivalente.
El middleware de errores conserva cuatro argumentos: Express depende de esa aridad.
No ejecutar scripts de seed para comprobar lint: mutan la base de datos.

`react/prop-types` se desactiva únicamente en TypeScript, donde ya hay contratos
de props. Las reglas de variables sin uso y otras reglas de errores permanecen.
`no-explicit-any` pasa a advertencia como deuda de tipado, no se considera resuelto:
quedan 150 casos. `npm run lint` admite hasta 150 advertencias para impedir que
crezca el total; `npm run lint:strict` exige cero. Sustituir `any` por `unknown`
sin revisar consumidores no es una corrección segura automática.

## Dependencias npm

Se ejecutó `npm audit fix --ignore-scripts`, sin `--force`, conservando los rangos
de versiones declarados y la versión 1.34.7 de WhatsApp Web. El lockfile registra
las versiones nuevas; instalar con `npm ci` para reproducirlas. No se actualizó
el npm global del equipo.

| Paquete | Antes | Después |
| --- | --- | --- |
| axios | 1.12.2 | 1.21.0 |
| mongoose | 8.19.1 | 8.24.8 |
| express-rate-limit | 8.1.0 | 8.7.3 |
| vite | 7.1.9 | 7.3.7 |
| react-router | 7.9.4 | 7.18.5 |
| tar | 7.5.1 | 7.5.22 |
| shell-quote | 1.8.3 | 1.12.0 |
| proxy-addr | 2.0.7 | 2.0.8 |

La auditoría bajó de 57 avisos (4 críticos, 39 altos, 12 moderados, 2 bajos)
a 24 (12 altos y 12 moderados). Son avisos de paquetes, incluyendo propagación
por dependencias; no equivalen necesariamente a 24 fallos explotables distintos.
Persisten cadenas de Puppeteer/WhatsApp (FTP, proxy, archivos ZIP, Zod) y herramientas
de desarrollo (glob/minimatch/TypeScript ESLint). No se aplicaron downgrades ni
overrides de versiones mayores propuestos por el resolvedor. Resolver esos avisos
requiere revisar las rutas afectadas y probar la migración del navegador/conector.

Una auditoría sin críticos no significa que el despliegue no tenga riesgos.
Las pruebas automatizadas tampoco sustituyen vincular un teléfono de prueba ni
verificar pagos en sandbox tras actualizar las dependencias.

Comandos de comprobación:

```bash
npm run lint
npm run build:all
npm test --workspace=api
npm run test:whatsapp
npm audit
```

`npm audit` sigue devolviendo código distinto de cero por los avisos pendientes.

Verificación local: lint terminó con 0 errores y 150 advertencias; compilaron API,
frontend, docs y bot; pasaron las 22 pruebas de autorización API y las 14 del bot.
No se probaron cobros ni vinculación de un número real. El navegador/conector
conservan Puppeteer 24.38.0 y WhatsApp Web 1.34.7.
