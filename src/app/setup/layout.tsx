import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "WISEVEO — Setup",
  description: "Configure seu ambiente WISEVEO",
}

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      {children}
    </div>
  )
}
