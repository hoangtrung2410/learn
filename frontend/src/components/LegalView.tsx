import React, { useEffect, useState } from 'react';
import { AlertTriangle, FileText, RotateCcw, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';

type Page = 'terms' | 'privacy' | 'refund';

interface LegalViewProps {
  page: Page;
  onChangePage: (p: Page) => void;
}

const TABS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'terms', label: 'Điều khoản sử dụng', icon: <FileText size={16} /> },
  { id: 'privacy', label: 'Chính sách bảo mật', icon: <ShieldCheck size={16} /> },
  { id: 'refund', label: 'Chính sách hoàn tiền', icon: <RotateCcw size={16} /> },
];

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-8 mb-3 text-xl font-bold text-white">{children}</h2>
);
const UL: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="my-3 list-disc space-y-1.5 pl-5 marker:text-emerald-500">
    {items.map((i) => <li key={i}>{i}</li>)}
  </ul>
);

export const LegalView: React.FC<LegalViewProps> = ({ page, onChangePage }) => {
  const [support, setSupport] = useState<{ email?: string; phone?: string } | null>(null);

  useEffect(() => {
    let alive = true;
    api<{ support?: { email?: string; phone?: string } }>('/api/catalog')
      .then((r) => { if (alive && r?.support) setSupport(r.support); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const today = new Date().toLocaleDateString('vi-VN');

  const contact = support?.email ? (
    <>
      email <a href={`mailto:${support.email}`} className="font-semibold text-emerald-400 underline break-all">{support.email}</a>
      {support.phone ? <>, điện thoại <span className="font-semibold text-slate-100">{support.phone}</span></> : null}
    </>
  ) : (
    <>liên hệ qua email hỗ trợ</>
  );

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChangePage(t.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
              page === t.id ? 'bg-emerald-500 text-slate-950' : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-8 text-slate-300 leading-relaxed">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{TABS.find((t) => t.id === page)?.label}</h1>
        <p className="mt-2 text-sm text-slate-500">Cập nhật lần cuối: {today}</p>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs sm:text-sm text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>Đây là văn bản mẫu. Chủ website cần rà soát với tư vấn pháp lý và điền thông tin pháp nhân (tên đơn vị, mã số thuế, địa chỉ) trước khi bán hàng.</span>
        </div>

        {page === 'terms' && (
          <div>
            <H2>1. Chấp nhận điều khoản</H2>
            <p>Khi tạo tài khoản hoặc sử dụng LinguaHub AI, bạn đồng ý với các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.</p>
            <H2>2. Tài khoản</H2>
            <UL items={[
              'Bạn cần cung cấp thông tin chính xác khi đăng ký và tự chịu trách nhiệm bảo mật mật khẩu của mình.',
              'Mỗi tài khoản chỉ dành cho một cá nhân sử dụng.',
              'Chúng tôi có quyền tạm khoá hoặc chấm dứt tài khoản vi phạm điều khoản.',
            ]} />
            <H2>3. Quyền sử dụng nội dung</H2>
            <p>Toàn bộ nội dung học tập trên LinguaHub AI (từ vựng, bài học, đề luyện tập, giao diện, phần mềm) thuộc quyền của chủ website hoặc bên cấp phép. Bạn được cấp quyền sử dụng cá nhân, không độc quyền, không chuyển nhượng để học tập.</p>
            <h3 className="mt-4 mb-2 font-semibold text-slate-100">Các hành vi bị cấm</h3>
            <UL items={[
              'Chia sẻ, cho mượn, bán lại tài khoản hoặc quyền truy cập đã mua.',
              'Sao chép, tải hàng loạt, phân phối lại hoặc khai thác thương mại nội dung khi chưa được đồng ý bằng văn bản.',
              'Dùng công cụ tự động để thu thập dữ liệu hoặc gây quá tải hệ thống.',
              'Cố ý can thiệp, dò lỗi hoặc vượt qua cơ chế phân quyền của dịch vụ.',
            ]} />
            <H2>4. Thanh toán và quyền truy cập</H2>
            <UL items={[
              'Giá hiển thị bằng đồng Việt Nam (VND). Thanh toán được xử lý qua cổng thanh toán của bên thứ ba.',
              'Sau khi thanh toán thành công, quyền truy cập được mở tự động theo sản phẩm đã mua.',
              'Gói có thời hạn sẽ hết quyền truy cập khi hết hạn; khoá học vĩnh viễn được dùng lâu dài trong thời gian dịch vụ còn hoạt động.',
              'Việc hoàn tiền thực hiện theo Chính sách hoàn tiền.',
            ]} />
            <H2>5. Nội dung do AI tạo ra</H2>
            <p>Một số tính năng (tra từ, hội thoại, chấm phát âm, giải thích) dùng trí tuệ nhân tạo. Nội dung do AI soạn có thể có sai sót hoặc chưa chính xác hoàn toàn. Bạn nên đối chiếu với giáo trình, từ điển và nguồn học chính thống, nhất là khi chuẩn bị cho kỳ thi.</p>
            <H2>6. Giới hạn trách nhiệm</H2>
            <p>Dịch vụ được cung cấp trên cơ sở sẵn có. Chúng tôi không đảm bảo dịch vụ luôn liên tục, không lỗi, cũng không cam kết kết quả thi cụ thể. Trong phạm vi pháp luật cho phép, trách nhiệm của chúng tôi không vượt quá số tiền bạn đã thanh toán cho sản phẩm liên quan.</p>
            <H2>7. Thay đổi điều khoản</H2>
            <p>Chúng tôi có thể cập nhật điều khoản theo thời gian. Phiên bản mới có hiệu lực khi đăng tải trên website; việc tiếp tục sử dụng đồng nghĩa với việc bạn chấp nhận thay đổi.</p>
            <H2>8. Liên hệ</H2>
            <p>Mọi thắc mắc về điều khoản, vui lòng {contact}.</p>
          </div>
        )}

        {page === 'privacy' && (
          <div>
            <H2>1. Dữ liệu chúng tôi thu thập</H2>
            <UL items={[
              'Họ tên, địa chỉ email và tên đăng nhập bạn cung cấp khi đăng ký.',
              'Lịch sử đơn hàng và quyền truy cập đã mua.',
              'Tiến độ học tập và các thiết lập cần thiết để vận hành dịch vụ.',
            ]} />
            <H2>2. Mật khẩu</H2>
            <p>Mật khẩu được băm (hash) trước khi lưu; chúng tôi không lưu mật khẩu dạng bản rõ và không thể xem mật khẩu của bạn.</p>
            <H2>3. Dữ liệu thanh toán</H2>
            <p>Thanh toán do cổng thanh toán xử lý. Hệ thống của chúng tôi không lưu số thẻ hay thông tin xác thực thẻ; chúng tôi chỉ nhận kết quả giao dịch để mở quyền truy cập.</p>
            <H2>4. Tính năng AI</H2>
            <p>Khi dùng các tính năng AI, văn bản hoặc âm thanh bạn gửi lên sẽ được chuyển tới và xử lý bởi Google Gemini để tạo phản hồi. Vui lòng không nhập thông tin nhạy cảm hoặc thông tin cá nhân không cần thiết vào các tính năng này.</p>
            <H2>5. Mục đích sử dụng dữ liệu</H2>
            <UL items={[
              'Cung cấp, vận hành và cải thiện dịch vụ.',
              'Xác thực tài khoản và mở quyền truy cập theo đơn hàng.',
              'Hỗ trợ khách hàng và thông báo về dịch vụ.',
            ]} />
            <p>Chúng tôi không bán dữ liệu cá nhân của bạn cho bên thứ ba.</p>
            <H2>6. Quyền của bạn</H2>
            <p>Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xoá dữ liệu cá nhân của mình. Khi xoá tài khoản, quyền truy cập đã mua sẽ không còn. Một số dữ liệu đơn hàng có thể được giữ lại trong thời hạn pháp luật yêu cầu.</p>
            <H2>7. Liên hệ</H2>
            <p>Để yêu cầu xoá dữ liệu hoặc hỏi về bảo mật, vui lòng {contact}.</p>
          </div>
        )}

        {page === 'refund' && (
          <div>
            <H2>1. Điều kiện hoàn tiền</H2>
            <p>Bạn có thể yêu cầu hoàn tiền trong vòng 7 ngày kể từ thời điểm thanh toán nếu chưa học quá 20% nội dung của khoá học hoặc gói đã mua.</p>
            <div className="my-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>Ghi chú: mốc 7 ngày và ngưỡng 20% nội dung ở trên là nội dung mẫu. Chủ website cần xác nhận hoặc điều chỉnh theo chính sách thực tế và quy định pháp luật trước khi áp dụng.</span>
            </div>
            <H2>2. Ảnh hưởng đến quyền truy cập</H2>
            <p>Khi yêu cầu hoàn tiền được chấp nhận, quyền truy cập vào sản phẩm tương ứng sẽ bị thu hồi.</p>
            <H2>3. Cách yêu cầu hoàn tiền</H2>
            <UL items={[
              'Gửi yêu cầu qua email hỗ trợ từ địa chỉ email đăng ký tài khoản.',
              'Nêu tên đăng nhập, sản phẩm đã mua, thời điểm thanh toán và lý do hoàn tiền.',
              'Chúng tôi sẽ phản hồi và xử lý yêu cầu trong thời gian hợp lý; tiền được hoàn về phương thức thanh toán ban đầu qua cổng thanh toán.',
            ]} />
            <p>Liên hệ: {contact}.</p>
            <H2>4. Trường hợp không hoàn tiền</H2>
            <UL items={[
              'Quá thời hạn hoặc đã học vượt ngưỡng nội dung nêu trên.',
              'Tài khoản vi phạm điều khoản sử dụng, như chia sẻ tài khoản hoặc sao chép nội dung.',
            ]} />
          </div>
        )}
      </div>
    </div>
  );
};
