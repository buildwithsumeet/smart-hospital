import mongoose from 'mongoose';
import { config } from '../config';
import { createLogger } from '@hospital/common';

const logger = createLogger('NotificationService:DB');

export class Database {
  private static isConnected = false;

  public static async connect(): Promise<boolean> {
    try {
      await mongoose.connect(config.mongo.uri, {
        serverSelectionTimeoutMS: 3000
      });
      this.isConnected = true;
      logger.info('Connected to MongoDB for Notification Service');
      return true;
    } catch (err: any) {
      logger.warn(`MongoDB connection failed: ${err.message}. Operating in memory/fallback mode.`);
      this.isConnected = false;
      return false;
    }
  }

  public static async close(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
    }
  }
}
