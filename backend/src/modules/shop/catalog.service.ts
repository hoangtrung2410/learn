import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service.ts';

export interface Product {
  id: string;
  kind: 'plan' | 'course';
  name: string;
  tagline: string;
  description: string;
  priceVnd: number;
  listPriceVnd: number;
  durationDays: number | null;
  scopes: string[];
  active: boolean;
  highlight: boolean;
  sort: number;
}

const map = (r: any): Product => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  tagline: r.tagline,
  description: r.description,
  priceVnd: r.price_vnd,
  listPriceVnd: r.list_price_vnd,
  durationDays: r.duration_days,
  scopes: JSON.parse(r.scopes),
  active: !!r.active,
  highlight: !!r.highlight,
  sort: r.sort,
});

@Injectable()
export class CatalogService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  list(includeInactive = false): Product[] {
    const rows = this.db.all(`SELECT * FROM products ${includeInactive ? '' : 'WHERE active = 1'} ORDER BY sort, id`);
    return rows.map(map);
  }

  get(id: string): Product | null {
    const r = this.db.get('SELECT * FROM products WHERE id = ?', id);
    return r ? map(r) : null;
  }

  update(id: string, body: any): Product {
    const cur = this.get(id);
    if (!cur) throw new NotFoundException('Không tìm thấy sản phẩm.');
    const next = { ...cur };
    if (body.name !== undefined) next.name = String(body.name).trim();
    if (body.tagline !== undefined) next.tagline = String(body.tagline).trim();
    if (body.description !== undefined) next.description = String(body.description).trim();
    if (body.priceVnd !== undefined) next.priceVnd = Number(body.priceVnd);
    if (body.listPriceVnd !== undefined) next.listPriceVnd = Number(body.listPriceVnd);
    if (body.active !== undefined) next.active = !!body.active;
    if (body.highlight !== undefined) next.highlight = !!body.highlight;
    if (!next.name) throw new BadRequestException('Tên sản phẩm không được để trống.');
    if (!Number.isInteger(next.priceVnd) || next.priceVnd < 0 || next.priceVnd > 100_000_000) throw new BadRequestException('Giá bán không hợp lệ.');
    if (next.priceVnd > 0 && next.priceVnd < 5000) throw new BadRequestException('Giá bán tối thiểu 5.000đ (hoặc 0đ để tặng).');
    if (!Number.isInteger(next.listPriceVnd) || next.listPriceVnd < next.priceVnd) next.listPriceVnd = next.priceVnd;
    this.db.run(
      `UPDATE products SET name=?, tagline=?, description=?, price_vnd=?, list_price_vnd=?, active=?, highlight=? WHERE id=?`,
      next.name, next.tagline, next.description, next.priceVnd, next.listPriceVnd, next.active ? 1 : 0, next.highlight ? 1 : 0, id,
    );
    return this.get(id)!;
  }
}
