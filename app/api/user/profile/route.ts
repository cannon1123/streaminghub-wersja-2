import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: profile ? { ...user, ...profile } : user,
      timestamp: Date.now(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: body.username?.slice(0, 50),
      })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal error",
      },
      { status: 500 },
    )
  }
}
