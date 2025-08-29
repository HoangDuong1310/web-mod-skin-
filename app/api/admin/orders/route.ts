import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Orders API has been removed. Use downloads API instead.' }, { status: 404 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Orders API has been removed. Use downloads API instead.' }, { status: 404 })
}