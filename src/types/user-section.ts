export type ServiceType = "PICKUP" | "DELIVERY" | "DINE_IN";
export type DeliveryType = "NOW" | "SCHEDULED";
export type DeliveryOption = "DELIVERY" | "PICKUP";
export type MealTime = "BREAKFAST" | "LUNCH" | "DINNER";

export type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface Business {
  id: string;
  name: string;
  description?: string;
  phone: string;
  email?: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  premiseImageUrl?: string;
  yearsOfExperience: number;
  foodSpecialty: string[];
  services: ServiceType[];
  availability: DayOfWeek[];
  chefName: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  priceMin: number;
  priceMax: number;
  isFeatured?: boolean;
  isTopRated?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  imageUrl: string | null;
  isAvailable: boolean;
  calories: number | null;
  prepTimeMin: number | null;
  tags: string[];
  mealTimes: MealTime[];
}

export interface MealPlan {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  cuisineType: string[];
  mealTypes: MealTime[];
  price: number;
  currency: string;
  durationDays: number;
  mealsPerDay: number;
  maxSubscribers: number | null;
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  availableDays: DayOfWeek[];
  tags: string[];
  subscriberCount?: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  deliveryType: DeliveryType;
  scheduledAt: Date | null;
  mealTimes: MealTime[];
  description: string | null;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  promoDiscount: number;
  total: number;
}

export interface CheckoutPayload {
  serviceType: ServiceType;
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  notes: string | null;
}

export interface UserSubscription {
  id: string;
  name: string;
  imageUrl: string | null;
  durationDays: number;
  totalMeals: number;
  price: number;
  currency: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  startDate: string;
  business: { id: string; name: string; logoUrl: string | null };
}

export interface SubscriptionScheduleItem {
  id: string;
  dayNumber: number;
  date: string;
  mealTime: MealTime;
  menuItemName: string;
  menuItemImage: string | null;
  notes: string | null;
  deliveryTime: string;
}

export interface SubscribePayload {
  mealPlanId: string;
  startDate: Date;
  deliveryOption: DeliveryOption;
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
}

export interface CancelSubscriptionPayload {
  subscriptionId: string;
  reason: string | null;
}