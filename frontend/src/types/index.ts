export type VendorSelection = 'auto' | 'cisco' | 'fortinet' | 'paloalto' | 'juniper' | 'aruba' | 'checkpoint'
export type FrameworkSelection = 'CIS' | 'NIST' | 'STIG' | 'ISO'

export type AuditResult = {
  audit_id: number
  framework?: string
  score?: number
  overall_risk?: string
  total_controls?: number
  summary?: {
    passed?: number
    failed?: number
    unknown?: number
    critical?: number
    high?: number
    medium?: number
    low?: number
  }
  findings?: Array<{
    control_id: string
    control?: string
    framework: string
    title: string
    status: string
    severity: string
    expected: unknown
    actual: unknown
    current_state?: string
    finding?: string
    description: string
    evidence: string
    remediation: string | null
    remediation_action?: string
    vendor?: string
  }>
  ai?: {
    enabled: boolean
    provider: string
    status: 'used' | 'unavailable' | 'fallback' | 'disabled'
    fallback_used: boolean
  }
  vendor: string
  vendor_confidence: number
  device: {
    hostname: string | null
    vendor: string | null
    model: string | null
    os_version: string | null
  }
  security: Record<string, unknown>
  unknown_commands: Array<{
    command: string
    line_number?: number
  }>
}

export type AuditSummaryItem = {
  id: number
  title: string
  status: string
  framework: string
  compliance_score: number | null
}
