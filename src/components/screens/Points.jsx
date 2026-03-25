import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  BadgePercent,
  ReceiptText,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getUsers } from "../../../api/user-api";
import { useI18n } from "../../utils/i18n.js";

// Updated with a 50-point entry tier for better feasibility
const pointDiscountRules = [
  { points: 50, discount: "1,000 Ks" },
  { points: 100, discount: "3,000 Ks" },
  { points: 250, discount: "8,000 Ks" },
  { points: 500, discount: "18,000 Ks" },
  { points: 1000, discount: "40,000 Ks" },
];

export function Points() {
  const { t, localizeDigits } = useI18n();
  const [currentPoints, setCurrentPoints] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadUserPoints = async () => {
      try {
        const users = await getUsers("USR-1001");
        const user = users?.[0];
        const points = user?.Mini_Shin__points__CST ?? user?.points ?? 0;
        if (isMounted) setCurrentPoints(points);
      } catch (error) {
        console.error("Failed to load user points:", error);
        if (isMounted) setCurrentPoints(0);
      }
    };

    loadUserPoints();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 transition-colors dark:bg-slate-900">
      <div className="bg-blue-600 px-5 pt-12 pb-8 rounded-b-3xl dark:bg-blue-950">
        <div className="flex items-center gap-3 mb-5">
          <Link
            to="/"
            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors dark:bg-blue-900 dark:hover:bg-blue-800"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <p className="text-blue-100 text-sm">{t("points.rewards")}</p>
            <h1 className="text-white text-2xl">{t("points.title")}</h1>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-yellow-900 text-xs font-medium">
                  {t("points.currentPoints")}
                </p>
                <p className="text-yellow-900 font-semibold text-lg">
                  {localizeDigits(currentPoints)} pts
                </p>
              </div>
            </div>
            <div className="bg-white/80 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full">
              {t("points.active")}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Point to Discount Table */}
        <div className="rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <div className="flex items-center gap-2 mb-4">
            <BadgePercent className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
              {t("points.pointToDiscount")}
            </h2>
          </div>

          <div className="space-y-3">
            {pointDiscountRules.map((rule) => (
              <div
                key={rule.points}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-slate-700/70"
              >
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  {t("points.points", { count: rule.points })}
                </p>
                <p className="text-sm font-semibold text-blue-700">
                  {t("points.discount", { amount: rule.discount })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Updated Transparency Rule: 1,000 Ks = 1 Point */}
        <div className="rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <div className="flex items-center gap-2 mb-3">
            <ReceiptText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{t("points.declaration")}</h2>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              <span className="font-semibold">{t("points.transparencyRule")}</span>{" "}
              {t("points.transparencyBody")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm transition-colors dark:bg-slate-800 dark:shadow-slate-950/30">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
              {t("points.howItWorks")}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            {t("points.howItWorksBody")}
          </p>
        </div>
      </div>
    </div>
  );
}
