import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettingsUserId } from "@/features/settings/services/get-settings-user-id";

export async function DELETE() {
  const userId = await getSettingsUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.telegramConnection.delete({
    where: { userId },
  });

  return NextResponse.json({ success: true });
}
