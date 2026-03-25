import { Outlet } from "react-router-dom";
import { BottomNavigation } from "./BottomNavigation.jsx";
import { ScrollToTop } from "./ScrollToTop.jsx";
export function Layout() {
  return (
    <div className="min-h-screen bg-gray-100 px-3 py-4 transition-colors dark:bg-slate-950 flex justify-center">
      <div className="w-full max-w-[390px] bg-white relative overflow-hidden rounded-[32px] pb-20 shadow-[0_18px_70px_rgba(15,23,42,0.12)] transition-colors dark:bg-slate-900 dark:shadow-[0_18px_70px_rgba(2,6,23,0.55)]">
        <ScrollToTop />
        <Outlet />
        <BottomNavigation />
      </div>
    </div>
  );
}

