export type DashboardTab =
  | "dashboard"
  | "orders"
  | "customers"
  | "menus"
  | "reports"
  | "settings";

export type MealTime = "BREAKFAST" | "LUNCH" | "DINNER";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

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

export type MealScheduleStatus =
  | "DRAFT"
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type MealScheduleItemStatus =
  | "SCHEDULED"
  | "PREPARING"
  | "READY"
  | "DELIVERED"
  | "MISSED"
  | "CANCELLED";

export interface MealScheduleItem {
  id: string;
  menuItemId: string;
  menuItem: { id: string; name: string; imageUrl: string | null };
  scheduledDate: string;
  mealTime: MealTime;
  scheduledAt: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  status: MealScheduleItemStatus;
  notes: string | null;
}

export interface MealSchedule {
  id: string;
  userId: string;
  businessId: string;
  status: MealScheduleStatus;
  serviceType: "DELIVERY" | "PICKUP" | "DINE_IN";
  deliveryAddress: string | null;
  totalAmount: number;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
  items: MealScheduleItem[];
  user: {
    id: string;
    email: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      avatarUrl: string | null;
    } | null;
  };
  business: { id: string; name: string; logoUrl: string | null };
}

export interface ChefCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  joinedDate: string;
  lastActivityDate: string;
  totalSchedules: number;
  completedSchedules: number;
  totalSpent: number;
  activeMealPlan: string | null;
  subscriptionStatus: string | null;
  status: "active" | "inactive" | "paused";
}

export interface ChefProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ChefUser {
  id: string;
  email: string;
  profile: ChefProfile | null;
}
