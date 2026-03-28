import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserProfile = {
    userId: string | null;
    fullname: string | null;
    msisdn: string | null;
    points: number;
    isActive: number;
    openid: string | null;
    splashResponse: any | null;
};

type UserStore = {
    profile: UserProfile;
    setUserProfile: (profile: Partial<UserProfile>) => void;
    clearUserProfile: () => void;
};

export const defaultUserProfile: UserProfile = {
    userId: null,
    fullname: null,
    msisdn: null,
    points: 0,
    isActive: 1,
    openid: null,
    splashResponse: null,
};

export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            profile: defaultUserProfile,
            setUserProfile: (profile) =>
                set((state) => ({
                    profile: {
                        ...state.profile,
                        ...profile,
                    },
                })),
            clearUserProfile: () => set({ profile: defaultUserProfile }),
        }),
        {
            name: "user-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
