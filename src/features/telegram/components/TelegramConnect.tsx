"use client"
import { useTelegramConnection } from "../hooks/useTelegramConnection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

export function TelegramConnect() {
  const { status, loading, connect, disconnect } = useTelegramConnection();

  if (loading) return null;

  const isConfigured = status?.configured !== false;

  return (
    <Card className="border-0 shadow-none border-b rounded-none mb-6">
      <CardHeader className="px-0">
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-500" />
          <CardTitle>Integração Telegram</CardTitle>
        </div>
        <CardDescription>
          Conecte sua conta do Telegram para receber resumos financeiros diretamente no seu chat, fazendo perguntas de forma natural.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {!isConfigured ? (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            A integração com o Telegram não está ativada no servidor. Para utilizar este recurso, configure as variáveis <code className="font-mono text-xs">TELEGRAM_BOT_TOKEN</code> e <code className="font-mono text-xs">TELEGRAM_BOT_USERNAME</code> no seu arquivo <code className="font-mono text-xs">.env</code>.
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border inline-block">
              Conectado como <span className="font-semibold text-foreground">@{status.username || "Usuário"}</span>
            </p>
            <div>
                <Button type="button" variant="destructive" onClick={disconnect} size="sm">Desconectar Telegram</Button>
            </div>
          </div>
        ) : (
          <Button type="button" onClick={connect} className="bg-[#2AABEE] text-white hover:bg-[#229ED9]">
            Conectar com Telegram
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
