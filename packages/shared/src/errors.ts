// Small, curated translation layer for backend error messages shown
// directly to a customer. The API's exception messages
// (NestJS BadRequestException/UnauthorizedException/ConflictException/etc.)
// are English-only by convention — this maps the ones the frontends
// actually surface to natural Vietnamese, and falls back to a clean,
// localized generic message for anything unrecognized rather than ever
// showing raw English text to a Vietnamese-speaking customer (Vietnamese
// is the primary customer language — see the business brief in CLAUDE.md).
//
// English-speaking users see the raw backend message as-is (no locale
// mismatch for them), so this only changes behavior when lang === "vi".
const KNOWN_ERROR_TRANSLATIONS: { match: RegExp; vi: string }[] = [
  {
    match: /wallet balance is insufficient to cover this subscription/i,
    vi: "Số dư Ví của bạn không đủ để thanh toán trọn gói đăng ký này. Vui lòng nạp thêm vào ví rồi thử lại.",
  },
  { match: /wallet balance is insufficient/i, vi: "Số dư Ví của bạn không đủ để thanh toán khoản này." },
  { match: /invalid email or password/i, vi: "Email hoặc mật khẩu không đúng." },
  { match: /email already registered/i, vi: "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác." },
  { match: /no customer profile found/i, vi: "Không tìm thấy hồ sơ khách hàng cho tài khoản này." },
  { match: /already paid/i, vi: "Gói này đã được thanh toán rồi." },
  { match: /no linked customer to charge/i, vi: "Gói này chưa được gắn với khách hàng nào." },
  { match: /stock .* changed before/i, vi: "Một món trong đơn đã hết hàng ngay lúc bạn đặt — vui lòng thử lại." },
  { match: /subscription plan .* not found/i, vi: "Gói trả trước này hiện không khả dụng." },
  { match: /discount code ".*" not found/i, vi: "Không tìm thấy mã giảm giá này." },
  { match: /discount code ".*" is no longer active/i, vi: "Mã giảm giá này không còn hiệu lực." },
  { match: /discount code ".*" is not valid at this time/i, vi: "Mã giảm giá này chưa hoặc đã hết hạn sử dụng." },
  { match: /discount code ".*" is not valid for your account/i, vi: "Mã giảm giá này không áp dụng cho tài khoản của bạn." },
  { match: /discount code ".*" has already been used/i, vi: "Bạn đã sử dụng mã giảm giá này rồi." },
  { match: /discount code ".*" has reached its usage limit/i, vi: "Mã giảm giá này đã hết lượt sử dụng." },
  {
    match: /you already have an active plan discount/i,
    vi: "Bạn đang có ưu đãi từ gói hiện tại. Vào tab Ví để gửi yêu cầu nâng cấp gói, đội ngũ chúng tôi sẽ xem xét.",
  },
  {
    match: /you already have a pending plan upgrade request/i,
    vi: "Bạn đã có một yêu cầu nâng cấp gói đang chờ duyệt. Vui lòng đợi đội ngũ Fortify Kitchen xem xét.",
  },
];

export function translateApiError(rawMessage: string | string[] | undefined, lang: "vi" | "en", fallback: string): string {
  const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
  if (lang === "en") {
    return message || fallback;
  }
  if (message) {
    const known = KNOWN_ERROR_TRANSLATIONS.find((k) => k.match.test(message));
    if (known) return known.vi;
  }
  return fallback;
}
