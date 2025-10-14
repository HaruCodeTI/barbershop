"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  requireAuth,
  staffSignIn,
  customerSignInOrRegister,
  deleteSession,
  getTokenFromStorage,
  removeTokenFromStorage,
  updateStaffPassword,
  type StaffUser,
  type Customer,
  type AuthContext as AuthData,
} from "@/lib/auth"

interface AuthContextType {
  user: StaffUser | Customer | null
  userType: "staff" | "customer" | null
  storeId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  customerSignIn: (
    phone: string,
    storeId: string,
    additionalData?: { name?: string; email?: string }
  ) => Promise<{
    success: boolean
    isNewCustomer?: boolean
    error?: string
  }>
  signOut: () => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | Customer | null>(null)
  const [userType, setUserType] = useState<"staff" | "customer" | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load auth state on mount
  const loadAuth = async () => {
    try {
      setLoading(true)
      const auth = await requireAuth()

      if (auth.authenticated && auth.user) {
        setUser(auth.user)
        setUserType(auth.userType)
        setStoreId(auth.storeId)
      } else {
        setUser(null)
        setUserType(null)
        setStoreId(null)
      }
    } catch (error) {
      console.error("[AuthProvider] Error loading auth:", error)
      setUser(null)
      setUserType(null)
      setStoreId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuth()
  }, [])

  // Staff sign in with email + password
  const signIn = async (email: string, password: string) => {
    try {
      const result = await staffSignIn(email, password)

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Erro ao fazer login",
        }
      }

      // Update state
      if (result.staff) {
        setUser(result.staff)
        setUserType("staff")
        setStoreId(result.staff.store_id)
      }

      return { success: true }
    } catch (error: any) {
      console.error("[signIn] Error:", error)
      return {
        success: false,
        error: error.message || "Erro ao fazer login",
      }
    }
  }

  // Customer sign in with phone only
  const customerSignIn = async (
    phone: string,
    storeId: string,
    additionalData?: { name?: string; email?: string }
  ) => {
    try {
      const result = await customerSignInOrRegister(phone, storeId, additionalData)

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Erro ao fazer login",
        }
      }

      // Update state
      if (result.customer) {
        setUser(result.customer)
        setUserType("customer")
        setStoreId(storeId)
      }

      return {
        success: true,
        isNewCustomer: result.isNewCustomer,
      }
    } catch (error: any) {
      console.error("[customerSignIn] Error:", error)
      return {
        success: false,
        error: error.message || "Erro ao fazer login",
      }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const token = getTokenFromStorage()
      if (token) {
        await deleteSession(token)
      }
      removeTokenFromStorage()

      setUser(null)
      setUserType(null)
      setStoreId(null)
    } catch (error) {
      console.error("[signOut] Error:", error)
      // Even if there's an error, clear local state
      removeTokenFromStorage()
      setUser(null)
      setUserType(null)
      setStoreId(null)
    }
  }

  // Update password (for staff only)
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (userType !== "staff" || !user) {
        return {
          success: false,
          error: "Apenas staff pode atualizar senha",
        }
      }

      const result = await updateStaffPassword(user.id, currentPassword, newPassword)

      return result
    } catch (error: any) {
      console.error("[updatePassword] Error:", error)
      return {
        success: false,
        error: error.message || "Erro ao atualizar senha",
      }
    }
  }

  // Refresh auth state
  const refreshAuth = async () => {
    await loadAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        storeId,
        loading,
        signIn,
        customerSignIn,
        signOut,
        updatePassword,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
