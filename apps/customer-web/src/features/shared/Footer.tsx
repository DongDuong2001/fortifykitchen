"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faPhone, faEnvelope, faClock, faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import { faFacebook, faInstagram, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

interface FooterProps {
  lang: "vi" | "en";
  setShowPrivacyModal: (show: "privacy" | "terms" | "refund" | "shipping" | null) => void;
}

export default function Footer({ lang, setShowPrivacyModal }: FooterProps) {
  const [facebookUrl, setFacebookUrl] = React.useState("https://facebook.com/fortifykitchen");
  const [instagramUrl, setInstagramUrl] = React.useState("https://instagram.com/fortifykitchen");
  const [hotline, setHotline] = React.useState("090 123 4567");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const fb = localStorage.getItem("settings_facebook");
      const ig = localStorage.getItem("settings_instagram");
      const hl = localStorage.getItem("settings_hotline");
      if (fb) setFacebookUrl(fb);
      if (ig) setInstagramUrl(ig);
      if (hl) setHotline(hl);
    }
  }, []);

  return (
    <footer className="bg-primary/[0.02] border-t border-border/60 py-16 px-6 mt-auto text-xs">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
          {/* Column 1: Brand Intro */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Fortify Kitchen" className="h-9 w-9 rounded-xl object-contain shadow-sm" />
              <span className="font-extrabold tracking-tight font-heading text-base">
                Fortify<span className="font-sans font-light tracking-wide text-primary ml-0.5">Kitchen</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'vi' 
                ? "Dịch vụ cung cấp bữa ăn dinh dưỡng định lượng protein chuẩn xác đầu tiên tại Việt Nam. Đồng hành cùng vóc dáng và sức khỏe của bạn." 
                : "The first nutritional meal provider in Vietnam with precise protein metrics. Your ultimate health and fitness companion."}
            </p>
            <div className="flex gap-3.5 pt-1">
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all duration-200" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebook} className="h-4 w-4" />
              </a>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all duration-200" aria-label="Instagram">
                <FontAwesomeIcon icon={faInstagram} className="h-4 w-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all duration-200" aria-label="Youtube">
                <FontAwesomeIcon icon={faYoutube} className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/80 border-l-2 border-primary pl-2">{lang === 'vi' ? 'Khám phá' : 'Explore'}</h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
              <li><a href="#menu" className="hover:text-primary hover:pl-1 transition-all duration-200">{t("nav_menu", lang)}</a></li>
              <li><a href="#order" className="hover:text-primary hover:pl-1 transition-all duration-200">{t("nav_order", lang)}</a></li>
              <li><a href="#calculator" className="hover:text-primary hover:pl-1 transition-all duration-200">{t("nav_calculator", lang)}</a></li>
              <li><a href="#wallet" className="hover:text-primary hover:pl-1 transition-all duration-200">{t("nav_wallet", lang)}</a></li>
            </ul>
          </div>

          {/* Column 3: Customer Policies */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/80 border-l-2 border-primary pl-2">{lang === 'vi' ? 'Chính sách mua hàng' : 'Policies'}</h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
              <li>
                <button onClick={() => setShowPrivacyModal("shipping")} className="hover:text-primary transition-all duration-200 text-left cursor-pointer bg-transparent border-0 p-0">
                  {lang === 'vi' ? 'Chính sách giao nhận hàng' : 'Shipping & Delivery'}
                </button>
              </li>
              <li>
                <button onClick={() => setShowPrivacyModal("refund")} className="hover:text-primary transition-all duration-200 text-left cursor-pointer bg-transparent border-0 p-0">
                  {lang === 'vi' ? 'Chính sách đổi trả & hoàn tiền' : 'Refund & Returns'}
                </button>
              </li>
              <li>
                <button onClick={() => setShowPrivacyModal("privacy")} className="hover:text-primary transition-all duration-200 text-left cursor-pointer bg-transparent border-0 p-0">
                  {lang === 'vi' ? 'Chính sách bảo mật thông tin' : 'Privacy Policy'}
                </button>
              </li>
              <li>
                <button onClick={() => setShowPrivacyModal("terms")} className="hover:text-primary transition-all duration-200 text-left cursor-pointer bg-transparent border-0 p-0">
                  {lang === 'vi' ? 'Điều khoản và Điều kiện sử dụng' : 'Terms & Conditions'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/80 border-l-2 border-primary pl-2">{lang === 'vi' ? 'Thông tin liên hệ' : 'Contact Us'}</h4>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{lang === 'vi' ? 'TP. Hồ Chí Minh, Việt Nam (Chỉ giao hàng nội thành)' : 'Ho Chi Minh City, Vietnam (Inner city delivery only)'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={faPhone} className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">{hotline}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 text-primary shrink-0" />
                <span>hello@fortifykitchen.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground/80">{lang === 'vi' ? 'Giờ phục vụ:' : 'Hours:'}</p>
                  <p className="text-[11px]">{lang === 'vi' ? 'T2 - T6: 07:00 - 21:00 | T7 - CN: 08:00 - 20:00' : 'Mon - Fri: 07:00 - 21:00 | Sat - Sun: 08:00 - 20:00'}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground">
          <p className="text-[11px] text-center md:text-left">
            &copy; {new Date().getFullYear()} Fortify Kitchen. All rights reserved.
          </p>
          <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/40">
            <FontAwesomeIcon icon={faShieldAlt} className="text-primary h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold text-foreground/70">{lang === 'vi' ? 'Thanh toán trực tuyến bảo mật VietQR' : 'Secure Online Payment with VietQR'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}