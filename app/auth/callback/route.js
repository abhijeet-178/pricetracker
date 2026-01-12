import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get("code")
  const next = searchParams.get("next") || "/"

  if (!code) {
    return NextResponse.redirect(`${origin}/error`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/error`)
  }

  // ✅ Important: disable cache so cookies are respected
  const response = NextResponse.redirect(`${origin}${next}`)
  response.headers.set("Cache-Control", "no-store")

  return response
}
