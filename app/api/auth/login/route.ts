import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const _0x4a2b = ["bG9naW4=", "cGFzc3dvcmQ=", "ZW1haWw="]
const _0x1c3d = (str: string) => Buffer.from(str, "base64").toString()

// Rate limiting store (in production use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const key = `login_${ip}`
  const limit = rateLimitStore.get(key)

  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }

  if (limit.count >= 5) {
    // Max 5 attempts per minute
    return false
  }

  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          [_0x1c3d("ZXJyb3I=")]: _0x1c3d("VG9vIG1hbnkgYXR0ZW1wdHM="),
        },
        { status: 429 },
      )
    }

    const body = await request.json()
    const email = body[_0x1c3d(_0x4a2b[2])]
    const password = body[_0x1c3d(_0x4a2b[1])]

    if (!email || !password) {
      return NextResponse.json(
        {
          [_0x1c3d("ZXJyb3I=")]: _0x1c3d("SW52YWxpZCBkYXRh"),
        },
        { status: 400 },
      )
    }

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        {
          [_0x1c3d("ZXJyb3I=")]: error.message,
        },
        { status: 401 },
      )
    }

    // Obfuscated success response
    return NextResponse.json({
      [_0x1c3d("c3VjY2Vzcw==")]: true,
      [_0x1c3d("dXNlcg==")]: {
        id: data.user?.id,
        email: data.user?.email,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        [_0x1c3d("ZXJyb3I=")]: _0x1c3d("SW50ZXJuYWwgZXJyb3I="),
      },
      { status: 500 },
    )
  }
}
