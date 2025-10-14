import { createClient } from "./supabase/client"

export type UserRole = "customer" | "barber" | "attendant" | "manager" | null

export interface UserProfile {
  role: UserRole
  profile: any
}

/**
 * Determines the user's role and profile after authentication
 * Checks both customers and barbers tables
 */
export async function getUserRoleAndProfile(userId: string): Promise<UserProfile> {
  const supabase = createClient()

  try {
    // First, check if user is a staff member (barber/attendant/manager)
    const { data: barber, error: barberError } = await supabase
      .from("barbers")
      .select("id, name, email, role, store_id, is_active")
      .eq("id", userId)
      .maybeSingle() // Use maybeSingle() instead of single() to avoid error if not found

    // If found in barbers table and is active
    if (barber && barber.is_active) {
      return {
        role: barber.role as UserRole,
        profile: barber,
      }
    }

    // If not a staff member, check if user is a customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, name, email, phone, store_id, loyalty_points, auth_user_id")
      .eq("auth_user_id", userId)
      .maybeSingle()

    // If found in customers table
    if (customer) {
      return {
        role: "customer",
        profile: customer,
      }
    }

    // User not found in either table
    console.warn(`[getUserRoleAndProfile] User ${userId} not found in barbers or customers tables`)
    return {
      role: null,
      profile: null,
    }
  } catch (error) {
    console.error("[getUserRoleAndProfile] Error:", error)
    return {
      role: null,
      profile: null,
    }
  }
}

/**
 * Gets the appropriate dashboard URL based on user role
 */
export function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case "manager":
      return "/manager/dashboard"
    case "barber":
      return "/barber/daily-summary"
    case "attendant":
      return "/attendant/availability"
    case "customer":
      return "/customer/appointments"
    default:
      return "/"
  }
}

/**
 * Checks if user has permission for a specific role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false
  return requiredRoles.includes(userRole)
}

/**
 * Checks if user is staff (barber, attendant, or manager)
 */
export function isStaff(userRole: UserRole): boolean {
  return userRole === "barber" || userRole === "attendant" || userRole === "manager"
}

/**
 * Checks if user is customer
 */
export function isCustomer(userRole: UserRole): boolean {
  return userRole === "customer"
}
