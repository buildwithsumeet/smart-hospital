import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, AuthUserPayload } from '@hospital/common';

const PUBLIC_ROUTES: Array<{ method: string; pathRegex: RegExp }> = [
  { method: 'GET', pathRegex: /^\/health\/?$/ },
  { method: 'GET', pathRegex: /^\/ready\/?$/ },
  { method: 'GET', pathRegex: /^\/(docs|api-docs)(\/.*)?$/ },
  { method: 'POST', pathRegex: /^\/api\/v1\/auth\/(login|register|refresh)\/?$/ },
  { method: 'GET', pathRegex: /^\/api\/v1\/doctors(\/departments|\/.*\/slots|\/.*)?\/?$/ },
  { method: 'GET', pathRegex: /^\/api\/v1\/ai\/health\/?$/ },
  { method: 'POST', pathRegex: /^\/api\/v1\/ai\/triage\/?$/ }
];

export const gatewayAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const isPublic = PUBLIC_ROUTES.some(
    (route) => route.method === req.method && route.pathRegex.test(req.path)
  );

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isPublic) {
      return next();
    }
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;
    req.user = decoded;

    // Enrich Downstream Request Headers
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-email'] = decoded.email;
    if (decoded.patientId) req.headers['x-patient-id'] = decoded.patientId;
    if (decoded.doctorId) req.headers['x-doctor-id'] = decoded.doctorId;

    next();
  } catch (err: any) {
    if (isPublic) {
      return next();
    }
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Authentication token expired'));
    }
    return next(new UnauthorizedError('Invalid authentication token'));
  }
};
