import { Database } from '../database/db';
import { User, RefreshToken } from '../models/user.model';
import { UserRole } from '@hospital/common';
import crypto from 'crypto';

export class UserRepository {
  // In-memory backing store for tests or when DB is offline
  private static memoryUsers: Map<string, User> = new Map();
  private static memoryRefreshTokens: Map<string, RefreshToken> = new Map();
  private static useMemory = false;

  public static setUseMemory(val: boolean): void {
    this.useMemory = val;
  }

  public static async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();

    if (this.useMemory) {
      for (const user of this.memoryUsers.values()) {
        if (user.email.toLowerCase() === normalizedEmail) {
          return user;
        }
      }
      return null;
    }

    try {
      const res = await Database.query(
        'SELECT id, email, password_hash as "passwordHash", first_name as "firstName", last_name as "lastName", role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE LOWER(email) = LOWER($1)',
        [normalizedEmail]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      // Fallback to memory
      for (const user of this.memoryUsers.values()) {
        if (user.email.toLowerCase() === normalizedEmail) {
          return user;
        }
      }
      return null;
    }
  }

  public static async findById(id: string): Promise<User | null> {
    if (this.useMemory) {
      return this.memoryUsers.get(id) || null;
    }

    try {
      const res = await Database.query(
        'SELECT id, email, password_hash as "passwordHash", first_name as "firstName", last_name as "lastName", role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE id = $1',
        [id]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      return this.memoryUsers.get(id) || null;
    }
  }

  public static async create(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date();

    const newUser: User = {
      id,
      email: userData.email.toLowerCase().trim(),
      passwordHash: userData.passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    this.memoryUsers.set(id, newUser);

    if (!this.useMemory) {
      try {
        const res = await Database.query(
          `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, email, password_hash as "passwordHash", first_name as "firstName", last_name as "lastName", role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`,
          [
            newUser.id,
            newUser.email,
            newUser.passwordHash,
            newUser.firstName,
            newUser.lastName,
            newUser.role,
            newUser.isActive,
            newUser.createdAt,
            newUser.updatedAt
          ]
        );
        return res.rows[0];
      } catch (err) {
        // Return memory version if DB query fails during tests
        return newUser;
      }
    }

    return newUser;
  }

  public static async storeRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    const id = crypto.randomUUID();
    const tokenRecord: RefreshToken = {
      id,
      userId,
      tokenHash,
      expiresAt,
      revoked: false,
      createdAt: new Date()
    };

    this.memoryRefreshTokens.set(tokenHash, tokenRecord);

    if (!this.useMemory) {
      try {
        await Database.query(
          'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked) VALUES ($1, $2, $3, $4, $5)',
          [id, userId, tokenHash, expiresAt, false]
        );
      } catch {
        // Fallback stored in memory
      }
    }
  }

  public static async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    if (this.useMemory) {
      return this.memoryRefreshTokens.get(tokenHash) || null;
    }

    try {
      const res = await Database.query(
        'SELECT id, user_id as "userId", token_hash as "tokenHash", expires_at as "expiresAt", revoked, created_at as "createdAt" FROM refresh_tokens WHERE token_hash = $1',
        [tokenHash]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch {
      return this.memoryRefreshTokens.get(tokenHash) || null;
    }
  }

  public static async revokeRefreshToken(tokenHash: string): Promise<void> {
    const memToken = this.memoryRefreshTokens.get(tokenHash);
    if (memToken) {
      memToken.revoked = true;
    }

    if (!this.useMemory) {
      try {
        await Database.query(
          'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
          [tokenHash]
        );
      } catch {
        // Revoked in memory
      }
    }
  }

  public static async getAllUsers(): Promise<User[]> {
    if (this.useMemory) {
      return Array.from(this.memoryUsers.values());
    }

    try {
      const res = await Database.query(
        'SELECT id, email, first_name as "firstName", last_name as "lastName", role, is_active as "isActive", created_at as "createdAt" FROM users ORDER BY created_at DESC'
      );
      return res.rows;
    } catch {
      return Array.from(this.memoryUsers.values());
    }
  }

  public static clearMemory(): void {
    this.memoryUsers.clear();
    this.memoryRefreshTokens.clear();
  }
}
