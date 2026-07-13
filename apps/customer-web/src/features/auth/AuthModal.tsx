"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

interface AuthModalProps {
  lang: "vi" | "en";
  authModal: "login" | "signup" | null;
  setAuthModal: (modal: "login" | "signup" | null) => void;
  login: (email: string, password: string, lang: "vi" | "en") => Promise<boolean>;
  signup: (data: any, lang: "vi" | "en") => Promise<boolean>;
}

export default function AuthModal({ lang, authModal, setAuthModal, login, signup }: AuthModalProps) {
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPass, setLoginPass] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showLoginPass, setShowLoginPass] = React.useState(false);

  const [signupEmail, setSignupEmail] = React.useState("");
  const [signupPass, setSignupPass] = React.useState("");
  const [signupFirst, setSignupFirst] = React.useState("");
  const [signupLast, setSignupLast] = React.useState("");
  const [signupPhone, setSignupPhone] = React.useState("");
  const [signupAddress, setSignupAddress] = React.useState("");
  const [signupAgreeTerms, setSignupAgreeTerms] = React.useState(false);
  const [showSignupPass, setShowSignupPass] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginEmail, loginPass, lang);
    if (success) {
      if (rememberMe) { localStorage.setItem("fk_remember_email", loginEmail); localStorage.setItem("fk_remember_pass", loginPass); }
      else { localStorage.removeItem("fk_remember_email"); localStorage.removeItem("fk_remember_pass"); }
      setAuthModal(null); setLoginEmail(""); setLoginPass("");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signup({ email: signupEmail, password: signupPass, firstName: signupFirst, lastName: signupLast, phone: signupPhone, address: signupAddress, city: "Ho Chi Minh City", postalCode: "70000" }, lang);
    if (success) { setAuthModal(null); setSignupEmail(""); setSignupPass(""); setSignupFirst(""); setSignupLast(""); setSignupPhone(""); setSignupAddress(""); }
  };

  React.useEffect(() => {
    if (authModal === "login") {
      const savedEmail = localStorage.getItem("fk_remember_email");
      const savedPass = localStorage.getItem("fk_remember_pass");
      if (savedEmail) { setLoginEmail(savedEmail); setRememberMe(true); }
      if (savedPass) { setLoginPass(savedPass); }
    }
  }, [authModal]);

  if (!authModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-pointer" onClick={() => setAuthModal(null)} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 z-10 space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-bold font-heading">{authModal === "login" ? t("auth_login_title", lang) : t("auth_register_title", lang)}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t("auth_desc", lang)}</p>
          <p className="text-[10px] text-primary mt-2">{t("auth_coupon_hint", lang)}</p>
        </div>

        {authModal === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_email", lang)}</label><div className="relative"><FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="email" required placeholder={t("auth_email", lang)} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full pl-10 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" /></div></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_password", lang)}</label><div className="relative"><FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type={showLoginPass ? "text" : "password"} required placeholder={t("auth_password", lang)} value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full pl-10 pr-10 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" /><button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><FontAwesomeIcon icon={showLoginPass ? faEyeSlash : faEye} className="h-4 w-4" /></button></div></div>
            <div className="flex items-center justify-between"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary" /><span className="text-xs text-muted-foreground">{t("filter_all", lang)}</span></label></div>
            <button type="submit" className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"><FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />{t("btn_submit_login", lang)}</button>
            <p className="text-xs text-muted-foreground text-center">{t("auth_toggle_to_register", lang)} <button onClick={() => setAuthModal("signup")} className="text-primary hover:underline font-semibold">{t("filter_all", lang)}</button></p>
          </form>
        )}

        {authModal === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_first", lang)}</label><input type="text" required placeholder={t("auth_first", lang)} value={signupFirst} onChange={(e) => setSignupFirst(e.target.value)} className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_last", lang)}</label><input type="text" required placeholder={t("auth_last", lang)} value={signupLast} onChange={(e) => setSignupLast(e.target.value)} className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" /></div></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_email", lang)}</label><div className="relative"><FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="email" required placeholder={t("auth_email", lang)} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full pl-10 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" /></div></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_password", lang)}</label><div className="relative"><FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type={showSignupPass ? "text" : "password"} required placeholder={t("auth_password", lang)} value={signupPass} onChange={(e) => setSignupPass(e.target.value)} className="w-full pl-10 pr-10 bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" /><button type="button" onClick={() => setShowSignupPass(!showSignupPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><FontAwesomeIcon icon={showSignupPass ? faEyeSlash : faEye} className="h-4 w-4" /></button></div></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_phone", lang)}</label><input type="tel" required placeholder={t("auth_phone", lang)} value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" /></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("auth_address", lang)}</label><input type="text" placeholder={t("auth_address", lang)} value={signupAddress} onChange={(e) => setSignupAddress(e.target.value)} className="w-full bg-background border border-border focus:border-primary text-xs py-2.5 px-3 rounded-lg outline-none" /></div>
            <div className="flex items-start gap-2"><input type="checkbox" id="signupAgreeTerms" required checked={signupAgreeTerms} onChange={(e) => setSignupAgreeTerms(e.target.checked)} className="mt-1 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary" /><label htmlFor="signupAgreeTerms" className="text-xs text-muted-foreground cursor-pointer">{t("btn_submit_register", lang)}</label></div>
            <button type="submit" className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"><FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />{t("btn_submit_register", lang)}</button>
            <p className="text-xs text-muted-foreground text-center">{t("auth_toggle_to_login", lang)} <button onClick={() => setAuthModal("login")} className="text-primary hover:underline font-semibold">{t("filter_all", lang)}</button></p>
          </form>
        )}
      </div>
    </div>
  );
}