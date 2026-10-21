// Quyền truy cập (scope). Miễn phí: zh12 (HSK 1-2), ena (Anh A1-A2).
export const FREE_SCOPES = ['zh12', 'ena'] as const;
export const PAID_SCOPES = ['zh34', 'zh56', 'zh79', 'enb', 'enc', 'toeic', 'ielts'] as const;
export type Scope = (typeof FREE_SCOPES)[number] | (typeof PAID_SCOPES)[number];

export interface SeedProduct {
  id: string;
  kind: 'plan' | 'course';
  name: string;
  tagline: string;
  description: string;
  priceVnd: number;
  listPriceVnd: number; // giá gạch ngang (để hiện mức giảm)
  durationDays: number | null; // null = vĩnh viễn
  scopes: string[];
  sort: number;
  highlight?: boolean;
}

// Giá chỉ là giá khởi điểm; admin sửa được trong trang quản trị.
export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: 'plan-month',
    kind: 'plan',
    name: 'Premium 1 tháng',
    tagline: 'Mở toàn bộ khoá học trong 30 ngày',
    description: 'Toàn bộ HSK 3-9, tiếng Anh B1-C1, TOEIC, IELTS và hạn mức AI cao.',
    priceVnd: 199000,
    listPriceVnd: 199000,
    durationDays: 30,
    scopes: [...PAID_SCOPES],
    sort: 10,
  },
  {
    id: 'plan-year',
    kind: 'plan',
    name: 'Premium 12 tháng',
    tagline: 'Tiết kiệm nhất, học cả năm',
    description: 'Toàn bộ nội dung trả phí trong 365 ngày, hạn mức AI cao nhất.',
    priceVnd: 1490000,
    listPriceVnd: 2388000,
    durationDays: 365,
    scopes: [...PAID_SCOPES],
    sort: 20,
    highlight: true,
  },
  {
    id: 'course-zh34',
    kind: 'course',
    name: 'Tiếng Trung HSK 3-4',
    tagline: 'Từ sơ cấp lên trung cấp',
    description: 'Từ vựng, ngữ pháp, luyện đề và ôn tập thông minh HSK 3 và HSK 4. Học vĩnh viễn.',
    priceVnd: 399000,
    listPriceVnd: 499000,
    durationDays: null,
    scopes: ['zh34'],
    sort: 30,
  },
  {
    id: 'course-zh56',
    kind: 'course',
    name: 'Tiếng Trung HSK 5-6',
    tagline: 'Chinh phục cao cấp',
    description: 'Hơn 4.000 từ HSK 5-6, ngữ pháp và luyện đề nâng cao. Học vĩnh viễn.',
    priceVnd: 599000,
    listPriceVnd: 799000,
    durationDays: null,
    scopes: ['zh56'],
    sort: 40,
  },
  {
    id: 'course-zh79',
    kind: 'course',
    name: 'Tiếng Trung HSK 7-9',
    tagline: 'Từ vựng chuyên sâu',
    description: 'Bộ từ vựng nâng cao theo chủ đề: pháp luật, kinh tế, khoa học, văn hoá. Học vĩnh viễn.',
    priceVnd: 499000,
    listPriceVnd: 599000,
    durationDays: null,
    scopes: ['zh79'],
    sort: 50,
  },
  {
    id: 'course-enb',
    kind: 'course',
    name: 'Tiếng Anh B1-B2',
    tagline: 'Giao tiếp và học thuật',
    description: 'Từ vựng, ngữ pháp và luyện đề tiếng Anh trình độ B1-B2. Học vĩnh viễn.',
    priceVnd: 399000,
    listPriceVnd: 499000,
    durationDays: null,
    scopes: ['enb'],
    sort: 60,
  },
  {
    id: 'course-enc',
    kind: 'course',
    name: 'Tiếng Anh C1',
    tagline: 'Thành thạo nâng cao',
    description: 'Từ vựng và luyện đề tiếng Anh trình độ C1. Học vĩnh viễn.',
    priceVnd: 399000,
    listPriceVnd: 499000,
    durationDays: null,
    scopes: ['enc'],
    sort: 70,
  },
  {
    id: 'course-toeic',
    kind: 'course',
    name: 'Luyện thi TOEIC',
    tagline: 'Từ vựng công sở, hợp đồng, tài chính',
    description: 'Hơn 1.200 từ TOEIC theo chủ đề và ngân hàng câu hỏi luyện thi. Học vĩnh viễn.',
    priceVnd: 499000,
    listPriceVnd: 699000,
    durationDays: null,
    scopes: ['toeic'],
    sort: 80,
  },
  {
    id: 'course-ielts',
    kind: 'course',
    name: 'Luyện thi IELTS',
    tagline: 'Từ vựng học thuật AWL, collocation',
    description: 'Hơn 1.200 từ IELTS, cụm động từ, thành ngữ và ngân hàng câu hỏi. Học vĩnh viễn.',
    priceVnd: 599000,
    listPriceVnd: 799000,
    durationDays: null,
    scopes: ['ielts'],
    sort: 90,
  },
];
