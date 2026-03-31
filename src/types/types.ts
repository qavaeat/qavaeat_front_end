// src/components/chef-onboarding/types.ts
// ─────────────────────────────────────────────────────────────
// Shared types and stepper used across all 4 onboarding steps
// ─────────────────────────────────────────────────────────────

export type OnboardingStep = 1 | 2 | 3 | 4;

export interface ProfileData {
  profilePhotoUrl: string | null;
  businessName: string;
  phoneNumber: string;
  shortBio: string;
}

export interface KitchenData {
  kitchenPhotoUrl: string | null;
  menuPhotoUrl: string | null;
  location: string;
  areasOfService: string;
}

export interface VerificationData {
  idFrontUrl: string | null;
  idBackUrl: string | null;
  businessPermitUrl: string | null;
}

export type PaymentMethod = "mpesa" | "bank";

export interface PaymentData {
  method: PaymentMethod;
  // M-Pesa fields
  mpesaPhone: string;
  mpesaName: string;
  // Bank fields
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface OnboardingData {
  profile: ProfileData;
  kitchen: KitchenData;
  verification: VerificationData;
  payment: PaymentData;
}