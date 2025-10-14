// Shared TypeScript types for Manager features

// ===== APPOINTMENTS =====
export interface AppointmentWithDetails {
  id: string
  appointment_date: string
  appointment_time: string
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
  final_price: number
  discount_amount: number
  total_price: number
  notes: string | null
  customer: {
    id: string
    name: string
    phone: string
    email: string | null
  }
  barber: {
    id: string
    name: string
    avatar_url: string | null
  }
  services: Array<{
    id: string
    name: string
    price: number
    duration: number
  }>
  created_at: string
}

export interface AppointmentFilters {
  startDate?: string
  endDate?: string
  status?: string[]
  barberId?: string
  search?: string
}

export interface AppointmentStats {
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  noShow: number
  totalRevenue: number
  avgTicket: number
}

// ===== CUSTOMERS =====
export interface CustomerWithStats {
  id: string
  name: string
  email: string | null
  phone: string
  loyalty_points: number
  created_at: string
  auth_user_id: string | null
  total_appointments: number
  completed_appointments: number
  total_spent: number
  avg_ticket: number
  last_appointment_date: string | null
  recurrence_type: "new" | "returning" | "vip"
}

export interface CustomerStats {
  total: number
  newThisMonth: number
  returning: number
  vip: number
  avgLifetimeValue: number
  avgLoyaltyPoints: number
}

export interface CustomerFilters {
  search?: string
  recurrenceType?: string[]
  minLoyaltyPoints?: number
  sortBy?: "name" | "total_spent" | "last_visit" | "loyalty_points"
}

// ===== STORE SETTINGS =====
export interface StoreHours {
  id?: string
  store_id: string
  day_of_week: number // 0=Sunday, 6=Saturday
  is_open: boolean
  open_time: string // "09:00"
  close_time: string // "18:00"
  break_start?: string | null
  break_end?: string | null
}

export interface StoreSettings {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

// ===== PERMISSIONS =====
export interface StaffUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: "barber" | "attendant" | "manager"
  is_active: boolean
  avatar_url: string | null
  specialties: string[]
  created_at: string
}

export type UserRole = "barber" | "attendant" | "manager"

// ===== SHARED UTILITIES =====
export interface DateRange {
  from: string
  to: string
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
}

export interface SortConfig {
  key: string
  direction: "asc" | "desc"
}

export interface FilterOption {
  label: string
  value: string
  count?: number
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface ApiListResponse<T = unknown> extends ApiResponse<T[]> {
  pagination?: PaginationConfig
}
