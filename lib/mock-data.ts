// Mock data for development without database

export interface Service {
  id: string
  name: string
  description: string
  duration: number // in minutes
  price: number
  category: "haircut" | "beard" | "combo" | "styling"
}

export interface Barber {
  id: string
  name: string
  avatar: string
  specialties: string[]
  rating: number
  totalReviews: number
}

export interface TimeSlot {
  time: string
  available: boolean
  barberId?: string
}

export interface Appointment {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  barberId: string
  barberName: string
  serviceIds: string[]
  date: string
  time: string
  duration: number
  price: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
  notes?: string
}

export interface BarberAvailability {
  barberId: string
  barberName: string
  date: string
  slots: {
    time: string
    status: "available" | "booked" | "blocked"
    appointmentId?: string
  }[]
}

export interface Store {
  id: string
  name: string
  slug: string
  description: string
  address: string
  phone: string
  email: string
  logo: string
  openingHours: {
    day: string
    open: string
    close: string
  }[]
}

export interface User {
  id: string
  email: string
  name: string
  role: "customer" | "attendant" | "barber" | "manager"
  storeId?: string
  avatar?: string
}

export interface Coupon {
  id: string
  code: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minPurchase: number
  maxDiscount?: number
  validFrom: string
  validUntil: string
  usageLimit: number
  usedCount: number
  active: boolean
  storeId: string
}

export interface LoyaltyProgram {
  id: string
  name: string
  description: string
  pointsPerReal: number // Points earned per R$ spent
  active: boolean
  storeId: string
}

export interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsCost: number
  discountType: "percentage" | "fixed"
  discountValue: number
  active: boolean
  storeId: string
}

export interface CustomerLoyalty {
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  points: number
  totalSpent: number
  appointmentsCount: number
  storeId: string
  lastVisit?: string
  favoriteServices: string[]
  favoriteBarbers: string[]
  appointmentHistory: {
    id: string
    date: string
    serviceIds: string[]
    barberId: string
    price: number
  }[]
}

export const mockServices: Service[] = [
  {
    id: "1",
    name: "Corte Clássico",
    description: "Corte tradicional com tesoura e máquina",
    duration: 30,
    price: 35,
    category: "haircut",
  },
  {
    id: "2",
    name: "Corte Premium",
    description: "Corte detalhado com finalização e styling",
    duration: 45,
    price: 50,
    category: "haircut",
  },
  {
    id: "3",
    name: "Barba Simples",
    description: "Aparar e modelar barba profissionalmente",
    duration: 20,
    price: 25,
    category: "beard",
  },
  {
    id: "4",
    name: "Barba Completa",
    description: "Tratamento completo de barba com toalha quente",
    duration: 30,
    price: 40,
    category: "beard",
  },
  {
    id: "5",
    name: "Combo Corte + Barba",
    description: "Pacote completo de cuidados",
    duration: 60,
    price: 70,
    category: "combo",
  },
  {
    id: "6",
    name: "Finalização",
    description: "Styling profissional para ocasiões especiais",
    duration: 30,
    price: 45,
    category: "styling",
  },
]

export const mockBarbers: Barber[] = [
  {
    id: "1",
    name: "Marcus Johnson",
    avatar: "/placeholder.svg?height=100&width=100",
    specialties: ["Cortes Clássicos", "Degradês", "Barba"],
    rating: 4.9,
    totalReviews: 127,
  },
  {
    id: "2",
    name: "David Chen",
    avatar: "/placeholder.svg?height=100&width=100",
    specialties: ["Estilos Modernos", "Coloração", "Texturização"],
    rating: 4.8,
    totalReviews: 98,
  },
  {
    id: "3",
    name: "James Rodriguez",
    avatar: "/placeholder.svg?height=100&width=100",
    specialties: ["Degradês", "Contornos", "Desenhos"],
    rating: 4.9,
    totalReviews: 156,
  },
]

export const mockAppointments: Appointment[] = [
  {
    id: "apt-001",
    customerId: "cust-001",
    customerName: "John Smith",
    customerPhone: "(555) 123-4567",
    barberId: "1",
    barberName: "Marcus Johnson",
    serviceIds: ["1", "3"],
    date: new Date().toISOString(),
    time: "10:00",
    duration: 50,
    price: 60,
    status: "confirmed",
  },
  {
    id: "apt-002",
    customerId: "cust-002",
    customerName: "Michael Brown",
    customerPhone: "(555) 234-5678",
    barberId: "2",
    barberName: "David Chen",
    serviceIds: ["2"],
    date: new Date().toISOString(),
    time: "11:00",
    duration: 45,
    price: 50,
    status: "confirmed",
  },
  {
    id: "apt-003",
    customerId: "cust-003",
    customerName: "Robert Davis",
    customerPhone: "(555) 345-6789",
    barberId: "1",
    barberName: "Marcus Johnson",
    serviceIds: ["5"],
    date: new Date().toISOString(),
    time: "14:00",
    duration: 60,
    price: 70,
    status: "pending",
  },
]

export const mockStores: Store[] = [
  {
    id: "store-1",
    name: "GoBarber Centro",
    slug: "centro",
    description: "Barbearia premium no coração da cidade",
    address: "Rua Principal, 123 - Centro",
    phone: "(11) 3000-2000",
    email: "centro@gobarber.com",
    logo: "/placeholder.svg?height=80&width=80",
    openingHours: [
      { day: "Segunda", open: "09:00", close: "19:00" },
      { day: "Terça", open: "09:00", close: "19:00" },
      { day: "Quarta", open: "09:00", close: "19:00" },
      { day: "Quinta", open: "09:00", close: "19:00" },
      { day: "Sexta", open: "09:00", close: "20:00" },
      { day: "Sábado", open: "08:00", close: "18:00" },
      { day: "Domingo", open: "Fechado", close: "Fechado" },
    ],
  },
  {
    id: "store-2",
    name: "GoBarber Zona Oeste",
    slug: "zona-oeste",
    description: "Experiência moderna de barbearia na zona oeste",
    address: "Av. Oeste, 456 - Zona Oeste",
    phone: "(11) 3000-3000",
    email: "oeste@gobarber.com",
    logo: "/placeholder.svg?height=80&width=80",
    openingHours: [
      { day: "Segunda", open: "09:00", close: "19:00" },
      { day: "Terça", open: "09:00", close: "19:00" },
      { day: "Quarta", open: "09:00", close: "19:00" },
      { day: "Quinta", open: "09:00", close: "19:00" },
      { day: "Sexta", open: "09:00", close: "20:00" },
      { day: "Sábado", open: "08:00", close: "18:00" },
      { day: "Domingo", open: "10:00", close: "16:00" },
    ],
  },
]

export const mockCoupons: Coupon[] = [
  {
    id: "coup-001",
    code: "BEMVINDO20",
    description: "20% de desconto para novos clientes",
    discountType: "percentage",
    discountValue: 20,
    minPurchase: 50,
    maxDiscount: 30,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 100,
    usedCount: 23,
    active: true,
    storeId: "store-1",
  },
  {
    id: "coup-002",
    code: "COMBO50",
    description: "R$ 50 de desconto em combos acima de R$ 150",
    discountType: "fixed",
    discountValue: 50,
    minPurchase: 150,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 50,
    usedCount: 12,
    active: true,
    storeId: "store-1",
  },
  {
    id: "coup-003",
    code: "FIDELIDADE15",
    description: "15% de desconto para clientes fiéis",
    discountType: "percentage",
    discountValue: 15,
    minPurchase: 0,
    maxDiscount: 40,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 200,
    usedCount: 87,
    active: true,
    storeId: "store-1",
  },
]

export const mockLoyaltyProgram: LoyaltyProgram = {
  id: "loyalty-001",
  name: "GoBarber Fidelidade",
  description: "Ganhe pontos a cada agendamento e troque por descontos",
  pointsPerReal: 10, // 10 points per R$ 1 spent
  active: true,
  storeId: "store-1",
}

export const mockLoyaltyRewards: LoyaltyReward[] = [
  {
    id: "reward-001",
    name: "Desconto de R$ 10",
    description: "Troque 100 pontos por R$ 10 de desconto",
    pointsCost: 100,
    discountType: "fixed",
    discountValue: 10,
    active: true,
    storeId: "store-1",
  },
  {
    id: "reward-002",
    name: "Desconto de R$ 25",
    description: "Troque 250 pontos por R$ 25 de desconto",
    pointsCost: 250,
    discountType: "fixed",
    discountValue: 25,
    active: true,
    storeId: "store-1",
  },
  {
    id: "reward-003",
    name: "Desconto de 20%",
    description: "Troque 500 pontos por 20% de desconto (máx R$ 50)",
    pointsCost: 500,
    discountType: "percentage",
    discountValue: 20,
    active: true,
    storeId: "store-1",
  },
]

export const mockCustomerLoyalty: CustomerLoyalty[] = [
  {
    customerId: "cust-001",
    customerName: "João Silva",
    customerEmail: "joao.silva@email.com",
    customerPhone: "(11) 98765-4321",
    points: 450,
    totalSpent: 320,
    appointmentsCount: 8,
    storeId: "store-1",
    lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    favoriteServices: ["1", "3", "5"],
    favoriteBarbers: ["1"],
    appointmentHistory: [
      {
        id: "apt-h-001",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        serviceIds: ["5"],
        barberId: "1",
        price: 70,
      },
      {
        id: "apt-h-002",
        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        serviceIds: ["1", "3"],
        barberId: "1",
        price: 60,
      },
    ],
  },
  {
    customerId: "cust-002",
    customerName: "Maria Santos",
    customerEmail: "maria.santos@email.com",
    customerPhone: "(11) 91234-5678",
    points: 180,
    totalSpent: 150,
    appointmentsCount: 3,
    storeId: "store-1",
    lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    favoriteServices: ["2", "6"],
    favoriteBarbers: ["2"],
    appointmentHistory: [
      {
        id: "apt-h-003",
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        serviceIds: ["2"],
        barberId: "2",
        price: 50,
      },
    ],
  },
]

export function generateTimeSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startHour = 9
  const endHour = 19

  for (let hour = startHour; hour < endHour; hour++) {
    for (const minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      slots.push({
        time,
        available: Math.random() > 0.3, // 70% availability
        barberId: mockBarbers[Math.floor(Math.random() * mockBarbers.length)].id,
      })
    }
  }

  return slots
}

export function generateBarberAvailability(date: Date): BarberAvailability[] {
  return mockBarbers.map((barber) => {
    const slots = []
    const startHour = 9
    const endHour = 19

    for (let hour = startHour; hour < endHour; hour++) {
      for (const minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

        // Check if there's an appointment at this time
        const appointment = mockAppointments.find(
          (apt) => apt.barberId === barber.id && apt.time === time && apt.date === date.toISOString(),
        )

        slots.push({
          time,
          status: appointment ? "booked" : Math.random() > 0.2 ? "available" : "blocked",
          appointmentId: appointment?.id,
        })
      }
    }

    return {
      barberId: barber.id,
      barberName: barber.name,
      date: date.toISOString(),
      slots,
    }
  })
}

export function validateCoupon(
  coupon: Coupon,
  totalPrice: number,
): { valid: boolean; error?: string; discount?: number } {
  if (!coupon.active) {
    return { valid: false, error: "Cupom inativo" }
  }

  const now = new Date()
  const validFrom = new Date(coupon.validFrom)
  const validUntil = new Date(coupon.validUntil)

  if (now < validFrom) {
    return { valid: false, error: "Cupom ainda não está válido" }
  }

  if (now > validUntil) {
    return { valid: false, error: "Cupom expirado" }
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: "Limite de uso atingido" }
  }

  if (totalPrice < coupon.minPurchase) {
    return {
      valid: false,
      error: `Valor mínimo de compra: R$ ${coupon.minPurchase.toFixed(2)}`,
    }
  }

  let discount = 0
  if (coupon.discountType === "percentage") {
    discount = (totalPrice * coupon.discountValue) / 100
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount
    }
  } else {
    discount = coupon.discountValue
  }

  return { valid: true, discount }
}

export function generateStaticTimeSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startHour = 9
  const endHour = 19

  // Use date as seed for consistent availability per day
  const dateSeed = date.getDate() + date.getMonth() * 31

  for (let hour = startHour; hour < endHour; hour++) {
    for (const minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      const slotIndex = hour * 2 + (minute === 30 ? 1 : 0)

      // Generate consistent availability based on date and slot
      const availabilitySeed = (dateSeed + slotIndex) % 10
      const available = availabilitySeed < 7 // 70% availability

      slots.push({
        time,
        available,
        barberId: mockBarbers[slotIndex % mockBarbers.length].id,
      })
    }
  }

  return slots
}
