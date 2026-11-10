import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from './password.service';
import { TokenService, TokenPair } from './token.service';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  UserRole,
  EventBus,
  EventTopics,
  UserRegisteredEventPayload
} from '@hospital/common';
import { UserResponse } from '../models/user.model';

export class AuthService {
  public static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<{ user: UserResponse; tokens: TokenPair }> {
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await PasswordService.hash(data.password);
    const role = data.role || UserRole.PATIENT;

    const user = await UserRepository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role
    });

    const tokens = await this.generateAndStoreTokens(user);

    // Publish User Registered Event to RabbitMQ topic exchange
    const eventBus = EventBus.getInstance();
    const eventPayload: UserRegisteredEventPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    await eventBus.publish(EventTopics.USER_REGISTERED, eventPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      tokens
    };
  }

  public static async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: UserResponse; tokens: TokenPair }> {
    const user = await UserRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account has been deactivated. Please contact support.');
    }

    const isMatch = await PasswordService.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.generateAndStoreTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      tokens
    };
  }

  public static async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!token) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const tokenHash = TokenService.hashToken(token);
    const storedToken = await UserRepository.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revoked) {
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    if (new Date() > new Date(storedToken.expiresAt)) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = await UserRepository.findById(storedToken.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or inactive');
    }

    // Revoke used token (Token Rotation for security)
    await UserRepository.revokeRefreshToken(tokenHash);

    // Issue new pair
    const tokens = await this.generateAndStoreTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  public static async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = TokenService.hashToken(refreshToken);
      await UserRepository.revokeRefreshToken(tokenHash);
    }
  }

  public static async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };
  }

  public static async getAllUsers(): Promise<UserResponse[]> {
    const users = await UserRepository.getAllUsers();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt
    }));
  }

  private static async generateAndStoreTokens(user: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  }): Promise<TokenPair> {
    const accessToken = TokenService.generateAccessToken(user);
    const { token: refreshToken, hash, expiresAt } = TokenService.generateRefreshToken(user.id);

    await UserRepository.storeRefreshToken(user.id, hash, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: '1h'
    };
  }
}
