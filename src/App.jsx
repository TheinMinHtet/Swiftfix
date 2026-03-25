import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { useThemeStore } from "../store/theme-store";
import { useLanguageStore } from "../store/language-store";
import { router } from "./routes.jsx";

function App() {
  const theme = useThemeStore((state) => state.theme);
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language === "my" ? "my" : "en";
    root.setAttribute("data-lang", language);
  }, [language]);

  return <RouterProvider router={router} />;
}

export default App;
