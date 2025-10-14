/**
 * Seed script for test users with new custom auth system
 *
 * Run with: npm run seed
 *
 * Creates:
 * - Manager user (email: manager@gobarber.com, password: Manager123!)
 * - Barber user (email: barber@gobarber.com, password: Barber123!)
 * - Attendant user (email: attendant@gobarber.com, password: Attendant123!)
 * - 3 test customers with phone numbers
 */

import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import path from "path"

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), ".env.local") })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables")
  console.error("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedTestUsers() {
  console.log("🌱 Starting seed process...")

  try {
    // 1. Get or create test store
    console.log("\n📍 Checking for test store...")
    let { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, slug")
      .limit(1)
      .single()

    if (storeError || !store) {
      console.log("   Creating test store...")
      const { data: newStore, error: createError } = await supabase
        .from("stores")
        .insert({
          name: "GoBarber Teste",
          slug: "gobarber-teste",
          address: "Rua Teste, 123 - São Paulo, SP",
          phone: "11934567890",
          email: "contato@gobarber.com",
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      store = newStore
      console.log(`   ✅ Created test store: ${store.name} (${store.id})`)
    } else {
      console.log(`   ✅ Using existing store: ${store.name} (${store.id})`)
    }

    const storeId = store.id

    // 2. Create staff users
    console.log("\n👥 Creating staff users...")

    const staffUsers = [
      {
        email: "manager@gobarber.com",
        password: "Manager123!",
        name: "Gerente Teste",
        phone: "11999990001",
        role: "manager" as const,
      },
      {
        email: "barber@gobarber.com",
        password: "Barber123!",
        name: "Barbeiro Teste",
        phone: "11999990002",
        role: "barber" as const,
        rating: 4.8,
        total_reviews: 50,
        specialties: ["Cortes", "Barba"],
      },
      {
        email: "attendant@gobarber.com",
        password: "Attendant123!",
        name: "Atendente Teste",
        phone: "11999990003",
        role: "attendant" as const,
      },
    ]

    for (const user of staffUsers) {
      // Check if user already exists
      const { data: existing } = await supabase
        .from("barbers")
        .select("id, email")
        .eq("email", user.email)
        .single()

      if (existing) {
        // Update password
        const passwordHash = await bcrypt.hash(user.password, 10)
        const { error: updateError } = await supabase
          .from("barbers")
          .update({ password_hash: passwordHash, is_active: true })
          .eq("id", existing.id)

        if (updateError) {
          throw updateError
        }

        console.log(`   ✅ Updated ${user.role}: ${user.email}`)
      } else {
        // Create new user
        const passwordHash = await bcrypt.hash(user.password, 10)
        const { error: insertError } = await supabase.from("barbers").insert({
          store_id: storeId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_active: true,
          password_hash: passwordHash,
          rating: "rating" in user ? user.rating : 0,
          total_reviews: "total_reviews" in user ? user.total_reviews : 0,
          specialties: "specialties" in user ? user.specialties : [],
        })

        if (insertError) {
          throw insertError
        }

        console.log(`   ✅ Created ${user.role}: ${user.email}`)
      }
    }

    // 3. Create test customers
    console.log("\n👤 Creating test customers...")

    const customers = [
      {
        phone: "11987654321",
        name: "João Silva",
        email: "joao@example.com",
        loyalty_points: 150,
      },
      {
        phone: "11987654322",
        name: "Maria Santos",
        email: "maria@example.com",
        loyalty_points: 200,
      },
      {
        phone: "11987654323",
        name: "Cliente", // Incomplete profile
        email: null,
        loyalty_points: 0,
      },
    ]

    for (const customer of customers) {
      // Check if customer already exists
      const { data: existing } = await supabase
        .from("customers")
        .select("id, phone")
        .eq("phone", customer.phone)
        .eq("store_id", storeId)
        .single()

      if (existing) {
        // Update customer
        const { error: updateError } = await supabase
          .from("customers")
          .update({
            name: customer.name,
            email: customer.email,
            loyalty_points: customer.loyalty_points,
          })
          .eq("id", existing.id)

        if (updateError) {
          throw updateError
        }

        console.log(`   ✅ Updated customer: ${customer.name} (${customer.phone})`)
      } else {
        // Create new customer
        const { error: insertError } = await supabase.from("customers").insert({
          store_id: storeId,
          phone: customer.phone,
          name: customer.name,
          email: customer.email,
          loyalty_points: customer.loyalty_points,
        })

        if (insertError) {
          throw insertError
        }

        console.log(`   ✅ Created customer: ${customer.name} (${customer.phone})`)
      }
    }

    // 4. Verification
    console.log("\n✨ Seed complete! Summary:")
    console.log("\n📊 STAFF USERS:")
    const { data: staff } = await supabase
      .from("barbers")
      .select("email, name, role, is_active")
      .in("email", ["manager@gobarber.com", "barber@gobarber.com", "attendant@gobarber.com"])

    staff?.forEach((s) => {
      console.log(`   - ${s.email} (${s.role}) - ${s.is_active ? "Active" : "Inactive"}`)
    })

    console.log("\n📊 CUSTOMERS:")
    const { data: customersData } = await supabase
      .from("customers")
      .select("phone, name, email, loyalty_points")
      .in("phone", ["11987654321", "11987654322", "11987654323"])

    customersData?.forEach((c) => {
      console.log(`   - ${c.phone}: ${c.name} (${c.loyalty_points} pts)`)
    })

    console.log("\n🎉 Done! You can now test:")
    console.log("\nStaff Login (/login):")
    console.log("   manager@gobarber.com / Manager123!")
    console.log("   barber@gobarber.com / Barber123!")
    console.log("   attendant@gobarber.com / Attendant123!")
    console.log("\nCustomer Login (/customer/login):")
    console.log("   (11) 98765-4321")
    console.log("   (11) 98765-4322")
    console.log("   (11) 98765-4323")
  } catch (error) {
    console.error("\n❌ Error seeding database:", error)
    process.exit(1)
  }
}

// Run the seed
seedTestUsers()
