export type MealTime = "BREAKFAST" | "LUNCH" | "DINNER";
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type DeliveryOption = "DELIVERY" | "PICKUP";
export type SubscriptionStatus = "PENDING" | "ACTIVE" | "PAUSED" | "CANCELLED" | "COMPLETED" | "EXPIRED";
export type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REFUNDED" | "FAILED";
export type MealPlanStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

// ─── Plan shapes ──────────────────────────────────────────────────────────────

export interface MealPlanItem {
  id: string;
  menuItemId: string;
  menuItem: {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number;
    prepTimeMin: number | null;
  };
  mealTime: MealTime;
  dayNumber: number;
  notes: string | null;
}

export interface MealPlan {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  cuisineType: string[];
  mealTypes: MealTime[];
  status: MealPlanStatus;
  price: number;
  currency: string;
  durationDays: number;
  mealsPerDay: number;
  totalMeals: number;
  maxSubscribers: number | null;
  currentSubscribers: number;
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  availableDays: DayOfWeek[];
  isFeatured: boolean;
  tags: string[];
  meals?: MealPlanItem[];
  business?: {
    id: string;
    name: string;
    city: string;
    logoUrl: string | null;
    chef: {
      profile: { firstName: string | null; lastName: string | null } | null;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Subscription shapes ──────────────────────────────────────────────────────

export interface MealPlanSubscription {
  id: string;
  userId: string;
  mealPlanId: string;
  mealPlan: MealPlan;
  status: SubscriptionStatus;
  deliveryOption: DeliveryOption;
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  startDate: string;
  endDate: string;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  paymentRef: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

// ─── API payload shapes ───────────────────────────────────────────────────────

export interface SubscribePlanPayload {
  deliveryOption: DeliveryOption;
  startDate: string;           // YYYY-MM-DD
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
}

export interface PaySubscriptionPayload {
  subscriptionId: string;
  amount: number;
  paymentRef: string;          // simulated reference
}

// ─── API envelope shapes ──────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedEnvelope<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}