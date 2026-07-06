import { useState, useEffect } from "react";
import type { TelegramConnectionStatus, TelegramConnectResponse } from "../types/telegram.types";

export function useTelegramConnection() {
  const [status, setStatus] = useState<TelegramConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/telegram/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Polling for updates
    return () => clearInterval(interval);
  }, []);

  const connect = async () => {
    try {
      const res = await fetch("/api/telegram/connect", { method: "POST" });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        console.error("Connect failed:", res.status, error);
        alert(`Erro ao conectar: ${error.error || res.statusText}`);
        return;
      }
      const data: TelegramConnectResponse = await res.json();
      if (!data.deepLink) {
        console.error("No deepLink in response:", data);
        alert("Erro: link de conexão não foi gerado");
        return;
      }
      window.location.href = data.deepLink;
    } catch (err) {
      console.error("Connect error:", err);
      alert(`Erro ao conectar: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const disconnect = async () => {
    await fetch("/api/telegram/disconnect", { method: "DELETE" });
    await fetchStatus();
  };

  return { status, loading, connect, disconnect };
}
