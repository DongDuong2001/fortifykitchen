'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faSignOutAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface NavGroup {
  id: string;
  label: string;
  icon: IconDefinition;
  defaultSection: string;
}

interface Props {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeGroup: string;
  setActiveGroup: (g: any) => void;
  setSection: (s: any) => void;
  handleLogout: () => void;
  setShowPrivacyModal: (v: boolean) => void;
  user: any;
  NAVIGATION_GROUPS: NavGroup[];
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeGroup,
  setActiveGroup,
  setSection,
  handleLogout,
  setShowPrivacyModal,
  user,
  NAVIGATION_GROUPS,
}: Props) {
  if (!sidebarOpen) return null;
  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={() => setSidebarOpen(false)}
      />
      <aside className="fixed inset-y-0 left-0 z-50 w-64 md:relative md:flex md:w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Fortify Kitchen" className="h-8 w-8 rounded-md object-contain" />
            <span className="font-semibold tracking-tight font-heading text-sm">Fortify Console</span>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 text-xs font-semibold">
          {NAVIGATION_GROUPS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveGroup(item.id as any);
                setSection(item.defaultSection as any);
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full text-left py-2.5 px-3.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeGroup === item.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto hidden md:block space-y-2.5">
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="w-full text-left text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faInfoCircle} className="h-3.5 w-3.5 shrink-0" />
            Privacy & Operating Terms
          </button>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span className="truncate max-w-[120px] font-semibold">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
              title="Logout"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
