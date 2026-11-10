import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { AuthUserPayload, UserRole } from '@hospital/common';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class TokenService {
  public static generateAccessToken(user: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    patientId?: string;
    doctorId?: string;
  }): string {
    const payload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      patientId: user.patientId,
      doctorId: user.doctorId
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any
    });
  }

  public static generateRefreshToken(userId: string): { token: string; hash: string; expiresAt: Date } {
    const token = crypto.randomBytes(40).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Default 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return { token, hash, expiresAt };
  }

  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static verifyAccessToken(token: string): AuthUserPayload {
    return jwt.verify(token, config.jwt.secret) as AuthUserPayload;
  }
}
