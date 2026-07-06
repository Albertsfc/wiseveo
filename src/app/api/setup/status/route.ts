import { NextResponse } from "next/server"
import { isSetupComplete } from "@/lib/setup-check"

export async function GET() {
  return NextResponse.json({ setupComplete: isSetupComplete() })
}
