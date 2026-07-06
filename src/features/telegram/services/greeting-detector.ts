const GREETING_REGEX =
  /^(olá|ola|oi+|oie|hello|hi+|hey|bom\s+dia|boa\s+tarde|boa\s+noite|good\s+morning|good\s+evening|good\s+night|e\s+a[ií]|eai|tudo\s+bem|tudo\s+bom|opa|salve|boas|fala)[\s!.,?]*$/i

export function detectGreeting(text: string): boolean {
  return GREETING_REGEX.test(text.trim())
}

export function buildGreetingResponse(message: string, firstName: string): string {
  const msg = message.toLowerCase().trim()
  let salutation: string

  if (/bom\s+dia/i.test(msg)) salutation = "Bom dia"
  else if (/boa\s+tarde/i.test(msg)) salutation = "Boa tarde"
  else if (/boa\s+noite/i.test(msg)) salutation = "Boa noite"
  else {
    const hour = new Date().getHours()
    salutation = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"
  }

  const nameStr = firstName ? `, ${firstName}` : ""
  return `${salutation}${nameStr}! Em que posso te ajudar?`
}
