import * as React from "react"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  /**
   * Versão monocromática (currentColor) para fundos coloridos ou sólidos.
   * Fora disso o símbolo usa as cores congeladas da marca: teal no claro,
   * cian no escuro. Recolorir fora da família F5 é proibido (Brand Book, cap. 04).
   */
  mono?: boolean
}

/**
 * Brand mark WISEVEO (N4 do sistema de logo).
 * Geometria congelada: W 5,20 13,36 24,15 35,36 43,20 + estrela (35.5, 8),
 * grid 48, stroke 4,5, terminações round. Mínimo 16px.
 * Fonte: docs/branding/brand-book/logos/symbol-{light,dark}.svg
 */
export function Logo({ size = 24, mono = false, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <polyline
        points="5,20 13,36 24,15 35,36 43,20"
        fill="none"
        stroke={mono ? "currentColor" : undefined}
        className={mono ? undefined : "stroke-[#0F766E] dark:stroke-[#22D3EE]"}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="35.5"
        cy="8"
        r="3.5"
        fill={mono ? "currentColor" : undefined}
        className={mono ? undefined : "fill-[#134E4A] dark:fill-[#67E8F9]"}
      />
    </svg>
  )
}
