import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const _0x6c4d = ["bW92aWVz", "ZmlsdGVycw==", "cXVlcnk="]
const _0x3e5f = (str: string) => Buffer.from(str, "base64").toString()

// Simple data obfuscation
function obfuscateMovieData(movies: any[]) {
  return movies.map((movie) => ({
    ...movie,
    // Encode sensitive URLs
    iframe: movie.iframe ? Buffer.from(movie.iframe).toString("base64") : null,
    // Add decoy fields
    _x1: Math.random().toString(36),
    _x2: Date.now(),
  }))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const categoryId = searchParams.get("category_id")
    const year = searchParams.get("year")
    const minDuration = searchParams.get("min_duration")
    const sort = searchParams.get("sort") || "new"

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    let dbQuery = supabase.from("movies").select("*")

    // Apply filters
    if (query) {
      dbQuery = dbQuery.ilike("title", `%${query}%`)
    }
    if (categoryId) {
      dbQuery = dbQuery.eq("category_id", Number.parseInt(categoryId))
    }
    if (year) {
      dbQuery = dbQuery.eq("year", Number.parseInt(year))
    }
    if (minDuration) {
      dbQuery = dbQuery.gte("duration", Number.parseInt(minDuration))
    }

    // Sorting
    if (sort === "new") {
      dbQuery = dbQuery.order("created_at", { ascending: false })
    }

    const { data, error } = await dbQuery

    if (error) {
      return NextResponse.json(
        {
          [_0x3e5f("ZXJyb3I=")]: error.message,
        },
        { status: 500 },
      )
    }

    // Obfuscate data before sending
    const obfuscatedData = obfuscateMovieData(data || [])

    return NextResponse.json({
      [_0x3e5f("ZGF0YQ==")]: obfuscatedData,
      [_0x3e5f("dGltZXN0YW1w")]: Date.now(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        [_0x3e5f("ZXJyb3I=")]: _0x3e5f("SW50ZXJuYWwgZXJyb3I="),
      },
      { status: 500 },
    )
  }
}
