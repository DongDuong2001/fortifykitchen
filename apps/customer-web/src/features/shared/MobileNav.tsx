"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faUtensils, faCalculator, faWallet, faUser } from "@fortawesome/free-solid-svg-icons";
import { DICTIONARY } from "@/constants/dictionary";

type Dictionary = typeof DICTIONARY.vi;

const t = (key: keyof Dictionary, lang: "vi" | "en") => (DICTIONARY[lang] as Dictionary)[key] || DICTIONARY.vi[key] || key;

interface MobileNavProps {
  lang: "vi" | "en";
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  setAuthModal: (modal: "login" | "signup" | null) => void;
}

export default function MobileNav({ lang, activeTab, setActiveTab, user, setAuthModal }: MobileNavProps) {
  const tabs = [
    { id: "home", icon: faHouse, label: t("nav_home", lang) },
    { id: "menu", icon: faUtensils, label: t("nav_menu", lang) },
    { id: "calculator", icon: faCalculator, label: t("nav_calculator", lang) },
    { id: "wallet", icon: faWallet, label: t("nav_wallet", lang) },
  ];

  if (user) {
    tabs.push({ id: "dashboard", icon: faUser, label: t("nav_dashboard", lang) });
  } else {
    tabs.push({ id: "profile-login", icon: faUser, label: lang === "vi" ? "Tài khoản" : "Account" });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom">
      <div className="grid grid-cols-5 gap-1 px-2 py-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === "profile-login") {
                setAuthModal("login");
              } else {
                setActiveTab(tab.id);
              }
            }}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <FontAwesomeIcon icon={tab.icon} className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}