"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

interface AuthModalProps {
  lang: "vi" | "en";
  authModal: "login" | "signup" | null;
  setAuthModal: (modal: "login" | "signup" | null) => void;
  login: (email: string, password: string, lang: "vi" | "en") => Promise<{ success: boolean; message?: string }>;
  signup: (data: any, lang: "vi" | "en") => Promise<{ success: boolean; message?: string }>;
}

export default function AuthModal({ lang, authModal, setAuthModal, login, signup }: AuthModalProps) {
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPass, setLoginPass] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);

  const [signupEmail, setSignupEmail] = React.useState("");
  const [signupPass, setSignupPass] = React.useState("");
  const [signupFirst, setSignupFirst] = React.useState("");
  const [signupLast, setSignupLast] = React.useState("");
  const [signupPhone, setSignupPhone] = React.useState("");
  const [signupAddress, setSignupAddress] = React.useState("");
  const [signupAgreeTerms, setSignupAgreeTerms] = React.useState(false);

  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [signupError, setSignupError] = React.useState<string | null>(null);

  // Clear errors and restore remembered credentials on modal open/switch
  React.useEffect(() => {
    setLoginError(null);
    setSignupError(null);
    if (authModal === "login") {
      const savedEmail = localStorage.getItem("fk_remember_email");
      const savedPass = localStorage.getItem("fk_remember_pass");
      if (savedEmail) { setLoginEmail(savedEmail); setRememberMe(true); }
      if (savedPass) { setLoginPass(savedPass); }
    }
  }, [authModal]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const result = await login(loginEmail, loginPass, lang);
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem("fk_remember_email", loginEmail);
        localStorage.setItem("fk_remember_pass", loginPass);
      } else {
        localStorage.removeItem("fk_remember_email");
        localStorage.removeItem("fk_remember_pass");
      }
      setAuthModal(null);
      setLoginEmail("");
      setLoginPass("");
    } else if (result.message) {
      setLoginError(result.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    const result = await signup(
      {
        email: signupEmail,
        password: signupPass,
        firstName: signupFirst,
        lastName: signupLast,
        phone: signupPhone,
        address: signupAddress,
      },
      lang,
    );
    if (result.success) {
      setAuthModal(null);
      setSignupEmail("");
      setSignupPass("");
      setSignupFirst("");
      setSignupLast("");
      setSignupPhone("");
      setSignupAddress("");
    } else if (result.message) {
      setSignupError(result.message);
    }
  };

  if (!authModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-pointer" onClick={() => setAuthModal(null)} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6">
        {/* Close button */}
        <button
          type="button"
          onClick={() => setAuthModal(null)}
          aria-label={lang === "vi" ? "Đóng" : "Close"}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>

        <div className="text-center">
          <h3 className="text-xl font-bold font-heading">
            {authModal === "login" ? t("auth_login_title", lang) : t("auth_register_title", lang)}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5">
            {t("auth_desc", lang)}
          </p>
        </div>

        {authModal === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 leading-relaxed">
                {loginError}
              </p>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_email", lang)}</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_password", lang)}</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
              />
            </div>
            <div className="flex items-center gap-2 select-none py-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer mt-0.5"
              />
              <label htmlFor="rememberMe" className="text-[10px] font-semibold text-muted-foreground cursor-pointer">
                {lang === "vi" ? "Ghi nhớ mật khẩu" : "Remember password"}
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
            >
              {t("btn_submit_login", lang)}
            </button>
            <div className="text-center pt-2">
              <span className="text-[11px] text-muted-foreground">
                {lang === "vi" ? "Chưa có tài khoản? " : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => setAuthModal("signup")}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  {lang === "vi" ? "Đăng ký ngay" : "Register here"}
                </button>
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {signupError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 leading-relaxed">
                {signupError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_first", lang)}</label>
                <input
                  type="text"
                  required
                  placeholder="Jane"
                  value={signupFirst}
                  onChange={(e) => setSignupFirst(e.target.value)}
                  className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_last", lang)}</label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  value={signupLast}
                  onChange={(e) => setSignupLast(e.target.value)}
                  className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_email", lang)}</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_password", lang)}</label>
              <input
                type="password"
                required
                placeholder={lang === "vi" ? "Tối thiểu 6 ký tự" : "Minimum 6 characters"}
                value={signupPass}
                onChange={(e) => setSignupPass(e.target.value)}
                className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_phone", lang)}</label>
              <input
                type="text"
                required
                placeholder={lang === "vi" ? "Ví dụ: 0901234567" : "e.g. 0901234567"}
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_address", lang)}</label>
              <input
                type="text"
                required
                placeholder={lang === "vi" ? "Ví dụ: 123 Đồng Khởi" : "e.g. 123 Dong Khoi St"}
                value={signupAddress}
                onChange={(e) => setSignupAddress(e.target.value)}
                className="w-full bg-input border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none text-foreground"
              />
            </div>

            <label className="flex items-start gap-2 text-[10px] text-muted-foreground select-none cursor-pointer py-1 leading-normal">
              <input
                type="checkbox"
                required
                checked={signupAgreeTerms}
                onChange={(e) => setSignupAgreeTerms(e.target.checked)}
                className="mt-0.5"
              />
              <span>{t("btn_submit_register", lang)}</span>
            </label>

            <button
              type="submit"
              disabled={!signupAgreeTerms}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 disabled:opacity-50"
            >
              {t("btn_submit_register", lang)}
            </button>
            <div className="text-center pt-2">
              <span className="text-[11px] text-muted-foreground">
                {lang === "vi" ? "Đã có tài khoản? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setAuthModal("login")}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  {lang === "vi" ? "Đăng nhập" : "Login"}
                </button>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}