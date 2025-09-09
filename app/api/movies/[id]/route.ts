import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const movieId = Number.parseInt(params.id)

    if (isNaN(movieId)) {
      return NextResponse.json(
        {
          error: "Invalid movie ID",
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
      },
    })

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: movie, error } = await supabase.from("movies").select("*").eq("id", movieId).single()

    if (error || !movie) {
      return NextResponse.json(
        {
          error: "Movie not found",
        },
        { status: 404 },
      )
    }

    // Check if user has access to premium content
    let hasAccess = true
    if (movie.points_required > 0 && user) {
      const { data: unlock } = await supabase
        .from("unlocks")
        .select("id")
        .eq("user_id", user.id)
        .eq("movie_id", movieId)
        .maybeSingle()

      hasAccess = !!unlock
    }

    // Obfuscate iframe URL if no access
    const responseMovie = {
      ...movie,
      iframe: hasAccess ? movie.iframe : null,
      _access: hasAccess,
      _encoded_iframe: hasAccess ? null : Buffer.from(movie.iframe || "").toString("base64"),
    }

    return NextResponse.json({
      data: responseMovie,
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
