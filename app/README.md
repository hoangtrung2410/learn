# LinguaPulse – Học tiếng Trung (HSK 1-6) & tiếng Anh (A1-C1, TOEIC, IELTS)

## Cấu trúc
- `frontend/` – giao diện React + Vite, chạy cổng **5173**, gọi `/api` qua proxy sang backend.
- `backend/` – API NestJS + Gemini, chạy cổng **3000**. Cấu hình key trong `backend/.env` (mẫu: `backend/.env.example`). `backend/scripts/` là script sinh dữ liệu.
- `app/` – ứng dụng **mobile Flutter** (Android/iOS/web), gọi API backend. Mã nguồn ở `app/lib/`, dữ liệu bài học ở `app/assets/data/curriculum.json`. Thư mục này cũng chứa START.bat và README.

Frontend và backend là hai gói độc lập, mỗi bên có `package.json` và `node_modules` riêng.

## App mobile (Flutter)
Cần Flutter SDK (đã cài ở `E:\dev\flutter`; thêm `E:\dev\flutter\bin` vào PATH). Bật backend trước, rồi trong thư mục `app/`:
- Xem thử trên trình duyệt: `flutter run -d chrome`
- Máy ảo Android: `flutter run` (tự dùng `http://10.0.2.2:3000`; cần cài Android Studio/SDK)
- Điện thoại thật: `flutter run --dart-define=API_URL=http://<IP-máy-tính>:3000`

Cập nhật bài học: sửa `frontend/src/data/curriculum.ts` rồi chạy trong `backend/`:
`node node_modules/tsx/dist/cli.mjs scripts/export_curriculum.ts ../app/assets/data/curriculum.json`

Màn hình: Lộ trình (làm bài trắc nghiệm / ghép câu / nghe), Hội thoại AI (31 tình huống), Tra cứu từ bằng AI, Hồ sơ (XP, chuỗi ngày, đổi ngôn ngữ). Chưa có: chấm phát âm bằng micro, đăng nhập.

## Bản miễn phí đưa lên Vercel (không backend)
`cd frontend && npm run build:free` tạo bản tĩnh ở `frontend/dist`: không đăng nhập, không bảng giá, mở toàn bộ nội dung, tiến độ lưu trong trình duyệt, tính năng AI tắt. Trên Vercel: import repo, đặt **Root Directory = `frontend`** (file `frontend/vercel.json` đã khai báo lệnh build), rồi Deploy.

## Bán khoá học (tài khoản, thanh toán, quản trị)
- **Gói bán**: Miễn phí (HSK 1-2, tiếng Anh A1-A2), Premium 1 tháng / 12 tháng (mở mọi nội dung trả phí) và khoá lẻ mua một lần học vĩnh viễn (HSK 3-4, 5-6, 7-9, Anh B1-B2, C1, TOEIC, IELTS). Giá và danh mục sửa trong trang quản trị (tab **Sản phẩm**); giá khởi tạo nằm ở `backend/src/modules/db/catalog.ts`.
- **Dữ liệu** lưu bằng SQLite tại `backend/data/linguapulse.db` (đã bỏ khỏi git). Cần Node 22.5+.
- **Tài khoản quản trị** tạo ở lần chạy đầu: đặt `ADMIN_USERNAME` / `ADMIN_PASSWORD` trong `backend/.env`; nếu để trống, mật khẩu ngẫu nhiên được in ra console một lần.
- **Thanh toán**: `PAYMENT_PROVIDER=mock` (mặc định khi dev) dùng cổng giả lập, không trừ tiền thật; `PAYMENT_PROVIDER=vnpay` dùng VNPay với `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`. Khai báo trên cổng VNPay: Return URL `API_URL/api/payments/vnpay/return`, IPN URL `API_URL/api/payments/vnpay/ipn`. Cổng giả lập tự tắt khi `NODE_ENV=production`.
- **Production**: bắt buộc đặt `JWT_SECRET` (chuỗi ngẫu nhiên dài), `APP_URL`, `API_URL`. Build giao diện (`npm run build` trong `frontend/`) rồi chạy backend, một cổng phục vụ cả web lẫn API.
- **Hạn mức AI** mỗi ngày theo gói (`AI_LIMIT_FREE/PAID/PREMIUM`, `TTS_LIMIT_DAILY`); API AI bắt buộc đăng nhập.
- **Kiểm thử**: `cd backend && npm test` (49 test API: đăng ký/đăng nhập, phân quyền, đơn hàng, mã giảm giá, VNPay, hạn mức AI).
- **Trang pháp lý** (Điều khoản, Bảo mật, Hoàn tiền) là văn bản mẫu, cần rà soát pháp lý và điền thông tin đơn vị trước khi bán.
- Lưu ý: nội dung học được đóng gói trong frontend nên việc khoá nội dung ở giao diện chưa chống được người rành kỹ thuật; AI và đơn hàng thì được kiểm tra ở máy chủ. App Flutter (`app/`) chưa có đăng nhập nên chưa dùng được các API AI mới.

## Hội thoại AI
Dùng Gemini bản lite (nhanh ~1s, trả chữ theo luồng). Đổi model qua `GEMINI_CHAT_MODELS="a,b"` trong backend/.env. Nhớ KHÔNG đưa backend/.env lên git (đã có .gitignore).

## Chạy 1 lệnh (bản dùng thật)
Bấm đúp **app/START_PROD.bat**: tự build giao diện rồi chạy tất cả trên http://localhost:3000 (nhanh hơn chế độ dev).

## Chạy (chế độ dev)
Bấm đúp **app/START.bat** (lần đầu sẽ tự cài thư viện), trình duyệt mở tại http://localhost:5173.

Hoặc thủ công, mở hai cửa sổ terminal:
- `cd backend` → `npm install` → `npm run dev`
- `cd frontend` → `npm install` → `npm run dev`

(Nếu đường dẫn thư mục có ký tự `&` mà `npm run` lỗi, chạy trực tiếp: `node node_modules/tsx/dist/cli.mjs src/main.ts` trong backend, `node node_modules/vite/bin/vite.js` trong frontend.)

Mọi tính năng ôn luyện chạy **offline, không cần API key**. Chỉ hội thoại AI, chấm phát âm AI và giọng đọc Gemini cần `GEMINI_API_KEY` trong `backend/.env`; thiếu key thì giọng đọc tự chuyển sang giọng của trình duyệt.

## Dữ liệu học (frontend/src/data/packs)
- Từ vựng HSK 1-6 (~5.437 từ, đủ danh sách HSK 2.0 – chưa gồm HSK 3.0 cấp 7-9; có pinyin tự sinh, Hán Việt, câu ví dụ) + từ vựng tiếng Anh A1-C1 (~3.250 từ: cơ bản + TOEIC/IELTS).
- Ngân hàng câu hỏi: HSK 1-6 (~1.000 câu soạn tay + ~16.000 câu từ vựng/điền từ tự sinh từ kho từ) và tiếng Anh (~1.160 câu soạn tay + ~9.000 câu tự sinh; A1-C1, TOEIC, IELTS).
- Ngữ pháp: ~150 điểm HSK, ~100 chủ điểm tiếng Anh (tổng ~250).
- Tab **Ôn Luyện & Đề Thi**: Flashcard lặp lại ngắt quãng, Luyện nhanh, Thi thử tính giờ, Ôn lại câu sai, Ngữ pháp. Tiến độ lưu trên trình duyệt (localStorage).

Lưu ý: nội dung do AI soạn, chưa được giáo viên bản ngữ rà soát; từ vựng HSK có thể lệch cấp so với danh sách chính thức. Nên đối chiếu giáo trình khi thi thật.
