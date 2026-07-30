"use client";

import * as React from "react";
import { Home, ForkKnife, Calculator, Wallet, User } from "reicon-react";
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
    { id: "home", icon: Home, label: t("nav_home", lang) },
    { id: "menu", icon: ForkKnife, label: t("nav_menu", lang) },
    { id: "calculator", icon: Calculator, label: t("nav_calculator", lang) },
    { id: "wallet", icon: Wallet, label: t("nav_wallet", lang) },
  ];

  if (user) {
    tabs.push({ id: "dashboard", icon: User, label: t("nav_dashboard", lang) });
  } else {
    tabs.push({ id: "profile-login", icon: User, label: lang === "vi" ? "Tài khoản" : "Account" });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom">
      <div className="grid grid-cols-5 gap-1 px-2 py-1.5">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
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
              <IconComponent className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}