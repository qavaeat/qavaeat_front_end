import type { OnboardingData } from "@/types/types";

export const ServiceType = {
  PICKUP: "PICKUP",
  DELIVERY: "DELIVERY",
  DINE_IN: "DINE_IN",
} as const;

export const DayOfWeek = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;

export type ServiceTypeValue = (typeof ServiceType)[keyof typeof ServiceType];
export type DayOfWeekValue = (typeof DayOfWeek)[keyof typeof DayOfWeek];

export interface CreateBusinessPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  phone: string;
  password: string;
  description?: string;
  logoUrl?: string;
  premiseImageUrl?: string;
  menuPhotoUrl?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  services: ServiceTypeValue[];
  foodSpecialty: string[];
  availability: DayOfWeekValue[];
  yearsOfExperience: number;
  nationalIdFrontUrl: string;
  nationalIdBackUrl: string;
  businessPermitUrl: string;
  paymentMethod: string;
  mpesaPhone?: string;
  mpesaName?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
}

export function buildBusinessPayload(
  data: OnboardingData,
): CreateBusinessPayload {
  const { profile, kitchen, verification, payment } = data;

  // ✅ No casting at all — every field is now properly typed on ProfileData & KitchenData
  const { address, city, state, country } = parseLocation(kitchen.location);

  return {
    // Identity — read directly from ProfileData
    email: profile.email,
    firstName: profile.firstName || undefined,
    lastName: profile.lastName || undefined,
    password: profile.password,

    // Step 1
    name: profile.businessName,
    phone: profile.phoneNumber,
    description: profile.shortBio || undefined,
    logoUrl: profile.profilePhotoUrl ?? undefined,

    // Step 2 — read directly from KitchenData (no cast)
    premiseImageUrl: kitchen.kitchenPhotoUrl ?? undefined,
    menuPhotoUrl: kitchen.menuPhotoUrl ?? undefined,
    address,
    city,
    state,
    country,
    latitude: kitchen.latitude ?? undefined,
    longitude: kitchen.longitude ?? undefined,
    services: parseServices(kitchen.areasOfService),
    foodSpecialty: parseFoodSpecialty(kitchen.foodSpecialty),
    availability: parseAvailability(kitchen.availability),
    yearsOfExperience: kitchen.yearsOfExperience,

    // Step 3
    nationalIdFrontUrl: verification.idFrontUrl!,
    nationalIdBackUrl: verification.idBackUrl!,
    businessPermitUrl: verification.businessPermitUrl!,

    // Step 4
    paymentMethod: payment.method,
    mpesaPhone: payment.mpesaPhone || undefined,
    mpesaName: payment.mpesaName || undefined,
    bankName: payment.bankName || undefined,
    accountNumber: payment.accountNumber || undefined,
    accountHolderName: payment.accountHolderName || undefined,
  };
}

export interface SubmitBusinessResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export async function submitBusiness(
  payload: CreateBusinessPayload,
): Promise<SubmitBusinessResult> {
  const res = await fetch("/api/chef-register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `HTTP ${res.status}`,
    );
  }

  return res.json() as Promise<SubmitBusinessResult>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseServices(raw: string | undefined): ServiceTypeValue[] {
  if (!raw) return [ServiceType.DELIVERY];
  const valid = Object.values(ServiceType);
  const parsed = raw
    .split(",")
    .map((s) => s.trim().toUpperCase() as ServiceTypeValue)
    .filter((s) => valid.includes(s));
  return parsed.length ? parsed : [ServiceType.DELIVERY];
}

function parseFoodSpecialty(raw: string | undefined): string[] {
  if (!raw) return ["General"];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseAvailability(raw: string | undefined): DayOfWeekValue[] {
  if (!raw) {
    return [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ];
  }
  const valid = Object.values(DayOfWeek);
  const parsed = raw
    .split(",")
    .map((s) => s.trim().toUpperCase() as DayOfWeekValue)
    .filter((s) => valid.includes(s));
  return parsed.length ? parsed : [DayOfWeek.MONDAY];
}

function parseLocation(location: string | undefined): {
  address: string;
  city: string;
  state: string;
  country: string;
} {
  if (!location)
    return { address: "N/A", city: "N/A", state: "N/A", country: "Kenya" };
  const parts = location.split(",").map((s) => s.trim());
  if (parts.length >= 4)
    return {
      address: parts[0],
      city: parts[1],
      state: parts[2],
      country: parts[3],
    };
  if (parts.length === 2)
    return {
      address: parts[0],
      city: parts[0],
      state: parts[0],
      country: parts[1],
    };
  return {
    address: location,
    city: location,
    state: location,
    country: "Kenya",
  };
}
