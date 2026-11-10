import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';

export type Principal = { role: 'admin' | 'customer' | 'rasa' | 'whatsapp'; id: string; customerId?: string; session: string };
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.includes('your-secret-key')) throw new Error('JWT_SECRET debe tener al menos 32 caracteres aleatorios');
  return secret;
}
export const identity = (res: Response): Principal => res.locals.principal;
const equal = (value: string, expected?: string) => !!expected && expected.length >= 32 &&
  Buffer.byteLength(value) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
const objectId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

// Authentication is checked before routes, including routes added in the future.
export async function securityGate(req: Request, res: Response, next: NextFunction) {
  const path = req.path.replace(/\/+$/, '') || '/';
  if (req.method === 'POST' && ['/auth/login', '/auth/register'].includes(path)) return next();
  if (['GET', 'HEAD'].includes(req.method) && /^\/products(?:\/[^/]+)?$/.test(path)) return next();
  // Unverified provider events must not modify payments. Use authenticated provider reconciliation.
  if (path.toLowerCase() === '/culqi/webhook') return res.status(503).json({ message: 'Webhook no habilitado: requiere verificación del proveedor' });
  try {
    const service = req.get('x-service-token');
    let principal: Principal;
    if (service) {
      const role = equal(service, process.env.RASA_ACTIONS_TOKEN) ? 'rasa' : equal(service, process.env.WA_SERVICE_TOKEN) ? 'whatsapp' : undefined;
      if (!role) return res.status(401).json({ message: 'Credenciales inválidas' });
      principal = { role, id: role, session: role };
    } else {
      const bearer = req.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
      if (!bearer) return res.status(401).json({ message: 'Autenticación requerida' });
      const decoded = jwt.verify(bearer, jwtSecret(), { algorithms: ['HS256'] });
      if (typeof decoded === 'string' || !objectId(decoded.userId)) return res.status(401).json({ message: 'Token inválido' });
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive || (decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) return res.status(401).json({ message: 'Sesión inválida' });
      principal = { role: user.role, id: String(user._id), customerId: user.customerId ? String(user.customerId) : undefined,
        session: createHmac('sha256', jwtSecret()).update(bearer).digest('hex') };
    }
    res.locals.principal = principal;
    if (path === '/chatbot') return principal.role === 'admin' ? next() : res.status(403).json({ message: 'Se requiere administrador' });
    if (path === '/auth/register-from-whatsapp') return principal.role === 'whatsapp' ? next() : res.sendStatus(403);
    if (path === '/auth/me') return ['admin', 'customer'].includes(principal.role) ? next() : res.sendStatus(403);
    if (principal.role === 'admin') return next();
    if (principal.role === 'rasa') {
      // Service credential is deliberately read-only, even if a model predicts a write action.
      return req.method === 'GET' && /^\/(orders|customers|products|payments)(\/[^/]+)?$/.test(path) ? next() : res.sendStatus(403);
    }
    if (principal.role === 'whatsapp') {
      const allowed = (req.method === 'GET' && /^\/(products|customers|orders|conversations)(\/[^/]+)*$/.test(path)) ||
        (req.method === 'POST' && ['/customers', '/orders', '/conversations', '/culqi/create-order'].includes(path)) ||
        (req.method === 'PUT' && /^\/customers\/[a-f\d]{24}$/i.test(path) &&
          Object.keys(req.body || {}).every(key => ['name', 'email'].includes(key) && typeof req.body[key] === 'string' && req.body[key].length <= 200)) ||
        (['POST', 'PATCH'].includes(req.method) && /^\/conversations\/[^/]+(?:\/cart(?:\/(?:add|remove))?|\/step|\/clear-cart)?$/.test(path));
      return allowed ? next() : res.sendStatus(403);
    }
    const cid = principal.customerId;
    if (!cid) return res.status(403).json({ message: 'Cuenta sin cliente vinculado' });
    if (path === '/orders' && req.method === 'GET') return next(); // Controller scopes collection.
    if (path === '/orders' && req.method === 'POST') {
      if (req.body.customerId && req.body.customerId !== cid) return res.sendStatus(403);
      req.body.customerId = cid;
      delete req.body.customer;
      return next();
    }
    if (path === `/orders/customer/${cid}` && req.method === 'GET') return next();
    const orderRoute = path.match(/^\/orders\/([a-f\d]{24})(\/cancel)?$/i);
    if (orderRoute && !orderRoute[2] && req.method === 'PUT') {
      const keys = Object.keys(req.body || {});
      if (!keys.length || keys.some(key => !['deliveryAddress', 'notes'].includes(key))) return res.sendStatus(403);
      return await Order.exists({ _id: orderRoute[1], customerId: cid, status: 'pending', paymentStatus: 'pending' }) ? next() : res.sendStatus(404);
    }
    if (orderRoute && ((req.method === 'GET' && !orderRoute[2]) || (req.method === 'POST' && orderRoute[2]))) {
      return await Order.exists({ _id: orderRoute[1], customerId: cid }) ? next() : res.sendStatus(404);
    }
    if (path === `/customers/${cid}` && req.method === 'GET') return next();
    if (path === '/payments' && req.method === 'GET') return next(); // Controller scopes collection.
    const paymentRoute = path.match(/^\/payments\/([a-f\d]{24})$/i);
    if (paymentRoute && req.method === 'GET') return await Payment.exists({ _id: paymentRoute[1], customerId: cid }) ? next() : res.sendStatus(404);
    if (path === '/culqi/create-order' && req.method === 'POST' && objectId(req.body.orderId)) {
      return await Order.exists({ _id: req.body.orderId, customerId: cid }) ? next() : res.sendStatus(404);
    }
    if (req.method === 'POST' && ['/culqi/create-charge', '/culqi/verify-payment', '/culqi/confirm-order', '/culqi/cancel-authentication'].includes(path)) {
      if (path !== '/culqi/confirm-order' && objectId(req.body.orderId)) {
        return await Order.exists({ _id: req.body.orderId, customerId: cid }) ? next() : res.sendStatus(404);
      }
      if (typeof req.body.culqiOrderId !== 'string') return res.sendStatus(400);
      return await Payment.exists({ culqiOrderId: req.body.culqiOrderId, customerId: cid }) ? next() : res.sendStatus(404);
    }
    const gatewayRoute = path.match(/^\/culqi\/(?:order|payment\/culqi)\/([^/]+)$/);
    if (gatewayRoute && req.method === 'GET') return await Payment.exists({ culqiOrderId: gatewayRoute[1], customerId: cid }) ? next() : res.sendStatus(404);
    const paymentDetail = path.match(/^\/culqi\/payment\/([a-f\d]{24})$/i);
    if (paymentDetail && req.method === 'GET') return await Payment.exists({ _id: paymentDetail[1], customerId: cid }) ? next() : res.sendStatus(404);
    return res.sendStatus(403);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return res.status(401).json({ message: 'Token inválido o expirado' });
    return res.status(503).json({ message: 'No se pudo verificar el acceso' });
  }
}
