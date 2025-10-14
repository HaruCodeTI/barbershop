/**
 * Auth Module - Sistema de autenticação customizado
 *
 * Substitui completamente o Supabase Auth (auth.users)
 *
 * Features:
 * - Staff: Login com email + senha (bcrypt)
 * - Customer: Login apenas com telefone (sem senha)
 * - Sessions gerenciadas na tabela `sessions`
 * - Tokens armazenados em localStorage
 *
 * @module lib/auth
 */

// Session management
export {
  createSession,
  validateSession,
  deleteSession,
  deleteAllUserSessions,
  saveTokenToStorage,
  getTokenFromStorage,
  removeTokenFromStorage,
  cleanExpiredSessions,
  type Session,
  type SessionUser,
} from "./session"

// Staff authentication
export {
  staffSignIn,
  staffSignUp,
  updateStaffPassword,
  setStaffPassword,
  type StaffUser,
  type SignInResult,
  type SignUpResult,
} from "./staff-auth"

// Customer authentication
export {
  customerSignInOrRegister,
  updateCustomerProfile,
  getCustomerById,
  getCustomerByPhone,
  type Customer,
  type CustomerSignInResult,
  type UpdateProfileResult,
} from "./customer-auth"

// Middleware / Auth guards
export {
  requireAuth,
  requireStaffAuth,
  requireManagerAuth,
  requireCustomerAuth,
  type AuthContext,
} from "./middleware"
