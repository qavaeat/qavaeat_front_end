export interface MenuItem {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  price: string;
  quantity: number;
  imageUrl: string | null;
  isAvailable: boolean;
  calories: number | null;
  prepTimeMin: number | null;
  tags: string[];
  mealTimes: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface MenuItemsResponse {
  success: boolean;
  data: MenuItem[];
  meta: PaginationMeta;
}

// ── Meal Plans ─────────────────────────────────────────

export interface MealPlanMeal {
  id: string;
  mealTime: string;
  dayNumber: number;
  notes: string | null;
  menuItem: {
    id: string;
    name: string;
    imageUrl: string | null;
    calories: number | null;
  };
}

export interface MealPlanBusiness {
  id: string;
  name: string;
  city: string;
  logoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  chef: {
    id: string;
    email: string;
  };
}

export interface MealPlan {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  cuisineType: string[];
  mealTypes: string[];
  price: string;
  currency: string;
  durationDays: number;
  mealsPerDay: number;
  totalMeals: number;
  maxSubscribers: number | null;
  currentSubscribers: number;
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  availableDays: string[];
  isFeatured: boolean;
  tags: string[];
  business: MealPlanBusiness;
  _count: { subscriptions: number };
  meals: MealPlanMeal[];
  distanceKm: number | null;
}

export interface MealPlansResponse {
  success: boolean;
  data: MealPlan[];
  meta: PaginationMeta;
}