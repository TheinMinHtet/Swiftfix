import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../store/theme-store";
import { useI18n } from "../utils/i18n.js";

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
      className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/18 px-3 pt-[9px] pb-[7px] text-xs font-medium leading-none text-white shadow-sm backdrop-blur transition-colors hover:bg-white/24 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="leading-none">{isDark ? t("theme.lightMode") : t("theme.darkMode")}</span>
    </button>
  );
}
