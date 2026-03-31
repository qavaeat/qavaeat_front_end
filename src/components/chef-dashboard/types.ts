export type DashboardTab = "dashboard" | "orders" | "customers" | "menus" | "reports";

export type MealTime = "BREAKFAST" | "LUNCH" | "DINNER";

export type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

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

export interface MealPlanItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  mealTime: MealTime;
  dayNumber: number;
  notes: string | null;
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
  items?: MealPlanItem[];
  // derived
  durationType?: "weekly" | "monthly";
  subscriberCount?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  activeMealPlan: string | null;
  status: "active" | "inactive";
  avatarUrl: string | null;
}

export interface Order {
  id: string;
  customerName: string;
  customerAvatarUrl: string | null;
  item: string;
  mealTime: MealTime;
  amount: number;
  date: string;
  time: string;
  location: string;
  expectedDeliveryTime: string;
  status: "pending" | "preparing" | "delivered" | "cancelled";
}