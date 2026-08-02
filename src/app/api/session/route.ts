import { NextResponse } from 'next/server'

/**
 * Public session boundary. Until a trusted identity provider and server-side
 * session store are configured, every visitor is treated as signed out.
 * Account UI consumes this contract and never ships demo user data.
 */
export async function GET() {
  return NextResponse.json(
    { authenticated: false, account: null },
    { headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
  )
}
