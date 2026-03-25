import { useLanguageStore } from "../../store/language-store";

export function LanguageToggle() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  return (
    <div className="inline-flex items-center rounded-full border border-white/35 bg-white/18 p-1 text-white shadow-sm backdrop-blur transition-colors dark:border-slate-600 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
          language === "en"
            ? "bg-white text-blue-700"
            : "text-white/85 hover:bg-white/10"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("my")}
        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
          language === "my"
            ? "bg-white text-blue-700"
            : "text-white/85 hover:bg-white/10"
        }`}
      >
        မြန်မာ
      </button>
    </div>
  );
}
