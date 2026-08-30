export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_BASE = API_BASE_URL.replace(/\/api\/?$/, '');

export type UnknownCommand = {
  id?: number
  vendor?: string
  command: string
  audit_id?: number | null
  line_number?: number | null
  ai_suggestion?: {
    parameter: string
    value: unknown
    confidence: number
  } | null
}

export type LearnedMapping = {
  id: number
  vendor: string
  command_pattern: string
  normalized_parameter: string
  value_type: string
  description: string
  confidence: number
  enabled: boolean
  created_at?: string
  updated_at?: string
}

export type MappingPayload = {
  vendor: string
  command_pattern: string
  normalized_parameter: string
  value_type: string
  description?: string
  confidence?: number
  enabled?: boolean
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/api/health`)
  if (!response.ok) {
    throw new Error('Backend unavailable')
  }
  return response.json()
}

export async function uploadAuditFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/api/audits/upload`, {
    method: 'POST',

    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Upload failed')
  }

  return response.json()
}

export async function analyzeAudit(auditId: number, aiEnabled: boolean = true) {
  const response = await fetch(`${API_BASE}/api/audits/${auditId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ai_enabled: aiEnabled }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Analysis failed')
  }

  return response.json()
}

export async function evaluateCompliance(auditId: number, framework: string = 'CIS') {
  const response = await fetch(`${API_BASE}/api/audits/${auditId}/compliance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ framework }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Compliance evaluation failed')
  }

  return response.json()
}

export async function fetchAudit(auditId: number) {
  const response = await fetch(`${API_BASE}/api/audits/${auditId}`)
  if (!response.ok) {
    throw new Error('Audit not found')
  }
  return response.json()
}

export async function listUnknownCommands(): Promise<UnknownCommand[]> {
  const response = await fetch(`${API_BASE}/api/training/unknown`)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to load unknown commands')
  }
  return response.json()
}

export async function listLearnedMappings(): Promise<LearnedMapping[]> {
  const response = await fetch(`${API_BASE}/api/training/mappings`)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to load learned mappings')
  }
  return response.json()
}

export async function createMapping(payload: MappingPayload): Promise<LearnedMapping> {
  const response = await fetch(`${API_BASE}/api/training/mapping`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to save learned mapping')
  }

  return response.json()
}

export async function disableMapping(mappingId: number): Promise<{ id: number; enabled: boolean }> {
  const response = await fetch(`${API_BASE}/api/training/mapping/${mappingId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to disable mapping')
  }

  return response.json()
}

export async function downloadAuditReport(auditId: number, filename?: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/audits/${auditId}/report`)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to download report')
  }
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `compliance_report_audit_${auditId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export async function listAudits(): Promise<Array<{ id: number; title: string; status: string; framework: string; compliance_score: number | null }>> {
  const response = await fetch(`${API_BASE}/api/audits`)
  if (!response.ok) {
    throw new Error('Failed to list audits')
  }
  return response.json()
}

