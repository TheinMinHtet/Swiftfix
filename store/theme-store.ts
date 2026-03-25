import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

type ThemeStore = {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
};

const getInitialTheme = (): ThemeMode => {
    if (typeof window === "undefined") return "light";

    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
};

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: getInitialTheme(),
            setTheme: (theme) => set({ theme }),
            toggleTheme: () =>
                set((state) => ({
                    theme: state.theme === "dark" ? "light" : "dark",
                })),
        }),
        {
            name: "theme-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
