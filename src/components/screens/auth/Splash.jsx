import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../store/auth-store";
import { useUserStore } from "../../../../store/user-store";
import { syncUserToBackend } from "../../../../api/user-api";
import { getAuthCodeAsync, splashLoginAsync } from "./query";

function getUserProfileFromResponse(response) {
  const result = response?.result || {};
  const userId = (result?.userId || result?.user_id || result?.id || "").trim();
  const fullName = (
    result?.fullName ||
    result?.fullname ||
    result?.full_name ||
    result?.name ||
    ""
  ).trim();
  const msisdn = (
    result?.msisdn ||
    result?.phone ||
    result?.mobile ||
    ""
  ).trim();

  return {
    userId,
    fullName,
    msisdn,
    openid: result?.openid || null,
    points: 0,
    isActive: 1,
    splashResponse: response || null,
  };
}

export function Splash() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const [message, setMessage] = useState("Preparing your experience...");
  const [errorMessage, setErrorMessage] = useState("");
  const startedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        setMessage("Getting authorization...");
        const authCode = await getAuthCodeAsync();

        setMessage("Signing you in...");
        const response = await splashLoginAsync(authCode);
        const userProfile = getUserProfileFromResponse(response);

        if (
          !userProfile.userId ||
          !userProfile.fullName ||
          !userProfile.msisdn
        ) {
          throw new Error(
            "Missing required user fields in splash login response",
          );
        }

        if (!cancelled) {
          setUserProfile(userProfile);
        }

        setMessage("Syncing your profile...");
        console.log("User profile from splash response:", userProfile);
        await syncUserToBackend({
          userId: userProfile.userId,
          fullName: userProfile.fullName,
          msisdn: userProfile.msisdn,
          points: userProfile.points,
          isActive: userProfile.isActive,
        });

        if (!cancelled) {
          setMessage("Welcome to SwiftFix");
          timerRef.current = window.setTimeout(
            () => navigate("/", { replace: true }),
            700,
          );
        }
      } catch (error) {
        console.error("Splash initialization failed:", error);
        if (!cancelled) {
          setErrorMessage("Unable to initialize the app. Please try again.");
          setMessage("Profile setup failed.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [navigate, setAccessToken, setUserProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 px-6 py-10 text-white dark:from-slate-900 dark:via-slate-800 dark:to-blue-950">
      <div className="mx-auto flex h-full w-full max-w-[390px] flex-col rounded-[28px] border border-white/20 bg-white/10 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.35)] backdrop-blur-sm">
        <div className="mt-8 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl font-semibold">
            S
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-blue-100/90">
              SwiftFix
            </p>
            <h1 className="text-2xl font-semibold leading-tight">
              Service at your doorstep
            </h1>
          </div>
        </div>

        <div className="mt-16 space-y-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-white" />
          </div>
          <p className="text-sm text-blue-50/95">{message}</p>
          {errorMessage && (
            <p className="text-sm text-red-200">{errorMessage}</p>
          )}
        </div>

        <div className="mt-auto rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-blue-100">
          Finding trusted technicians near you.
        </div>
      </div>
    </div>
  );
}
