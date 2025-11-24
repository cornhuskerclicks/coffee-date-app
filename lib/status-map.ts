// Status mapping for niche_user_state.status field
// These values MUST match the CHECK constraint in the database

export const STATUS_VALUES = {
  RESEARCH: "Research",
  SHORTLISTED: "Shortlisted",
  OUTREACH: "Outreach in Progress",
  DEMO: "Coffee Date Demo",
  WIN: "Win",
} as const

export type StatusValue = (typeof STATUS_VALUES)[keyof typeof STATUS_VALUES]

// Default status for new niche records
export const DEFAULT_STATUS: StatusValue = STATUS_VALUES.RESEARCH

// Status display configuration
export const STATUS_CONFIG: Record<StatusValue, { label: string; color: string }> = {
  [STATUS_VALUES.RESEARCH]: {
    label: "Research",
    color: "bg-cyan-500/20 text-cyan-400",
  },
  [STATUS_VALUES.SHORTLISTED]: {
    label: "Shortlisted",
    color: "bg-yellow-500/20 text-yellow-400",
  },
  [STATUS_VALUES.OUTREACH]: {
    label: "Outreach in Progress",
    color: "bg-blue-500/20 text-blue-400",
  },
  [STATUS_VALUES.DEMO]: {
    label: "Coffee Date Demo",
    color: "bg-purple-500/20 text-purple-400",
  },
  [STATUS_VALUES.WIN]: {
    label: "Win",
    color: "bg-green-500/20 text-green-400",
  },
}

// Get all status options for dropdowns
export function getStatusOptions(): StatusValue[] {
  return Object.values(STATUS_VALUES)
}

// Get status display config
export function getStatusConfig(status: StatusValue | null) {
  if (!status) {
    return {
      label: "Not Started",
      color: "bg-gray-500/20 text-gray-400",
    }
  }
  return STATUS_CONFIG[status]
}
