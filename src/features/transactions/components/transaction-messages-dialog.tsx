"use client"

import { useCallback, useEffect, useState } from "react"
import { MessageSquare, SendHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import type { SerializedTransaction } from "../types"

interface TransactionMessage {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
  }
}

interface TransactionMessagesDialogProps {
  transaction: SerializedTransaction | null
  onClose: () => void
  onMessageCountChange?: (transactionId: string, count: number) => void
}

const MAX_MESSAGE_LENGTH = 2000

function formatMessageDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function TransactionMessagesDialog({
  transaction,
  onClose,
  onMessageCountChange,
}: TransactionMessagesDialogProps) {
  const monetary = useMonetaryFormattingSafe()
  const transactionId = transaction?.id ?? null
  const [messages, setMessages] = useState<TransactionMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [draft, setDraft] = useState("")
  const [messageToDelete, setMessageToDelete] = useState<TransactionMessage | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!transactionId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/messages`, {
        cache: "no-store",
      })
      if (!res.ok) {
        toast.error("Erro ao carregar mensagens")
        return
      }

      const data = await res.json()
      const nextMessages = (data.messages ?? []) as TransactionMessage[]
      setMessages(nextMessages)
    } catch {
      toast.error("Erro ao carregar mensagens")
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  useEffect(() => {
    if (!transactionId) {
      setMessages([])
      setDraft("")
      setMessageToDelete(null)
      return
    }
    void fetchMessages()
  }, [transactionId, fetchMessages])

  useEffect(() => {
    if (!transactionId) return
    onMessageCountChange?.(transactionId, messages.length)
  }, [messages.length, onMessageCountChange, transactionId])

  const handleSendMessage = useCallback(async () => {
    if (!transactionId) return

    const content = draft.trim()
    if (!content) {
      toast.error("Digite uma mensagem antes de enviar")
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar mensagem")
        return
      }

      const message = data.message as TransactionMessage
      setMessages((prev) => [...prev, message])
      setDraft("")
      toast.success("Mensagem enviada")
    } catch {
      toast.error("Erro ao enviar mensagem")
    } finally {
      setSending(false)
    }
  }, [draft, transactionId])

  const handleConfirmDeleteMessage = useCallback(async () => {
    if (!transactionId || !messageToDelete) return

    setDeleting(true)
    try {
      const res = await fetch(
        `/api/transactions/${transactionId}/messages/${messageToDelete.id}`,
        { method: "DELETE" }
      )
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data.error || "Erro ao apagar mensagem")
        return
      }

      setMessages((prev) => prev.filter((item) => item.id !== messageToDelete.id))
      setMessageToDelete(null)
      toast.success("Mensagem apagada")
    } catch {
      toast.error("Erro ao apagar mensagem")
    } finally {
      setDeleting(false)
    }
  }, [messageToDelete, transactionId])

  const remainingChars = MAX_MESSAGE_LENGTH - draft.length

  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Observações/Mensagens
          </DialogTitle>
          <DialogDescription>
            {transaction?.note || "Transação"} —{" "}
            {transaction ? monetary.formatMonetaryValue(transaction.amount) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!loading && messages.length > 0 && (
            <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              Você tem {messages.length} mensagem
              {messages.length !== 1 ? "ens" : ""} anterior
              {messages.length !== 1 ? "es" : ""} para leitura.
            </div>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem registrada.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mensagens anteriores
              </p>
              <ul className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
              {messages.map((message) => (
                <li key={message.id} className="rounded-md border bg-muted/30 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate font-medium">{message.user.name}</span>
                    <span className="shrink-0">{formatMessageDate(message.createdAt)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                      title="Apagar mensagem"
                      onClick={() => setMessageToDelete(message)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Apagar mensagem</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            </div>
          )}

          <div className="rounded-md border p-2">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={draft}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-24 resize-y border-0 p-1 shadow-none focus-visible:ring-0"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {remainingChars} caractere{remainingChars !== 1 ? "s" : ""} restante
                {remainingChars !== 1 ? "s" : ""}
              </span>
              <Button
                type="button"
                size="sm"
                disabled={sending || !draft.trim()}
                onClick={() => void handleSendMessage()}
              >
                <SendHorizontal className="mr-2 h-4 w-4" />
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <AlertDialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar Mensagem</AlertDialogTitle>
            <AlertDialogDescription>
              Esta mensagem será removida permanentemente.
              {messageToDelete && (
                <span className="mt-2 block whitespace-pre-wrap text-foreground">
                  {messageToDelete.content}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleConfirmDeleteMessage()}
            >
              {deleting ? "Apagando..." : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
