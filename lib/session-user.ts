export const SESSION_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  slug: true,
  avatarUrl: true,
  isVerified: true,
  isAdmin: true,
  favoritePromotion: true,
  createdAt: true,
  predictionScore: true,
  predictionCount: true,
  profileThemeEventId: true,
  needsUsernameSetup: true,
  isSuspended: true,
  isFoundingMember: true,
  emailNotifications: true,
} as const;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  slug: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  favoritePromotion: string | null;
  createdAt: Date;
  predictionScore: number;
  predictionCount: number;
  profileThemeEventId: string | null;
  needsUsernameSetup: boolean;
  isSuspended: boolean;
  isFoundingMember: boolean;
  emailNotifications: boolean;
};
