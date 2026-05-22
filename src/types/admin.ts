export type BusinessStatus = "PENDING" | "APPROVED" | "DECLINED" | "SUSPENDED";
export type ServiceType = "PICKUP" | "DELIVERY" | "DINE_IN";
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface Chef {
  id: string;
  email: string;
  role: string;
}

export interface Business {
  id: string;
  chefId: string;
  name: string;
  description?: string;
  status: BusinessStatus;
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
  businessPermitUrl: string;
  nationalIdFrontUrl: string;
  nationalIdBackUrl: string;
  yearsOfExperience: number;
  foodSpecialty: string[];
  services: ServiceType[];
  availability: DayOfWeek[];
  reviewedAt?: string;
  reviewedById?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
  chef: Chef;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedBusinesses {
  success: boolean;
  businesses: Business[];
  meta: PaginationMeta;
}

export interface AdminStats {
  totalBusinesses: number;
  pendingApplications: number;
  approvedBusinesses: number;
  suspendedBusinesses: number;
  declinedApplications: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  totalUsers: number;
  revenueByDay: { date: string; amount: number }[];
  topBusinesses: { id: string; name: string; revenue: number; orders: number }[];
}