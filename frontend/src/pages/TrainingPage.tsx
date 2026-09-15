import React, { useState, useEffect, useMemo } from 'react'
import {
  GraduationCap,
  RefreshCw,
  AlertOctagon,
  Search,
  Loader2,
  CheckCircle2,
  X,
  Terminal,
} from 'lucide-react'
import { VendorBadge } from '../components/Shared'
import {
  UnknownCommand,
  LearnedMapping,
  MappingPayload,
  listUnknownCommands,
  listLearnedMappings,
  createMapping,
  disableMapping,
  analyzeUnknownCommand
} from '../services/api'

export const SUPPORTED_PARAMETERS = [
  'ssh_enabled',
  'ssh_version',
  'telnet_enabled',
  'http_enabled',
  'https_enabled',
  'logging_enabled',
  'ntp_configured',
  'snmp_secure',
  'login_timeout',
  'password_policy',
  'hostname',
  'vendor',
  'model',
  'serial_number',
  'os_version',
]

export const VALUE_TYPES = ['integer', 'boolean', 'string', 'enum']

interface ReviewModalData {
  command: UnknownCommand
  suggestion?: {
    parameter: string
    value: unknown
    confidence: number
  } | null
}

export function TrainingPage() {
  const [unknownCommands, setUnknownCommands] = useState<UnknownCommand[]>([])
  const [learnedMappings, setLearnedMappings] = useState<LearnedMapping[]>([])
  const [activeTab, setActiveTab] = useState<'unknown' | 'mappings'>('unknown')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [reviewModal, setReviewModal] = useState<ReviewModalData | null>(null)
  const [isSavingMapping, setIsSavingMapping] = useState(false)
  const [analyzingCommandId, setAnalyzingCommandId] = useState<number | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [unknownRes, mappingsRes] = await Promise.all([
        listUnknownCommands(),
        listLearnedMappings(),
      ])
      setUnknownCommands(unknownRes)
      setLearnedMappings(mappingsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load training telemetry')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDisableMapping = async (id: number) => {
    try {
      await disableMapping(id)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable mapping')
    }
  }

  const handleSaveMapping = async (payload: MappingPayload) => {
    setIsSavingMapping(true)
    try {
      await createMapping(payload)
      setReviewModal(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mapping')
    } finally {
      setIsSavingMapping(false)
    }
  }

  const handleAnalyzeCommand = async (cmd: UnknownCommand) => {
    setAnalyzingCommandId(cmd.id ?? null)
    setAnalysisError(null)
    try {
      const response = await analyzeUnknownCommand(cmd.command, cmd.vendor || 'unknown', '')
      if (response.error) {
        setAnalysisError(response.error)
      } else {
        // Open review modal with Gemini's suggestion
        setReviewModal({
          command: cmd,
          suggestion: {
            parameter: response.normalized_action || 'unknown',
            value: response.value || '',
            confidence: response.confidence
          }
        })
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzingCommandId(null)
    }
  }

  const filteredUnknown = useMemo(() => {
    if (!searchQuery.trim()) return unknownCommands
    const q = searchQuery.toLowerCase()
    return unknownCommands.filter(
      (c) =>
        c.command.toLowerCase().includes(q) ||
        (c.vendor || '').toLowerCase().includes(q)
    )
  }, [unknownCommands, searchQuery])

  const filteredMappings = useMemo(() => {
    if (!searchQuery.trim()) return learnedMappings
    const q = searchQuery.toLowerCase()
    return learnedMappings.filter(
      (m) =>
        m.command_pattern.toLowerCase().includes(q) ||
        m.normalized_parameter.toLowerCase().includes(q) ||
        (m.vendor || '').toLowerCase().includes(q)
    )
  }, [learnedMappings, searchQuery])

  return (
    <div className="space-y-6">
      {/* Top Architecture Banner */}
      <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-status-success">
              <GraduationCap size={16} />
              Adaptive Knowledge Architecture
            </div>
            <h1 className="text-lg font-bold text-text-primary mt-1">
              Deterministic & Learned Rule Registry
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Review unknown syntax, train new parameter extractors, and manage active rule mappings persisted in SQLite
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-secondary hover:bg-surface-border border border-surface-border text-text-primary text-xs font-semibold transition-colors"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Precedence Banner */}
        <div className="mt-4 p-3 rounded bg-surface-secondary border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <span className="text-text-secondary whitespace-nowrap">Resolution Priority:</span>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-status-success font-bold">1. Deterministic Parser</span>
            <span className="text-text-secondary">&rarr;</span>
            <span className="text-brand-bright font-bold">2. Learned Mappings</span>
            <span className="text-text-secondary">&rarr;</span>
            <span className="text-text-primary">3. AI Suggestion</span>
            <span className="text-text-secondary">&rarr;</span>
            <span className="text-text-secondary">4. Unknown</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-status-critical/10 border border-status-critical/30 text-status-critical text-xs flex items-center gap-2">
          <AlertOctagon size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex border-b border-surface-border">
        <button
          onClick={() => setActiveTab('unknown')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'unknown'
              ? 'border-brand-primary text-brand-bright'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Unresolved Commands</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              unknownCommands.length > 0
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30 font-bold'
                : 'bg-surface-secondary text-text-secondary'
            }`}
          >
            {unknownCommands.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('mappings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'mappings'
              ? 'border-brand-primary text-brand-bright'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Learned Mappings Catalog</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-secondary text-text-primary">
            {learnedMappings.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Unresolved Commands */}
      {activeTab === 'unknown' && (
        <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-border">
            <div>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Unresolved Command Syntax
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Commands detected during configuration parsing that require administrative machine-teaching
              </p>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Filter commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded bg-black/50 border border-surface-border text-xs text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:outline-none w-48"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 size={24} className="animate-spin text-brand-bright" />
              </div>
            ) : filteredUnknown.length === 0 ? (
              <div className="py-12 text-center text-text-secondary text-xs">
                <CheckCircle2 size={32} className="mx-auto text-status-success mb-2" />
                <div className="font-semibold text-text-primary">All Syntax Resolved</div>
                <p className="text-text-secondary mt-0.5">No pending unknown commands require machine-teaching.</p>
              </div>
            ) : (
              filteredUnknown.map((cmd, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-surface-border bg-surface-panel p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-brand-primary/50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <VendorBadge vendor={cmd.vendor} />
                      <span className="text-[11px] font-mono text-text-secondary">
                        Audit #{cmd.audit_id || 'N/A'} &bull; Line {cmd.line_number || 'N/A'}
                      </span>
                    </div>

                    <pre className="font-mono text-xs font-semibold text-status-success bg-black/50 p-2 rounded border border-surface-border overflow-x-auto">
                      {cmd.command}
                    </pre>

                    {cmd.ai_suggestion && (
                      <div className="text-[11px] text-text-secondary flex items-center gap-1.5 font-mono">
                        <span>AI Suggestion:</span>
                        <strong className="text-brand-bright">{cmd.ai_suggestion.parameter}</strong>
                        <span>&rarr;</span>
                        <strong className="text-status-success">{String(cmd.ai_suggestion.value)}</strong>
                        <span className="text-text-secondary text-[10px]">
                          ({Math.round(cmd.ai_suggestion.confidence * 100)}% confidence)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => handleAnalyzeCommand(cmd)}
                      disabled={analyzingCommandId === cmd.id}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-bright font-bold border border-brand-primary/30 text-xs transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {analyzingCommandId === cmd.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Terminal size={14} />
                      )}
                      <span>Analyze with Gemini</span>
                    </button>
                    {cmd.ai_suggestion ? (
                      <button
                        onClick={() => {
                          const valType = typeof cmd.ai_suggestion!.value === 'number' ? 'integer' : typeof cmd.ai_suggestion!.value === 'boolean' ? 'boolean' : 'string';
                          handleSaveMapping({
                            command_pattern: cmd.command,
                            normalized_parameter: cmd.ai_suggestion!.parameter,
                            value_type: valType,
                            vendor: cmd.vendor || 'unknown',
                            description: `Auto-approved: ${cmd.ai_suggestion!.parameter}`,
                            confidence: 1.0,
                            enabled: true,
                          })
                        }}
                        disabled={isSavingMapping}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded bg-status-success hover:bg-status-success/80 text-black font-bold text-xs transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        <span>Approve & Learn</span>
                      </button>
                    ) : null}
                    <button
                      onClick={() => setReviewModal({ command: cmd, suggestion: cmd.ai_suggestion })}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded bg-surface-secondary hover:bg-surface-border text-text-primary font-bold border border-surface-border text-xs transition-colors whitespace-nowrap"
                    >
                      <GraduationCap size={14} />
                      <span>Manual Review</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Learned Mappings Catalog */}
      {activeTab === 'mappings' && (
        <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-border">
            <div>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Learned Rule Catalog (SQLite)
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Active mappings taught to the engine that take precedence over AI suggestions
              </p>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Filter mappings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded bg-black/50 border border-surface-border text-xs text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:outline-none w-48"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 size={24} className="animate-spin text-brand-bright" />
              </div>
            ) : filteredMappings.length === 0 ? (
              <div className="py-12 text-center text-text-secondary text-xs">
                No learned mappings recorded yet. Teach unresolved commands to populate the rules engine.
              </div>
            ) : (
              filteredMappings.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-surface-border bg-surface-panel p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-brand-primary/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <pre className="font-mono text-xs font-semibold text-text-primary bg-black/50 px-2.5 py-1 rounded border border-surface-border">
                        {m.command_pattern}
                      </pre>
                      <span className="text-text-secondary text-xs">&rarr;</span>
                      <span className="font-mono text-xs font-bold text-brand-bright bg-brand-primary/10 border border-brand-primary/30 px-2.5 py-1 rounded">
                        {m.normalized_parameter}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-secondary font-mono">
                      <VendorBadge vendor={m.vendor} />
                      <span>Type: <strong className="text-text-primary">{m.value_type}</strong></span>
                      <span>Confidence: <strong className="text-status-success">{Math.round(m.confidence * 100)}%</strong></span>
                      {m.enabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-status-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-text-secondary">
                          <span className="h-1.5 w-1.5 rounded-full bg-text-secondary" />
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>

                  {m.enabled && (
                    <button
                      onClick={() => handleDisableMapping(m.id)}
                      className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded bg-surface-secondary hover:bg-status-critical/20 hover:text-status-critical border border-surface-border text-text-primary text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      Disable Rule
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Review & Teach Modal */}
      {reviewModal && (
        <ReviewMappingModal
          data={reviewModal}
          onClose={() => setReviewModal(null)}
          onSave={handleSaveMapping}
          isSaving={isSavingMapping}
        />
      )}
    </div>
  )
}

function ReviewMappingModal({
  data,
  onClose,
  onSave,
  isSaving,
}: {
  data: ReviewModalData
  onClose: () => void
  onSave: (payload: MappingPayload) => void
  isSaving: boolean
}) {
  const [parameter, setParameter] = useState(
    SUPPORTED_PARAMETERS.includes(data.suggestion?.parameter || '')
      ? data.suggestion!.parameter
      : ''
  )
  const [valueType, setValueType] = useState('integer')
  const [value, setValue] = useState(
    data.suggestion?.value !== undefined ? String(data.suggestion.value) : ''
  )
  const [description, setDescription] = useState('')
  
  const initialVendor = data.command.vendor || 'unknown'
  const validVendors = ['cisco', 'fortinet', 'paloalto', 'juniper', 'aruba', 'checkpoint']
  const [vendor, setVendor] = useState(
    validVendors.includes(initialVendor) ? initialVendor : ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let parsedVal: unknown = value
    if (valueType === 'integer') {
      parsedVal = parseInt(value, 10) || 0
    } else if (valueType === 'boolean') {
      parsedVal = value.toLowerCase() === 'true' || value === '1'
    }

    if (!parameter) {
      alert("A valid normalized parameter is required before enabling a new compliance rule.")
      return
    }

    onSave({
      command_pattern: data.command.command,
      normalized_parameter: parameter,
      value_type: valueType,
      vendor: vendor || 'unknown',
      description: description || `Admin mapped: ${parameter} -> ${value}`,
      confidence: 1.0,
      enabled: true,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-lg border border-surface-border bg-surface-panel p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <GraduationCap size={16} className="text-brand-bright" />
            Review & Teach Command Syntax
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Raw Command Syntax
            </label>
            <pre className="p-2.5 rounded bg-black/50 border border-surface-border font-mono text-status-success text-xs overflow-x-auto">
              {data.command.command}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Target Vendor
              </label>
              <select
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className={`w-full rounded bg-black/50 border ${vendor ? 'border-surface-border text-text-primary' : 'border-status-warning text-status-warning'} p-2 font-mono text-xs focus:border-brand-primary focus:outline-none`}
              >
                <option value="">-- Vendor could not be confidently determined --</option>
                <option value="cisco">Cisco IOS</option>
                <option value="fortinet">Fortinet FortiOS</option>
                <option value="paloalto">Palo Alto PAN-OS</option>
                <option value="juniper">Juniper Junos</option>
                <option value="aruba">Aruba AOS-CX</option>
                <option value="checkpoint">Check Point Gaia</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Value Type
              </label>
              <select
                value={valueType}
                onChange={(e) => setValueType(e.target.value)}
                className="w-full rounded bg-black/50 border border-surface-border p-2 text-text-primary font-mono text-xs focus:border-brand-primary focus:outline-none"
              >
                {VALUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Normalized Security Parameter
            </label>
            <select
              value={parameter}
              onChange={(e) => setParameter(e.target.value)}
              className={`w-full rounded bg-black/50 border ${parameter ? 'border-surface-border text-text-primary' : 'border-status-warning text-status-warning'} p-2 font-mono text-xs focus:border-brand-primary focus:outline-none`}
            >
              <option value="">-- No matching normalized security parameter found --</option>
              {SUPPORTED_PARAMETERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Extracted Value
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 2, true, false, 5"
              required
              className="w-full rounded bg-black/50 border border-surface-border p-2 text-text-primary font-mono text-xs focus:border-brand-primary focus:outline-none placeholder:text-text-secondary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Description Note (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standard enterprise SSH version parameter"
              className="w-full rounded bg-black/50 border border-surface-border p-2 text-text-primary text-xs focus:border-brand-primary focus:outline-none placeholder:text-text-secondary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border mt-5">
            {!parameter && (
              <span className="text-status-warning text-[10px] self-center mr-auto">
                A valid normalized parameter is required to save.
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !parameter}
              className="flex items-center gap-2 px-4 py-2 rounded bg-brand-primary hover:bg-brand-bright disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <SaveIcon size={14} />}
              Save & Enable Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SaveIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}
