import { Pool, QueryResult } from 'pg';
import { config } from '../config';
import { createLogger } from '@hospital/common';

const logger = createLogger('BillingService:DB');

export class Database {
  private static pool: Pool | null = null;
  private static isConnected = false;

  public static getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: config.db.connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });

      this.pool.on('error', (err) => {
        logger.error('PostgreSQL error in BillingService', err);
      });
    }
    return this.pool;
  }

  public static async query(text: string, params?: any[]): Promise<QueryResult<any>> {
    const pool = this.getPool();
    return pool.query(text, params);
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const pool = this.getPool();
      await pool.query('SELECT 1');
      this.isConnected = true;
      logger.info('Connected to PostgreSQL Billing database');
      return true;
    } catch (err: any) {
      logger.warn(`PostgreSQL connection failed: ${err.message}. Operating in test/fallback mode.`);
      this.isConnected = false;
      return false;
    }
  }

  public static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }
}
