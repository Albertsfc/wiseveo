import Link from "next/link"
import { Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"

export default function CadastroPendentePage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Logo size={20} className="text-current" />
            </div>
            <span className="text-xl font-semibold">WISEVEO</span>
          </div>
        </div>

        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Clock3 className="size-6" />
            </div>
            <CardTitle>Cadastro aguardando aprovação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Sua solicitação foi recebida. Assim que um administrador liberar
              seu cadastro, você poderá fazer login novamente e acessar o sistema.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Voltar para o login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
