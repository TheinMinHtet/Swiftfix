import { Home, Package, LayoutGrid, Award } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useI18n } from "../utils/i18n.js";

export function BottomNavigation() {
  const location = useLocation();
  const { language, t } = useI18n();

  const navItems = [
    { path: "/", icon: Home, label: t("nav.home") },
    { path: "/services", icon: LayoutGrid, label: t("nav.services") },
    { path: "/orders", icon: Package, label: t("nav.orders") },
    { path: "/points", icon: Award, label: t("nav.points") },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 border-t border-gray-200 bg-white px-4 py-3 transition-colors dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 transition-colors"
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-blue-600" : "text-gray-500 dark:text-slate-400"
                }`}
              />
              <span
                className={`w-full overflow-hidden text-ellipsis whitespace-nowrap text-center ${language === "my" ? "text-[10px] leading-tight" : "text-xs"} ${
                  isActive
                    ? "font-medium text-blue-600"
                    : "text-gray-500 dark:text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
