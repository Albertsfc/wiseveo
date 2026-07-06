import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettingsUserId } from "@/features/settings/services/get-settings-user-id";

export const dynamic = "force-dynamic";

export async function GET() {
  const isConfigured = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME);

  const userId = await getSettingsUserId();
  if (!userId) {
    return NextResponse.json({ connected: false, configured: isConfigured }, { status: 401 });
  }

  if (!isConfigured) {
    return NextResponse.json({ connected: false, configured: false });
  }

  const connection = await prisma.telegramConnection.findUnique({
    where: { userId },
  });

  if (!connection || !connection.isActive) {
    return NextResponse.json({ connected: false, configured: true });
  }

  return NextResponse.json({
    connected: true,
    configured: true,
    username: connection.telegramUsername,
    connectedAt: connection.connectedAt.toISOString(),
  });
}
