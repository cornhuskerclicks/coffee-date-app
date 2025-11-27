const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "aetherrevive.com"

export function getSubdomainUrl(subdomain: string | null | undefined, path: string): string | null {
  if (!subdomain) {
    // Return null to indicate no subdomain URL - caller should use window.location.origin
    return null
  }
  return `https://${subdomain}.${MAIN_DOMAIN}${path}`
}

export function getQuizUrl(subdomain: string | null | undefined, quizId: string): string | null {
  return getSubdomainUrl(subdomain, `/quiz/${quizId}`)
}

export function getAuditUrl(subdomain: string | null | undefined, auditId: string): string | null {
  return getSubdomainUrl(subdomain, `/audit/${auditId}`)
}
