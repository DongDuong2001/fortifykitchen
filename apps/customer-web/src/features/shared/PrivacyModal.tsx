"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";


interface PrivacyModalProps {
  lang: "vi" | "en";
  showPrivacyModal: boolean;
  setShowPrivacyModal: (show: boolean) => void;
}

export default function PrivacyModal({ lang, showPrivacyModal, setShowPrivacyModal }: PrivacyModalProps) {
  if (!showPrivacyModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 cursor-pointer" onClick={() => setShowPrivacyModal(false)} />
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold font-heading">
              {lang === "vi" ? "Chính sách & Điều khoản" : "Terms & Privacy Policy"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === "vi" ? "Cập nhật lần cuối: 15/07/2026" : "Last updated: July 15, 2026"}
            </p>
          </div>
          <button onClick={() => setShowPrivacyModal(false)} className="text-muted-foreground hover:text-foreground p-1">
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 text-xs text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h4 className="font-bold text-foreground">
              {lang === "vi" ? "1. Thu thập thông tin" : "1. Information Collection"}
            </h4>
            <p>
              {lang === "vi"
                ? "Chúng tôi thu thập thông tin cá nhân khi bạn đăng ký tài khoản, sử dụng dịch vụ nạp ví, giao dịch mua hàng định kỳ hoặc nhanh. Thông tin bao gồm họ tên, số điện thoại, địa chỉ giao hàng và thông tin thanh toán."
                : "We collect personal information when you register an account, top up your wallet, or order meals. This includes your name, phone number, delivery address, and payment details."}
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-foreground">
              {lang === "vi" ? "2. Sử dụng thông tin" : "2. Use of Information"}
            </h4>
            <p>
              {lang === "vi"
                ? "Thông tin thu thập được dùng để xử lý đơn hàng, điều phối giao nhận món ăn theo kế hoạch dinh dưỡng của bạn, và gửi thông báo nhắc nhở khi ví protein sắp hết hạn mức."
                : "Collected data is used to process your orders, schedule deliveries for your subscription plans, and send low-balance alerts for your protein wallet."}
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-foreground">
              {lang === "vi" ? "3. Quyền lợi và Bảo mật" : "3. Safety & Privacy"}
            </h4>
            <p>
              {lang === "vi"
                ? "Dữ liệu được lưu giữ an toàn, bảo mật trên hệ thống máy chủ, tuyệt đối không chia sẻ với bất kỳ bên thứ ba nào ngoại trừ các đối tác vận chuyển phục vụ đơn hàng."
                : "Your data is secured on our database server. We never sell or share your personal details with third parties except for shipping courier partners."}
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-foreground">
              {lang === "vi" ? "4. Điều khoản sử dụng ví và gói định kỳ" : "4. Wallet & Subscriptions Terms"}
            </h4>
            <p>
              {lang === "vi"
                ? "Số dư trong ví được mua qua các gói Hội viên và có mức chiết khấu quy đổi tương ứng. Hạn mức trong ví không có giá trị quy đổi ngược lại thành tiền mặt và chỉ sử dụng cho các dịch vụ ăn uống tại Fortify Kitchen."
                : "Wallet balances acquired through plans receive proportional discounts. Credits are non-refundable for cash and can only be redeemed for catering items inside Fortify Kitchen."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}