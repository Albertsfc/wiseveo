import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSettingsUserId } from "@/features/settings/services/get-settings-user-id";
import crypto from "crypto";

export async function POST() {
  const t = await getTranslations("api");

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_BOT_USERNAME) {
    return NextResponse.json({ error: t("telegram.notConfigured") }, { status: 503 });
  }

  try {
    const userId = await getSettingsUserId();
    if (!userId) {
      console.error("[Telegram Connect] No userId found");
      return NextResponse.json({ error: "Unauthorized - no user session" }, { status: 401 });
    }

    console.log("[Telegram Connect] Creating token for userId:", userId);

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.telegramPendingToken.create({
      data: { token, userId, expiresAt },
    });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "WiseVeoBot";
    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    console.log("[Telegram Connect] Success - deepLink:", deepLink);
    return NextResponse.json({ token, deepLink });
  } catch (error) {
    console.error("[Telegram Connect] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : t("errors.internalError") },
      { status: 500 }
    );
  }
}
