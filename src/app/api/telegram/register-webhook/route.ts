import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Verify secret token (dev/admin protection)
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL not configured' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
          allowed_updates: ['message', 'callback_query'],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({
      ok: true,
      // i18n-ignore: endpoint de ops/deploy (protegido por secret), chamado manualmente por um dev — nunca renderizado em UI
      message: 'Webhook registered successfully',
      webhook_url: webhookUrl,
      telegram_response: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        // i18n-ignore: endpoint de ops/deploy (protegido por secret), chamado manualmente por um dev — nunca renderizado em UI
        error: 'Failed to register webhook',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
