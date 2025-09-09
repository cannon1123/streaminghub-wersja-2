import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const _0x5b3c = ["dXNlcm5hbWU=", "ZW1haWw=", "cGFzc3dvcmQ="]
const _0x2d4e = (str: string) => Buffer.from(str, "base64").toString()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = body[_0x2d4e(_0x5b3c[0])]
    const email = body[_0x2d4e(_0x5b3c[1])]
    const password = body[_0x2d4e(_0x5b3c[2])]

    // Validation
    if (!username || !email || !password || password.length < 6) {
      return NextResponse.json(
        {
          [_0x2d4e("ZXJyb3I=")]: _0x2d4e("SW52YWxpZCBkYXRh"),
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      return NextResponse.json(
        {
          [_0x2d4e("ZXJyb3I=")]: error.message,
        },
        { status: 400 },
      )
    }

    // Create profile
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        username,
        points: 0,
        is_admin: false,
      })
    }

    return NextResponse.json({
      [_0x2d4e("c3VjY2Vzcw==")]: true,
    })
  } catch (error) {
    return NextResponse.json(
      {
        [_0x2d4e("ZXJyb3I=")]: _0x2d4e("SW50ZXJuYWwgZXJyb3I="),
      },
      { status: 500 },
    )
  }
}
