import { Injectable } from '@nestjs/common';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../../common/config.ts';
import { hashPassword } from '../../common/security.ts';
import { SEED_PRODUCTS } from './catalog.ts';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  disabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price_vnd INTEGER NOT NULL,
  list_price_vnd INTEGER NOT NULL,
  duration_days INTEGER,
  scopes TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  highlight INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  percent_off INTEGER,
  amount_off INTEGER,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  list_amount INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  amount INTEGER NOT NULL,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL,
  provider_ref TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE TABLE IF NOT EXISTS entitlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  order_id INTEGER REFERENCES orders(id),
  source TEXT NOT NULL DEFAULT 'order',
  starts_at INTEGER NOT NULL,
  expires_at INTEGER,
  revoked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ent_user ON entitlements(user_id);
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  kind TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, kind)
);
CREATE TABLE IF NOT EXISTS payment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT,
  provider TEXT NOT NULL,
  payload TEXT NOT NULL,
  ok INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

@Injectable()
export class DbService {
  readonly db: DatabaseSync;
  readonly jwtSecret: string;

  constructor() {
    const file = config.dbPath();
    if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    this.db.exec(SCHEMA);
    this.seedProducts();
    this.jwtSecret = this.resolveSecret();
    this.seedAdmin();
  }

  // Chạy nhiều lệnh trong 1 giao dịch (rollback nếu lỗi).
  tx<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const out = fn();
      this.db.exec('COMMIT');
      return out;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  get<T = any>(sql: string, ...params: any[]): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }
  all<T = any>(sql: string, ...params: any[]): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }
  run(sql: string, ...params: any[]) {
    return this.db.prepare(sql).run(...params);
  }

  private resolveSecret(): string {
    const env = config.jwtSecret();
    if (env) return env;
    if (config.isProd()) throw new Error('Thiếu JWT_SECRET trong môi trường production.');
    // Dev: tự sinh và lưu lại để token không mất mỗi lần khởi động lại.
    const row = this.get<{ value: string }>("SELECT value FROM settings WHERE key = 'jwt_secret'");
    if (row) return row.value;
    const secret = crypto.randomBytes(48).toString('hex');
    this.run("INSERT INTO settings (key, value) VALUES ('jwt_secret', ?)", secret);
    return secret;
  }

  private seedProducts() {
    const count = this.get<{ n: number }>('SELECT COUNT(*) AS n FROM products')!.n;
    if (count > 0) return;
    for (const p of SEED_PRODUCTS) {
      this.run(
        `INSERT INTO products (id, kind, name, tagline, description, price_vnd, list_price_vnd, duration_days, scopes, active, highlight, sort)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        p.id, p.kind, p.name, p.tagline, p.description, p.priceVnd, p.listPriceVnd, p.durationDays, JSON.stringify(p.scopes), p.highlight ? 1 : 0, p.sort,
      );
    }
  }

  private seedAdmin() {
    const existing = this.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (existing) return;
    let password = config.adminPassword();
    let generated = false;
    if (!password) {
      password = crypto.randomBytes(9).toString('base64url');
      generated = true;
    }
    const username = config.adminUsername();
    const email = config.adminEmail() || `${username}@local.invalid`;
    this.run(
      `INSERT INTO users (username, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'admin', ?)`,
      username, email, 'Quản trị viên', hashPassword(password), Date.now(),
    );
    if (generated) {
      console.log('='.repeat(60));
      console.log(`Đã tạo tài khoản quản trị: ${username} / ${password}`);
      console.log('Hãy đổi mật khẩu hoặc đặt ADMIN_PASSWORD trong backend/.env.');
      console.log('='.repeat(60));
    }
  }
}
