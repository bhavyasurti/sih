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
  Sliders,
  Plus,
  Trash2,
  Check,
  Cpu,
  Sparkles,
  ArrowRight
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

  // Form state for creating mapping in modal
  const [targetParam, setTargetParam] = useState(SUPPORTED_PARAMETERS[0])
  const [targetType, setTargetType] = useState('boolean')
  const [targetVal, setTargetVal] = useState('true')

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

  const handleOpenReview = async (cmd: UnknownCommand) => {
    setReviewModal({ command: cmd, suggestion: null })
    setAnalyzingCommandId(cmd.id ?? null)
    setAnalysisError(null)

    try {
      const suggestion = await analyzeUnknownCommand(cmd.command, cmd.vendor)
      setReviewModal({ command: cmd, suggestion })
      if (suggestion.parameter) {
        setTargetParam(suggestion.parameter)
      }
      if (suggestion.value !== undefined) {
        setTargetVal(String(suggestion.value))
      }
    } catch {
      setAnalysisError('Automatic suggestion unavailable. You can manually assign the mapping below.')
    } finally {
      setAnalyzingCommandId(null)
    }
  }

  const handleSaveMapping = async () => {
    if (!reviewModal) return
    setIsSavingMapping(true)
    try {
      const payload: MappingPayload = {
        vendor: reviewModal.command.vendor || 'generic',
        command_pattern: reviewModal.command.command,
        normalized_parameter: targetParam,
        value_type: targetType,
        description: `Learned mapping for ${reviewModal.command.command}`,
        confidence: 1.0,
        enabled: true,
      }

      await createMapping(payload)
      setReviewModal(null)
      await loadData()
    } catch (err) {
      alert('Failed to save mapping: ' + (err as Error).message)
    } finally {
      setIsSavingMapping(false)
    }
  }

  const handleToggleMapping = async (id: number) => {
    try {
      await disableMapping(id)
      await loadData()
    } catch (err) {
      alert('Failed to update mapping: ' + (err as Error).message)
    }
  }

  const filteredUnknowns = useMemo(() => {
    if (!searchQuery.trim()) return unknownCommands
    const q = searchQuery.toLowerCase()
    return unknownCommands.filter(
      (u) =>
        u.command.toLowerCase().includes(q) ||
        (u.vendor ? u.vendor.toLowerCase().includes(q) : false)
    )
  }, [unknownCommands, searchQuery])

  const filteredMappings = useMemo(() => {
    if (!searchQuery.trim()) return learnedMappings
    const q = searchQuery.toLowerCase()
    return learnedMappings.filter(
      (m) =>
        m.command_pattern.toLowerCase().includes(q) ||
        m.normalized_parameter.toLowerCase().includes(q) ||
        (m.vendor ? m.vendor.toLowerCase().includes(q) : false)
    )
  }, [learnedMappings, searchQuery])

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. EDITORIAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#D7DCE5]">
        <div>
          <div className="eyebrow mb-2">Adaptive Parser Intelligence</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0A282D] tracking-tight">
            Training Center & Rules Registry
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B60] mt-1">
            Review unrecognized command syntax isolated by the engine and maintain persistent learned parameter rules.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="btn btn--soft text-xs"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 bg-white rounded-3xl border border-[#D7DCE5] shadow-xs">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#D97706] uppercase block mb-1">
            Isolated Unrecognized Syntax
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-display font-extrabold text-[#0A282D]">
              {unknownCommands.length}
            </span>
            <span className="text-xs text-[#7E8F95] font-mono">tokens awaiting mapping</span>
          </div>
          <p className="text-xs text-[#4A5B60] mt-2">
            Vendor syntax variations that cannot be deterministically evaluated without auditor confirmation.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#D7DCE5] shadow-xs">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#3DB663] uppercase block mb-1">
            Authoritative Learned Mappings
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-display font-extrabold text-[#3DB663]">
              {learnedMappings.filter((m) => m.enabled).length}
            </span>
            <span className="text-xs text-[#7E8F95] font-mono">active SQLite rules</span>
          </div>
          <p className="text-xs text-[#4A5B60] mt-2">
            Trained parameter patterns applied automatically to all future audit runs across the fleet.
          </p>
        </div>
      </div>

      {/* 3. TABS BAR */}
      <div className="border-b border-[#D7DCE5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-8 font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('unknown')}
            className={`pb-3.5 border-b-2 transition-colors ${
              activeTab === 'unknown'
                ? 'border-[#3DB663] text-[#0A282D]'
                : 'border-transparent text-[#7E8F95] hover:text-[#0A282D]'
            }`}
          >
            Unknown Syntax ({unknownCommands.length})
          </button>
          <button
            onClick={() => setActiveTab('mappings')}
            className={`pb-3.5 border-b-2 transition-colors ${
              activeTab === 'mappings'
                ? 'border-[#3DB663] text-[#0A282D]'
                : 'border-transparent text-[#7E8F95] hover:text-[#0A282D]'
            }`}
          >
            Learned Mappings Database ({learnedMappings.length})
          </button>
        </div>

        <div className="relative pb-2">
          <Search size={13} className="absolute left-3.5 top-2.5 text-[#7E8F95]" />
          <input
            type="text"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3.5 py-1.5 bg-white border border-[#D7DCE5] rounded-full text-xs text-[#0A282D] placeholder:text-[#7E8F95] focus:outline-none focus:border-[#3DB663] w-full sm:w-56"
          />
        </div>
      </div>

      {/* 4. CONTENT TABLE: UNKNOWN COMMANDS */}
      {activeTab === 'unknown' && (
        <div className="bg-white border border-[#D7DCE5] rounded-3xl shadow-xs overflow-hidden">
          {filteredUnknowns.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[#7E8F95]">
              {searchQuery
                ? 'No unknown commands matching current search query.'
                : 'No unknown commands isolated. All parsed syntax is fully mapped!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#D7DCE5] bg-[#F2F3F7] text-[11px] font-bold uppercase tracking-wider text-[#7E8F95]">
                    <th className="py-3.5 px-5">Vendor</th>
                    <th className="py-3.5 px-5">Isolated Syntax Command</th>
                    <th className="py-3.5 px-5 text-center">Frequency</th>
                    <th className="py-3.5 px-5 text-right">Human Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7DCE5]">
                  {filteredUnknowns.map((cmd) => (
                    <tr key={cmd.id} className="hover:bg-[#F2F3F7]/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <VendorBadge vendor={cmd.vendor} />
                      </td>
                      <td className="py-3.5 px-5 font-bold text-[#0A282D]">
                        <span className="p-2 bg-[#F2F3F7] border border-[#D7DCE5] rounded-xl break-all">
                          {cmd.command}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center text-[#4A5B60]">
                        {cmd.line_number ? `L#${cmd.line_number}` : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleOpenReview(cmd)}
                          className="btn btn--green text-xs px-3.5 py-1.5"
                        >
                          <span>Review & Map</span>
                          <span className="btn-ico">
                            <ArrowRight size={11} className="stroke-[2.5]" />
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. CONTENT TABLE: LEARNED MAPPINGS */}
      {activeTab === 'mappings' && (
        <div className="bg-white border border-[#D7DCE5] rounded-3xl shadow-xs overflow-hidden">
          {filteredMappings.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[#7E8F95]">
              No learned mappings in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#D7DCE5] bg-[#F2F3F7] text-[11px] font-bold uppercase tracking-wider text-[#7E8F95]">
                    <th className="py-3.5 px-5">Vendor</th>
                    <th className="py-3.5 px-5">Command Pattern</th>
                    <th className="py-3.5 px-5">Normalized Parameter</th>
                    <th className="py-3.5 px-5">Type</th>
                    <th className="py-3.5 px-5">Confidence</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7DCE5]">
                  {filteredMappings.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F2F3F7]/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <VendorBadge vendor={m.vendor} />
                      </td>
                      <td className="py-3.5 px-5 font-bold text-[#0A282D] max-w-xs truncate">
                        {m.command_pattern}
                      </td>
                      <td className="py-3.5 px-5 text-[#3DB663] font-bold">
                        {m.normalized_parameter}
                      </td>
                      <td className="py-3.5 px-5 text-[#7E8F95]">
                        {m.value_type}
                      </td>
                      <td className="py-3.5 px-5 text-[#1E6E37] font-semibold">
                        {Math.round((m.confidence || 1) * 100)}%
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.enabled
                              ? 'bg-[#EDF8F1] text-[#1E6E37] border border-[#BFE7CB]'
                              : 'bg-[#F2F3F7] text-[#7E8F95] border border-[#D7DCE5]'
                          }`}
                        >
                          {m.enabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleToggleMapping(m.id)}
                          className="px-3 py-1 text-[11px] uppercase font-bold text-[#E11D48] hover:underline"
                        >
                          {m.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL: REVIEW & TEACH MAPPING DIALOG */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-[#0A282D]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#D7DCE5] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#D7DCE5]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3DB663] block">
                  Machine-Teaching Console
                </span>
                <h3 className="font-display text-lg font-bold text-[#0A282D]">
                  Map Unknown Syntax to Canonical Parameter
                </h3>
              </div>
              <button
                onClick={() => setReviewModal(null)}
                className="p-1.5 rounded-full hover:bg-[#F2F3F7] text-[#7E8F95] hover:text-[#0A282D] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Command Specimen */}
            <div className="p-4 bg-[#F2F3F7] border border-[#D7DCE5] rounded-2xl font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-[#7E8F95] block mb-1">
                Syntax Under Evaluation:
              </span>
              <div className="font-bold text-[#0A282D] break-all">{reviewModal.command.command}</div>
              <div className="mt-1 text-[11px] text-[#4A5B60]">
                Vendor: <strong className="uppercase">{reviewModal.command.vendor}</strong>
              </div>
            </div>

            {/* Gemini AI Recommendation */}
            {analyzingCommandId ? (
              <div className="p-4 bg-[#EDF8F1] border border-[#BFE7CB] rounded-2xl flex items-center gap-2 text-xs font-mono text-[#1E6E37]">
                <Loader2 size={14} className="animate-spin text-[#3DB663]" />
                <span>Consulting Gemini for canonical parameter classification...</span>
              </div>
            ) : reviewModal.suggestion ? (
              <div className="p-4 bg-[#EDF8F1] border border-[#BFE7CB] rounded-2xl text-xs font-mono">
                <span className="text-[10px] font-bold uppercase text-[#1E6E37] block mb-1">
                  Gemini Classification Recommendation:
                </span>
                <div className="text-[#0A282D]">
                  Parameter: <strong className="text-[#3DB663]">{reviewModal.suggestion.parameter}</strong>
                </div>
                <div className="text-[#0A282D]">
                  Assigned Value: <strong className="text-[#1E6E37]">{String(reviewModal.suggestion.value)}</strong>
                </div>
                <div className="text-[10px] text-[#7E8F95] mt-1">
                  Confidence: {Math.round(reviewModal.suggestion.confidence * 100)}%
                </div>
              </div>
            ) : null}

            {/* Form Fields */}
            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase text-[#7E8F95] block mb-1">
                  Canonical Parameter
                </label>
                <select
                  value={targetParam}
                  onChange={(e) => setTargetParam(e.target.value)}
                  className="w-full p-2.5 bg-[#F2F3F7] border border-[#D7DCE5] rounded-xl text-[#0A282D] focus:outline-none focus:border-[#3DB663]"
                >
                  {SUPPORTED_PARAMETERS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#7E8F95] block mb-1">
                    Value Type
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full p-2.5 bg-[#F2F3F7] border border-[#D7DCE5] rounded-xl text-[#0A282D] focus:outline-none focus:border-[#3DB663]"
                  >
                    {VALUE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#7E8F95] block mb-1">
                    Normalized Value
                  </label>
                  <input
                    type="text"
                    value={targetVal}
                    onChange={(e) => setTargetVal(e.target.value)}
                    className="w-full p-2.5 bg-[#F2F3F7] border border-[#D7DCE5] rounded-xl text-[#0A282D] focus:outline-none focus:border-[#3DB663]"
                  />
                </div>
              </div>
            </div>

            {/* Dialog Action Buttons */}
            <div className="pt-4 border-t border-[#D7DCE5] flex items-center justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setReviewModal(null)}
                className="px-4 py-2 border border-[#D7DCE5] rounded-full text-[#4A5B60] hover:text-[#0A282D] font-bold uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMapping}
                disabled={isSavingMapping}
                className="btn btn--green text-xs px-4 py-2 disabled:opacity-50"
              >
                {isSavingMapping ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} className="stroke-[3]" />}
                <span>Authorize & Save Mapping</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
