import { useState, useMemo, useEffect, useRef } from 'react'
import {
  FileCode2,
  Download,
  Search,
  Check,
  Copy,
  Terminal,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Sliders,
  ExternalLink,
  ChevronDown,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Edit3,
  Sparkles,
  ArrowRight,
  GitCommit
} from 'lucide-react'
import { AuditResult } from '../types'
import { PageKey } from '../components/Sidebar'
import {
  VendorBadge,
  StatusPill,
  SeverityBadge,
  RiskBadge,
} from '../components/Shared'
import { usePageEntrance } from '../utils/motion'

export function ResultsPage({
  result,
  onAuditUpdated,
  onDownloadReport,
  isDownloading,
  onNavigate,
}: {
  result: AuditResult | null
  onAuditUpdated?: (updated: AuditResult) => void
  onDownloadReport: (auditId: number) => void
  isDownloading: boolean
  onNavigate: (page: PageKey) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  usePageEntrance(containerRef, '.animate-reveal', 0.05)

  const [activeTab, setActiveTab] = useState<'findings' | 'parameters' | 'telemetry'>('findings')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FAIL' | 'PASS' | 'UNKNOWN'>('ALL')
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // AI Remediation Review State
  const [loadingAi, setLoadingAi] = useState<{ id: string; type: 'review' | 'apply' | 'teach' } | null>(null)
  const [aiReviews, setAiReviews] = useState<Record<string, any>>({})
  const [editedSolutions, setEditedSolutions] = useState<Record<string, string>>({})

  if (!result) {
    return (
      <div className="bg-white border border-[#D7DCE5] rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xs my-12">
        <div className="w-16 h-16 rounded-2xl bg-[#F2F3F7] border border-[#D7DCE5] flex items-center justify-center mx-auto mb-4 text-[#7E8F95]">
          <FileCode2 size={32} />
        </div>
        <h2 className="text-xl font-display font-bold text-[#0A282D]">
          No Active Audit Evaluation
        </h2>
        <p className="text-xs sm:text-sm text-[#4A5B60] mt-2 leading-relaxed">
          Select an audit record from the archive or upload a new configuration to inspect compliance findings.
        </p>
        <button
          onClick={() => onNavigate('audit')}
          className="mt-6 btn btn--green text-xs"
        >
          <span>Go to Configuration Audits</span>
          <span className="btn-ico">
            <ArrowRight size={13} className="stroke-[2.5]" />
          </span>
        </button>
      </div>
    )
  }

  const score = typeof result.score === 'number' ? result.score : 0
  const summary = result.summary ?? {}
  const findings = result.findings ?? []
  const securityEntries = Object.entries(result.security ?? {})
  const unknownCommands = result.unknown_commands ?? []
  const aiStatus = result.ai ?? {
    enabled: false,
    provider: 'gemini',
    status: 'unavailable',
    fallback_used: false,
  }

  // Automatic batch AI review for non-compliant controls
  useEffect(() => {
    if (!result) return

    let isMounted = true
    const processFindings = async () => {
      const findingsToReview = result.findings?.filter(f => (f.status === 'FAIL' || f.status === 'UNKNOWN')) || []
      if (findingsToReview.length === 0) return

      const configContext = Object.entries(result.security || {}).map(([k, v]) => `${k}: ${v}`).join(', ')

      const initialStates: Record<string, any> = {}
      findingsToReview.forEach(f => {
        if (!aiReviews[f.control_id]) {
          initialStates[f.control_id] = { loading: true }
        }
      })
      if (Object.keys(initialStates).length > 0) {
        setAiReviews(prev => ({ ...prev, ...initialStates }))
      }

      try {
        const { reviewFindingsBatch } = await import('../services/api')
        const response = await reviewFindingsBatch(findingsToReview, configContext)

        if (!isMounted) return

        if (response.error) {
          const errorStates: Record<string, any> = {}
          findingsToReview.forEach(f => {
            errorStates[f.control_id] = { error: 'AI REVIEW TEMPORARILY UNAVAILABLE' }
          })
          setAiReviews(prev => ({ ...prev, ...errorStates }))
        } else {
          const reviews = response.reviews || {}
          const newSolutions: Record<string, string> = {}

          setAiReviews(prev => ({ ...prev, ...reviews }))

          Object.entries(reviews).forEach(([cId, review]: [string, any]) => {
            if (review.proposed_solution) {
              newSolutions[cId] = review.proposed_solution
            }
          })
          setEditedSolutions(prev => ({ ...prev, ...newSolutions }))
        }
      } catch {
        if (isMounted) {
          const errorStates: Record<string, any> = {}
          findingsToReview.forEach(f => {
            errorStates[f.control_id] = { error: 'AI REVIEW TEMPORARILY UNAVAILABLE' }
          })
          setAiReviews(prev => ({ ...prev, ...errorStates }))
        }
      }
    }

    processFindings()
    return () => {
      isMounted = false
    }
  }, [result?.audit_id])

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (statusFilter !== 'ALL' && f.status !== statusFilter) return false
      if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          f.title.toLowerCase().includes(q) ||
          f.control_id.toLowerCase().includes(q) ||
          (f.evidence && f.evidence.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [findings, statusFilter, severityFilter, searchQuery])

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReviewFinding = async (finding: any) => {
    setLoadingAi({ id: finding.control_id, type: 'review' })
    try {
      const { reviewFinding } = await import('../services/api')
      const configContext = Object.entries(result.security || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      const response = await reviewFinding(finding, configContext)
      setAiReviews(prev => ({ ...prev, [finding.control_id]: response }))
      if (response.proposed_solution) {
        setEditedSolutions(prev => ({ ...prev, [finding.control_id]: response.proposed_solution }))
      }
    } catch {
      setAiReviews(prev => ({ ...prev, [finding.control_id]: { error: 'Service unavailable or rate limited. Please try again.' } }))
    } finally {
      setLoadingAi(null)
    }
  }

  const handleApplyRemediation = async (finding: any) => {
    if (!result.audit_id) return
    setLoadingAi({ id: finding.control_id, type: 'apply' })
    try {
      const { applyRemediation } = await import('../services/api')
      const originalSolution = aiReviews[finding.control_id]?.proposed_solution
      const currentSolution = editedSolutions[finding.control_id]
      const userEdited = originalSolution !== currentSolution

      const expectedState = finding.expected || ''
      const deterministicRemediation = finding.remediation || ''
      const verificationSteps = aiReviews[finding.control_id]?.verification_steps || ''

      const response = await applyRemediation(
        result.audit_id,
        finding.control_id,
        currentSolution,
        userEdited,
        finding.title,
        expectedState,
        deterministicRemediation,
        verificationSteps
      )

      if (onAuditUpdated) {
        onAuditUpdated({
          ...result,
          score: response.new_score,
          findings: response.findings
        })
      }

      setAiReviews(prev => {
        const next = { ...prev }
        delete next[finding.control_id]
        return next
      })
    } catch (err) {
      alert('Failed to apply remediation: ' + (err as Error).message)
    } finally {
      setLoadingAi(null)
    }
  }

  return (
    <div ref={containerRef} className="space-y-8 max-w-7xl mx-auto">
      {/* 1. TOP DEVICE SPECIMEN BANNER */}
      <div className="animate-reveal bg-white border border-[#D7DCE5] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#D7DCE5]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 font-mono">
              <span className="text-xs font-bold text-[#0A282D] bg-[#F2F3F7] px-3 py-1 rounded-full border border-[#D7DCE5]">
                AUDIT #{result.audit_id}
              </span>
              <VendorBadge vendor={result.vendor || result.device.vendor} />
              <span className="text-xs px-3 py-1 rounded-full bg-[#F2F3F7] border border-[#D7DCE5] text-[#4A5B60] font-bold">
                {result.framework || 'CIS'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0A282D] tracking-tight">
              {result.device.hostname || 'Network Infrastructure Device'}
            </h1>
            <div className="mt-2 flex flex-wrap gap-4 text-xs font-mono text-[#4A5B60]">
              <span>Model: <strong className="text-[#0A282D]">{result.device.model || 'Standard Chassis'}</strong></span>
              <span>OS Version: <strong className="text-[#0A282D]">{result.device.os_version || 'Detected'}</strong></span>
              <span>Parser Confidence: <strong className="text-[#3DB663]">{Math.round(result.vendor_confidence * 100)}%</strong></span>
            </div>
          </div>

          {/* Compliance Score & Actions */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7E8F95]">
                Compliance Score
              </div>
              <div className={`text-4xl sm:text-5xl font-display font-extrabold ${score >= 70 ? 'text-[#3DB663]' : 'text-[#E11D48]'}`}>
                {score}%
              </div>
              <div className="mt-1">
                <RiskBadge risk={result.overall_risk} />
              </div>
            </div>

            <button
              onClick={() => onDownloadReport(result.audit_id)}
              disabled={isDownloading}
              className="btn btn--green text-xs px-5 py-2.5 disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} className="stroke-[2.5]" />
              )}
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-[#F2F3F7] border border-[#D7DCE5]">
            <div className="text-[10px] text-[#7E8F95] uppercase font-bold">Total Controls</div>
            <div className="mt-1 text-xl font-bold text-[#0A282D]">
              {result.total_controls || findings.length}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#EDF8F1] border border-[#BFE7CB]">
            <div className="text-[10px] text-[#1E6E37] uppercase font-bold">Passed</div>
            <div className="mt-1 text-xl font-bold text-[#1E6E37]">
              {summary.passed ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FEECEC] border border-[#FCA5A5]">
            <div className="text-[10px] text-[#9F1239] uppercase font-bold">Failed</div>
            <div className="mt-1 text-xl font-bold text-[#9F1239]">
              {summary.failed ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
            <div className="text-[10px] text-[#92400E] uppercase font-bold">Unknown</div>
            <div className="mt-1 text-xl font-bold text-[#92400E]">
              {summary.unknown ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FEECEC] border border-[#FCA5A5]">
            <div className="text-[10px] text-[#9F1239] uppercase font-bold">Critical</div>
            <div className="mt-1 text-xl font-bold text-[#9F1239]">
              {summary.critical ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3]">
            <div className="text-[10px] text-[#BE123C] uppercase font-bold">High</div>
            <div className="mt-1 text-xl font-bold text-[#BE123C]">
              {summary.high ?? 0}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F2F3F7] border border-[#D7DCE5]">
            <div className="text-[10px] text-[#4A5B60] uppercase font-bold">Medium / Low</div>
            <div className="mt-1 text-xl font-bold text-[#4A5B60]">
              {(summary.medium ?? 0) + (summary.low ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="animate-reveal border-b border-[#D7DCE5] flex items-center gap-8 font-mono text-xs uppercase tracking-wider font-bold">
        <button
          onClick={() => setActiveTab('findings')}
          className={`pb-3.5 transition-colors border-b-2 ${
            activeTab === 'findings'
              ? 'border-[#3DB663] text-[#0A282D]'
              : 'border-transparent text-[#7E8F95] hover:text-[#0A282D]'
          }`}
        >
          Compliance Findings ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('parameters')}
          className={`pb-3.5 transition-colors border-b-2 ${
            activeTab === 'parameters'
              ? 'border-[#3DB663] text-[#0A282D]'
              : 'border-transparent text-[#7E8F95] hover:text-[#0A282D]'
          }`}
        >
          Extracted Parameters ({securityEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`pb-3.5 transition-colors border-b-2 ${
            activeTab === 'telemetry'
              ? 'border-[#3DB663] text-[#0A282D]'
              : 'border-transparent text-[#7E8F95] hover:text-[#0A282D]'
          }`}
        >
          Parser Telemetry
        </button>
      </div>

      {/* 3. TAB 1: TECHNICAL FINDINGS & REMEDIATION */}
      {activeTab === 'findings' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white border border-[#D7DCE5] rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs shadow-xs">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#7E8F95] uppercase mr-1">Status:</span>
              {(['ALL', 'FAIL', 'UNKNOWN', 'PASS'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-full uppercase tracking-wider text-[11px] font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-[#0A282D] text-white shadow-xs'
                      : 'bg-[#F2F3F7] text-[#4A5B60] hover:text-[#0A282D]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#7E8F95] uppercase mr-1">Severity:</span>
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sv) => (
                <button
                  key={sv}
                  onClick={() => setSeverityFilter(sv)}
                  className={`px-3 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold transition-all ${
                    severityFilter === sv
                      ? 'bg-[#3DB663] text-white shadow-xs'
                      : 'bg-[#F2F3F7] text-[#4A5B60] hover:text-[#0A282D]'
                  }`}
                >
                  {sv}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7E8F95]" />
              <input
                type="text"
                placeholder="Search control ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#F2F3F7] border border-[#D7DCE5] rounded-full text-xs text-[#0A282D] placeholder:text-[#7E8F95] focus:outline-none focus:border-[#3DB663] w-48 font-mono"
              />
            </div>
          </div>

          {/* Findings List */}
          <div className="space-y-4">
            {filteredFindings.length === 0 ? (
              <div className="bg-white border border-[#D7DCE5] rounded-3xl p-12 text-center text-xs font-mono text-[#7E8F95]">
                No compliance findings matching current filter criteria.
              </div>
            ) : (
              filteredFindings.map((finding) => {
                const isFail = finding.status === 'FAIL'
                const isUnknown = finding.status === 'UNKNOWN'
                const hasRemediation = Boolean(finding.remediation)
                const review = aiReviews[finding.control_id]

                return (
                  <div
                    key={finding.control_id}
                    className={`animate-reveal ui-card-hover bg-white border rounded-3xl p-6 sm:p-7 shadow-xs transition-all ${
                      isFail
                        ? 'border-[#FCA5A5]'
                        : isUnknown
                        ? 'border-[#FDE68A]'
                        : 'border-[#D7DCE5]'
                    }`}
                  >
                    {/* Finding Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#D7DCE5]">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#0A282D] bg-[#F2F3F7] px-3 py-1 rounded-full border border-[#D7DCE5]">
                          {finding.control_id}
                        </span>
                        <h3 className="font-display text-base sm:text-lg font-bold text-[#0A282D]">
                          {finding.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={finding.severity} />
                        <StatusPill status={finding.status} />
                      </div>
                    </div>

                    {/* Metadata Matrix */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F2F3F7] border border-[#D7DCE5] rounded-2xl font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-[#7E8F95] uppercase font-bold block mb-0.5">Expected State:</span>
                        <span className="font-semibold text-[#0A282D] break-words">
                          {String(finding.expected ?? 'Configured')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7E8F95] uppercase font-bold block mb-0.5">Observed State:</span>
                        <span className={`font-semibold break-words ${isFail ? 'text-[#E11D48]' : 'text-[#0A282D]'}`}>
                          {String(finding.actual ?? 'Not observed')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7E8F95] uppercase font-bold block mb-0.5">Evidence Token:</span>
                        <span className="text-[#4A5B60] break-all">
                          {finding.evidence || 'No direct evidence token'}
                        </span>
                      </div>
                    </div>

                    {/* Deterministic Remediation CLI Box & Staged Diff */}
                    {hasRemediation && finding.remediation && (
                      <div className="mt-4 rounded-2xl border border-[#1E4950] bg-[#0A282D] p-5 text-white space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-[10px] uppercase font-bold">
                          <span className="flex items-center gap-1.5 text-[#3DB663]">
                            <Terminal size={12} className="text-[#3DB663]" />
                            Deterministic CLI Remediation ({finding.vendor || result.vendor})
                          </span>
                          <button
                            onClick={() => handleCopy(finding.control_id, finding.remediation!)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                          >
                            {copiedId === finding.control_id ? (
                              <span className="text-[#3DB663]">Copied!</span>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy CLI</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="font-mono text-xs text-[#3DB663] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                          {finding.remediation}
                        </pre>

                        {/* Staged Configuration Diff Preview */}
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#A3B8BC]">
                            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-white">
                              <GitCommit size={13} className="text-[#3DB663]" />
                              Staged Working Configuration Diff
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#3DB663] text-[10px] font-bold border border-white/10">
                              Offline Sandbox Only · Physical Hardware Untouched
                            </span>
                          </div>

                          <div className="space-y-1 font-mono text-xs pt-1">
                            {finding.evidence ? (
                              <div className="diff-line diff-line--del">
                                <span className="diff-sign">-</span>
                                <span className="diff-text">{finding.evidence}</span>
                              </div>
                            ) : (
                              <div className="diff-line diff-line--del">
                                <span className="diff-sign">-</span>
                                <span className="diff-text">[Observed non-compliant setting or omitted requirement]</span>
                              </div>
                            )}
                            {(editedSolutions[finding.control_id] || finding.remediation || '').split('\n').filter((l: string) => l.trim().length > 0).map((line: string, lIdx: number) => (
                              <div key={lIdx} className="diff-line diff-line--add">
                                <span className="diff-sign">+</span>
                                <span className="diff-text">{line}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GEMINI REMEDIATION REVIEW & APPROVAL WORKFLOW */}
                    {(isFail || isUnknown) && (
                      <div className="mt-5 rounded-2xl border border-[#BFE7CB] bg-[#F2FAF5] p-5">
                        <div className="flex items-center justify-between pb-3 border-b border-[#D7DCE5]">
                          <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-[#3DB663]" />
                            <span className="font-mono text-xs font-bold text-[#0A282D] uppercase tracking-wider">
                              AI Remediation Review
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#1E6E37] border border-[#BFE7CB] font-bold">
                              Gemini Structured Output
                            </span>
                          </div>

                          {review && !review.loading && !review.error && (
                            <span className="text-[11px] font-mono text-[#7E8F95]">
                              Confidence: {Math.round((review.confidence || 0.95) * 100)}% &bull; Source: {review.source || 'CIS Benchmark'}
                            </span>
                          )}
                        </div>

                        {(!review || review.loading) ? (
                          <div className="py-6 flex items-center justify-center gap-2 text-xs font-mono text-[#0A282D]">
                            <Loader2 size={16} className="animate-spin text-[#3DB663]" />
                            <span>Synthesizing structured explanation and remediation commands...</span>
                          </div>
                        ) : review.error ? (
                          <div className="py-4 space-y-3">
                            <div className="text-xs font-mono text-[#E11D48] font-bold uppercase">
                              {review.error}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setAiReviews(prev => {
                                    const n = { ...prev }
                                    delete n[finding.control_id]
                                    return n
                                  })
                                  handleReviewFinding(finding)
                                }}
                                className="px-3.5 py-1.5 bg-white border border-[#D7DCE5] hover:border-[#0A282D] text-xs font-mono font-bold text-[#0A282D] uppercase tracking-wider rounded-full transition-colors"
                              >
                                Retry AI Review
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 space-y-4 text-xs font-sans">
                            {/* Two-column Structured Analysis */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-white border border-[#D7DCE5] rounded-2xl shadow-2xs">
                                <strong className="font-mono text-[11px] uppercase tracking-wider text-[#0A282D] block mb-1">
                                  1. Technical Explanation:
                                </strong>
                                <p className="text-[#4A5B60] leading-relaxed">
                                  {review.what_happened}
                                </p>
                              </div>

                              <div className="p-4 bg-white border border-[#D7DCE5] rounded-2xl shadow-2xs">
                                <strong className="font-mono text-[11px] uppercase tracking-wider text-[#E11D48] block mb-1">
                                  2. Risk Assessment:
                                </strong>
                                <p className="text-[#4A5B60] leading-relaxed">
                                  {review.why_is_this_a_problem}
                                </p>
                              </div>
                            </div>

                            {/* Verification Steps */}
                            <div className="p-4 bg-white border border-[#D7DCE5] rounded-2xl font-mono text-xs shadow-2xs">
                              <strong className="text-[11px] uppercase tracking-wider text-[#1E6E37] block mb-1">
                                3. Deterministic Verification Steps:
                              </strong>
                              <p className="text-[#4A5B60] font-sans">
                                {review.verification_steps}
                              </p>
                            </div>

                            {/* Staged Working Configuration Diff Preview */}
                            <div className="p-4 bg-[#0A282D] rounded-2xl border border-[#1E4950] text-white font-mono text-xs space-y-2">
                              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-[#A3B8BC]">
                                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-white">
                                  <GitCommit size={13} className="text-[#3DB663]" />
                                  Staged Working Configuration Diff
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#3DB663] text-[10px] font-bold border border-white/10">
                                  Offline Sandbox Only · Physical Hardware Untouched
                                </span>
                              </div>

                              <div className="space-y-1 pt-1">
                                {finding.evidence ? (
                                  <div className="diff-line diff-line--del">
                                    <span className="diff-sign">-</span>
                                    <span className="diff-text">{finding.evidence}</span>
                                  </div>
                                ) : (
                                  <div className="diff-line diff-line--del">
                                    <span className="diff-sign">-</span>
                                    <span className="diff-text">[Observed non-compliant setting or omitted requirement]</span>
                                  </div>
                                )}
                                {(editedSolutions[finding.control_id] || review.proposed_solution || finding.remediation || '').split('\n').filter((l: string) => l.trim().length > 0).map((line: string, lIdx: number) => (
                                  <div key={lIdx} className="diff-line diff-line--add">
                                    <span className="diff-sign">+</span>
                                    <span className="diff-text">{line}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Proposed Solution & Interactive Code Editor */}
                            <div className="p-4 bg-white border border-[#D7DCE5] rounded-2xl space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <strong className="font-mono text-[11px] uppercase tracking-wider text-[#0A282D]">
                                  4. Proposed Remediation Commands (Auditor Editable):
                                </strong>
                                <span className="text-[10px] text-[#7E8F95] font-mono flex items-center gap-1">
                                  <Edit3 size={11} /> Human review required
                                </span>
                              </div>
                              <p className="text-xs text-[#4A5B60]">
                                {review.what_should_we_do}
                              </p>

                              <textarea
                                value={editedSolutions[finding.control_id] || ''}
                                onChange={(e) =>
                                  setEditedSolutions(prev => ({
                                    ...prev,
                                    [finding.control_id]: e.target.value
                                  }))
                                }
                                rows={4}
                                className="w-full p-3.5 font-mono text-xs bg-[#0A282D] text-[#3DB663] border border-[#1E4950] rounded-xl focus:outline-none focus:border-[#3DB663] leading-relaxed"
                              />
                            </div>

                            {/* Action Authorization Safeguards */}
                            <div className="pt-3 border-t border-[#D7DCE5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                              <span className="text-[11px] text-[#7E8F95]">
                                Authorizing this remediation triggers an instant deterministic re-audit in the working sandbox.
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setAiReviews(prev => {
                                      const n = { ...prev }
                                      delete n[finding.control_id]
                                      return n
                                    })
                                  }}
                                  className="px-3.5 py-1.5 bg-white hover:bg-[#FEECEC] border border-[#D7DCE5] text-[#E11D48] font-bold uppercase tracking-wider rounded-full transition-colors"
                                >
                                  Dismiss
                                </button>

                                <button
                                  onClick={() => handleApplyRemediation(finding)}
                                  disabled={loadingAi?.id === finding.control_id && loadingAi.type === 'apply'}
                                  className="btn btn--green text-xs px-4 py-2 disabled:opacity-50"
                                >
                                  {loadingAi?.id === finding.control_id && loadingAi.type === 'apply' ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Check size={13} className="stroke-[3]" />
                                  )}
                                  <span>Authorize &amp; Re-Audit in Working Sandbox</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 4. TAB 2: NORMALIZED SECURITY PARAMETERS */}
      {activeTab === 'parameters' && (
        <div className="bg-white border border-[#D7DCE5] rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="pb-4 border-b border-[#D7DCE5] flex items-center justify-between">
            <div>
              <h2 className="text-base font-display font-bold text-[#0A282D]">
                Normalized Parameter Specimen
              </h2>
              <p className="text-xs text-[#4A5B60] mt-0.5">
                Strongly-typed vendor-agnostic parameters extracted by AST rule parser.
              </p>
            </div>
            <span className="text-xs font-mono bg-[#EDF8F1] text-[#1E6E37] px-3 py-1 border border-[#BFE7CB] rounded-full font-bold">
              {securityEntries.length} Parameters
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-[#D7DCE5] bg-[#F2F3F7] text-[11px] font-bold uppercase tracking-wider text-[#7E8F95]">
                  <th className="py-3 px-4">Parameter Key</th>
                  <th className="py-3 px-4">Data Type</th>
                  <th className="py-3 px-4">Observed Value</th>
                  <th className="py-3 px-4 text-right">Detection State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7DCE5]">
                {securityEntries.map(([key, val]) => {
                  const valType = typeof val
                  const isNull = val === null || val === undefined
                  const status = isNull
                    ? 'UNKNOWN'
                    : val === true
                    ? 'CONFIGURED'
                    : val === false
                    ? 'DISABLED'
                    : 'DETECTED'

                  return (
                    <tr key={key} className="hover:bg-[#F2F3F7]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0A282D]">{key}</td>
                      <td className="py-3 px-4 text-[#7E8F95]">{valType}</td>
                      <td className="py-3 px-4 text-[#0A282D] font-semibold">{String(val ?? 'null')}</td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            status === 'CONFIGURED'
                              ? 'bg-[#EDF8F1] text-[#1E6E37] border border-[#BFE7CB]'
                              : status === 'DISABLED'
                              ? 'bg-[#FEECEC] text-[#9F1239] border border-[#FCA5A5]'
                              : 'bg-[#F2F3F7] text-[#4A5B60] border border-[#D7DCE5]'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 3: PARSER TELEMETRY */}
      {activeTab === 'telemetry' && (
        <div className="bg-white border border-[#D7DCE5] rounded-3xl p-6 sm:p-8 shadow-xs font-mono text-xs">
          <div className="pb-4 border-b border-[#D7DCE5]">
            <h2 className="text-base font-display font-bold text-[#0A282D]">
              Engine Telemetry & Model Details
            </h2>
            <p className="text-xs text-[#4A5B60] mt-0.5 font-sans">
              Cryptographic integrity, AI provider status, and deterministic re-audit metadata.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[#F2F3F7] border border-[#D7DCE5] rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-[#7E8F95] uppercase block">AI Provider Engine</span>
              <div className="text-sm font-bold text-[#0A282D]">{aiStatus.provider?.toUpperCase()}</div>
              <div className="text-xs text-[#4A5B60]">Status: <strong className="text-[#3DB663]">{aiStatus.status}</strong></div>
              <div className="text-xs text-[#4A5B60]">Fallback Invoked: {String(aiStatus.fallback_used)}</div>
            </div>

            <div className="p-5 bg-[#F2F3F7] border border-[#D7DCE5] rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-[#7E8F95] uppercase block">Syntax Isolation Summary</span>
              <div className="text-sm font-bold text-[#0A282D]">{unknownCommands.length} Unknown Commands</div>
              <div className="text-xs text-[#4A5B60]">Deterministic Rules Mapped: {findings.length} controls</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
