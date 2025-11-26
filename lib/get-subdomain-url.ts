const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "aetherrevive.com"

export function getSubdomainUrl(subdomain: string | null | undefined, path: string): string {
  if (!subdomain) {
    // Fallback to main domain if no subdomain
    return `https://${MAIN_DOMAIN}${path}`
  }
  return `https://${subdomain}.${MAIN_DOMAIN}${path}`
}

export function getQuizUrl(subdomain: string | null | undefined, quizId: string): string {
  return getSubdomainUrl(subdomain, `/quiz/${quizId}`)
}

export function getAuditUrl(subdomain: string | null | undefined, auditId: string): string {
  return getSubdomainUrl(subdomain, `/audit/${auditId}`)
}
