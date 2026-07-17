"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faShieldAlt, faFileContract, faTruck, faUndo } from "@fortawesome/free-solid-svg-icons";

interface PrivacyModalProps {
  lang: "vi" | "en";
  showPrivacyModal: "privacy" | "terms" | "refund" | "shipping" | null;
  setShowPrivacyModal: (show: "privacy" | "terms" | "refund" | "shipping" | null) => void;
}

export default function PrivacyModal({ lang, showPrivacyModal, setShowPrivacyModal }: PrivacyModalProps) {
  const [activeTab, setActiveTab] = React.useState<"privacy" | "terms" | "refund" | "shipping">("privacy");

  React.useEffect(() => {
    if (showPrivacyModal) {
      setActiveTab(showPrivacyModal);
    }
  }, [showPrivacyModal]);

  if (!showPrivacyModal) return null;

  const tabs = [
    { id: "shipping", label: lang === "vi" ? "Giao hàng" : "Delivery", icon: faTruck },
    { id: "refund", label: lang === "vi" ? "Đổi trả & Hoàn tiền" : "Refunds", icon: faUndo },
    { id: "privacy", label: lang === "vi" ? "Bảo mật" : "Privacy", icon: faShieldAlt },
    { id: "terms", label: lang === "vi" ? "Điều khoản" : "Terms", icon: faFileContract },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 cursor-pointer" onClick={() => setShowPrivacyModal(null)} />
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 shrink-0">
          <div>
            <h3 className="text-xl font-extrabold font-heading text-foreground">
              {lang === "vi" ? "Chính sách mua hàng & Dịch vụ" : "Customer & Service Policies"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === "vi" ? "Cập nhật lần cuối: 17/07/2026" : "Last updated: July 17, 2026"}
            </p>
          </div>
          <button onClick={() => setShowPrivacyModal(null)} className="text-muted-foreground hover:text-foreground p-1 transition-colors hover:bg-muted rounded-full cursor-pointer">
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs navigation */}
        <div className="flex border-b border-border/60 mb-6 overflow-x-auto gap-2 shrink-0 pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-6 text-xs text-muted-foreground leading-relaxed pr-1">
          {activeTab === "shipping" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <FontAwesomeIcon icon={faTruck} className="text-primary h-4 w-4" />
                  {lang === "vi" ? "1. Khu vực giao nhận hàng" : "1. Delivery Coverage"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Fortify Kitchen hiện tại chỉ cung cấp dịch vụ giao bữa ăn trong khu vực nội thành Thành Phố Hồ Chí Minh. Các khu vực ngoại thành xa vui lòng liên hệ hotline trước khi đặt gói để bếp sắp xếp lộ trình."
                    : "Fortify Kitchen currently offers meal delivery services exclusively within the inner districts of Ho Chi Minh City. For remote suburban areas, please contact our hotline before ordering."}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground">
                  {lang === "vi" ? "2. Khung giờ giao hàng cố định" : "2. Scheduled Delivery Hours"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Để đảm bảo món ăn nóng sốt và chuẩn bị đúng tiến độ dinh dưỡng, chúng tôi hỗ trợ các khung giờ giao:"
                    : "To ensure warm meals and timely nutritional scheduling, we deliver during the following slots:"}
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>{lang === "vi" ? "Khung giờ Sáng:" : "Morning Slot:"}</strong> 07:30 - 11:30 (Thích hợp cho bữa trưa)</li>
                  <li><strong>{lang === "vi" ? "Khung giờ Chiều:" : "Afternoon Slot:"}</strong> 13:30 - 17:30 (Thích hợp cho bữa tối)</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground">
                  {lang === "vi" ? "3. Phí vận chuyển & Giao nhận gián tiếp" : "3. Shipping Fees & Delivery Process"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Phí giao nhận đồng giá áp dụng toàn TP.HCM là 15,000đ cho mỗi lần giao. Nếu quý khách vắng mặt tại thời điểm giao hàng, tài xế sẽ hỗ trợ gửi lại món ăn tại phòng bảo vệ, quầy lễ tân hoặc tủ đồ của tòa nhà theo yêu cầu của quý khách để đảm bảo chất lượng bảo quản tốt nhất."
                    : "A flat rate of 15,000 VND applies to all deliveries within HCMC. If you are unavailable, our courier can drop the meal box at the reception, security desk, or delivery locker upon request."}
                </p>
              </section>
            </div>
          )}

          {activeTab === "refund" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <FontAwesomeIcon icon={faUndo} className="text-primary h-4 w-4" />
                  {lang === "vi" ? "1. Trường hợp áp dụng khiếu nại" : "1. Eligible Compensation Claims"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Fortify Kitchen cam kết đền bù hoặc hoàn tiền 100% giá trị món ăn trong các trường hợp sau do lỗi của chúng tôi:"
                    : "Fortify Kitchen commits to a 100% refund or replacement for the following kitchen-related errors:"}
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Món ăn bị hư hỏng, ôi thiu trong quá trình vận chuyển bảo quản ban đầu.</li>
                  <li>Giao sai món, thiếu định lượng protein so với cam kết trên đơn hàng.</li>
                  <li>Có dị vật lạ trong thức ăn.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground">
                  {lang === "vi" ? "2. Thời gian và Quy trình khiếu nại" : "2. Time Limits & Procedure"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Quý khách vui lòng kiểm tra món ăn ngay sau khi nhận hàng và phản hồi khiếu nại trong vòng tối đa 2 giờ kể từ thời điểm nhận món ăn, đính kèm hình ảnh hoặc video thực tế gửi qua Zalo/Facebook Fanpage của chúng tôi để được hỗ trợ kiểm tra và xử lý lập tức."
                    : "Please inspect your meal immediately and file a claim within 2 hours of delivery. Submit clear photos/videos to our Zalo/Facebook support channel for immediate processing."}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground">
                  {lang === "vi" ? "3. Phương thức hoàn trả" : "3. Refund Methods"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Chúng tôi hỗ trợ hoàn trả số dư trực tiếp vào Ví điện tử của quý khách trên website để sử dụng cho lần sau, hoặc sắp xếp giao bù phần ăn tương đương hoàn toàn miễn phí vào ngày hoạt động kế tiếp."
                    : "Approved refunds will be credited back to your online Wallet balance, or we will schedule a free replacement meal box on the next delivery day."}
                </p>
              </section>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <FontAwesomeIcon icon={faShieldAlt} className="text-primary h-4 w-4" />
                  {lang === "vi" ? "1. Thu thập thông tin cá nhân" : "1. Information Collection"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Chúng tôi thu thập các thông tin cá nhân cần thiết khi bạn tạo tài khoản, bao gồm: Họ tên, số điện thoại, địa chỉ nhận hàng, địa chỉ email và thông tin lịch sử giao dịch. Thông tin thanh toán trực tuyến qua VietQR được xử lý bảo mật hoàn toàn bởi hệ thống ngân hàng liên kết."
                    : "We collect necessary personal info upon account creation: Name, phone number, shipping address, email, and transaction logs. Secure VietQR bank transfers are processed directly via banking partner gateways."}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground">
                  {lang === "vi" ? "2. Mục đích sử dụng dữ liệu" : "2. Data Usage Purpose"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Dữ liệu cá nhân chỉ được sử dụng để điều phối tài xế giao bữa ăn định kỳ, lưu trữ cài đặt tính toán lượng Kcal/Protein cá nhân của bạn, thông báo tình trạng tài khoản và bảo lưu quyền lợi số dư ví hội viên."
                    : "Your personal details are strictly used to schedule delivery routes, save your body metric calculator configurations, notify account statuses, and secure your wallet balance."}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground">
                  {lang === "vi" ? "3. Cam kết bảo mật dữ liệu" : "3. Privacy Guarantee"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Fortify Kitchen cam kết bảo mật tuyệt đối thông tin khách hàng bằng các phương thức mã hóa lưu trữ hiện đại. Chúng tôi tuyệt đối không mua bán, trao đổi hoặc cung cấp thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào nằm ngoài luồng vận chuyển giao hàng."
                    : "Fortify Kitchen guarantees total security using modern database encryption. We never trade, share, or sell your personal credentials to third-party advertising companies."}
                </p>
              </section>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileContract} className="text-primary h-4 w-4" />
                  {lang === "vi" ? "1. Điều khoản hoạt động của Ví & Gói Hội viên" : "1. Wallet & Subscription Membership Rules"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Hạn mức trong Ví điện tử được quy đổi khi bạn mua các gói ưu đãi lớn. Số dư này không có giá trị rút ngược lại thành tiền mặt và chỉ được sử dụng để đặt các bữa ăn hoặc đăng ký gói ăn trực tiếp trên hệ thống Fortify Kitchen."
                    : "Wallet credit is topped up when you purchase bundle plans. These funds are non-cashable and non-transferable, and can only be used to pay for meals inside Fortify Kitchen."}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground">
                  {lang === "vi" ? "2. Quy định dời lịch/Hoãn lịch giao" : "2. Delivery Rescheduling & Pausing"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Đối với các khách hàng đang sử dụng gói ăn định kỳ (Subscription): Quý khách muốn hoãn lịch giao hoặc dời ngày ăn của buổi hôm sau vui lòng thực hiện hoặc báo cho chúng tôi trước 22:00 ngày hôm trước. Sau khung giờ này, bếp đã tiến hành nhập nguyên liệu sơ chế nên đơn hàng của ngày kế tiếp không thể hủy bỏ và vẫn được tính là đã giao."
                    : "For active subscription package holders: If you wish to postpone or reschedule next day's meal, please notify us before 22:00 of the previous night. Beyond this limit, raw ingredients are already prepared, and the delivery cannot be cancelled."}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-sm text-foreground">
                  {lang === "vi" ? "3. Trách nhiệm sử dụng tài khoản" : "3. User Account Responsibility"}
                </h4>
                <p>
                  {lang === "vi"
                    ? "Quý khách có trách nhiệm tự bảo mật thông tin mật khẩu đăng nhập cá nhân. Mọi giao dịch trừ tiền ví phát sinh do thông tin tài khoản bị tiết lộ nằm ngoài tầm kiểm soát của hệ thống, chúng tôi sẽ không chịu trách nhiệm bồi hoàn."
                    : "You are solely responsible for keeping your login credentials confidential. We will not be liable for any unauthorized wallet usage resulting from compromised passwords."}
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}