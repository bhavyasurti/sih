import { useState, useMemo, useEffect } from 'react'
import {
  FileCode2,
  Download,
  Search,
  Check,
  Copy,
  Terminal,
  Loader2,
} from 'lucide-react'
import { AuditResult } from '../types'
import { PageKey } from '../components/Sidebar'
import {
  VendorBadge,
  StatusPill,
  SeverityBadge,
  RiskBadge,
} from '../components/Shared'

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
  const [activeTab, setActiveTab] = useState<'findings' | 'parameters' | 'telemetry'>('findings')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FAIL' | 'PASS' | 'UNKNOWN'>('ALL')
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // AI State
  const [loadingAi, setLoadingAi] = useState<{ id: string; type: 'review' | 'apply' | 'teach' } | null>(null)
  const [aiReviews, setAiReviews] = useState<Record<string, any>>({})
  const [editedSolutions, setEditedSolutions] = useState<Record<string, string>>({})
  const [aiUnknownCommands, setAiUnknownCommands] = useState<Record<string, any>>({})

  if (!result) {
    return (
      <div className="rounded-lg border border-surface-border bg-surface-panel p-12 text-center">
        <FileCode2 size={36} className="mx-auto text-text-secondary mb-3" />
        <h2 className="text-base font-bold text-text-primary">No Active Audit Results</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
          Please run a new configuration audit or select a past audit from the archive.
        </p>
        <button
          onClick={() => onNavigate('audit')}
          className="mt-4 px-4 py-2 rounded bg-brand-primary hover:bg-brand-bright text-white font-bold text-xs transition-colors"
        >
          Go to Configuration Audits
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

  useEffect(() => {
    if (!result) return;
    
    let isMounted = true;
    const processFindings = async () => {
      const findingsToReview = result.findings?.filter(f => (f.status === 'FAIL' || f.status === 'UNKNOWN')) || [];
      if (findingsToReview.length === 0) return;
      
      const configContext = Object.entries(result.security || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
      
      // Set loading state for all at once
      const initialStates: Record<string, any> = {};
      findingsToReview.forEach(f => {
        if (!aiReviews[f.control_id]) {
            initialStates[f.control_id] = { loading: true };
        }
      });
      if (Object.keys(initialStates).length > 0) {
        setAiReviews(prev => ({ ...prev, ...initialStates }));
      }
      
      try {
        const { reviewFindingsBatch } = await import('../services/api');
        const response = await reviewFindingsBatch(findingsToReview, configContext);
        
        if (!isMounted) return;
        
        if (response.error) {
           // Graceful degradation for 429 or other batch errors
           const errorStates: Record<string, any> = {};
           findingsToReview.forEach(f => {
               errorStates[f.control_id] = { error: 'AI REVIEW TEMPORARILY UNAVAILABLE' };
           });
           setAiReviews(prev => ({ ...prev, ...errorStates }));
        } else {
           const reviews = response.reviews || {};
           const newSolutions: Record<string, string> = {};
           
           setAiReviews(prev => ({ ...prev, ...reviews }));
           
           // Initialize edited solutions
           Object.entries(reviews).forEach(([cId, review]: [string, any]) => {
               if (review.proposed_solution) {
                   newSolutions[cId] = review.proposed_solution;
               }
           });
           setEditedSolutions(prev => ({ ...prev, ...newSolutions }));
        }
      } catch (err) {
        if (isMounted) {
          const errorStates: Record<string, any> = {};
          findingsToReview.forEach(f => {
             errorStates[f.control_id] = { error: 'AI REVIEW TEMPORARILY UNAVAILABLE' };
          });
          setAiReviews(prev => ({ ...prev, ...errorStates }));
        }
      }
    };

    const processUnknowns = async () => {
        const unknowns = result.unknown_commands || [];
        for (const cmd of unknowns) {
            if (!isMounted) break;
            
            setAiUnknownCommands(prev => {
                if (prev[cmd.command]) return prev;
                return { ...prev, [cmd.command]: { loading: true } };
            });

            try {
                const { analyzeUnknownCommand } = await import('../services/api');
                const vendorStr = result.vendor || result.device.vendor || 'unknown';
                const response = await analyzeUnknownCommand(cmd.command, vendorStr, "");
                if (isMounted) {
                    setAiUnknownCommands(prev => ({ ...prev, [cmd.command]: response }));
                }
            } catch (err) {
                if (isMounted) {
                    setAiUnknownCommands(prev => ({ ...prev, [cmd.command]: { error: 'AI REVIEW TEMPORARILY UNAVAILABLE' } }));
                }
            }
        }
    }

    processFindings();
    processUnknowns();
    
    return () => { isMounted = false };
  }, [result]);

  const handleTeach = async (command: string, mappingInfo: any) => {
    if (!result) return;
    setLoadingAi({ id: command, type: 'teach' });
    try {
      const { createMapping } = await import('../services/api');
      const vendorStr = result.vendor || result.device.vendor || 'unknown';
      await createMapping({
        vendor: vendorStr,
        command_pattern: command,
        normalized_parameter: mappingInfo.parameter || 'unknown',
        value_type: typeof mappingInfo.value === 'boolean' ? 'boolean' : 'string',
        description: 'Auto-taught from AI Auditor',
        confidence: mappingInfo.confidence || 0.8,
        enabled: true
      });
      setAiUnknownCommands(prev => ({ ...prev, [command]: { ...prev[command], taught: true } }));
    } catch (err) {
      console.error(err);
      alert('Failed to teach mapping');
    } finally {
      setLoadingAi(null);
    }
  }

  // Filtered Findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (statusFilter !== 'ALL' && f.status !== statusFilter) return false
      if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = f.title.toLowerCase().includes(q)
        const matchId = f.control_id.toLowerCase().includes(q)
        const matchDesc = (f.description || '').toLowerCase().includes(q)
        if (!matchTitle && !matchId && !matchDesc) return false
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
    } catch (err) {
      console.error(err)
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
      
      // Clear AI review state for this finding after applying
      setAiReviews(prev => {
        const next = { ...prev }
        delete next[finding.control_id]
        return next
      })
    } catch (err) {
      console.error(err)
      alert("Failed to apply remediation: " + (err as Error).message)
    } finally {
      setLoadingAi(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Device Overview Banner */}
      <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-brand-bright bg-brand-primary/10 border border-brand-primary/30 px-1.5 py-0.5 rounded">
                AUDIT #{result.audit_id}
              </span>
              <VendorBadge vendor={result.vendor || result.device.vendor} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-secondary border border-surface-border text-text-primary">
                {result.framework || 'CIS'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-text-primary mt-2 flex items-center gap-2">
              <span>{result.device.hostname || 'Network Device (Hostname Undetected)'}</span>
            </h1>
            <div className="mt-1 flex flex-wrap gap-4 text-xs text-text-secondary font-mono">
              <span>Model: <strong className="text-text-primary">{result.device.model || 'Standard Device'}</strong></span>
              <span>OS Version: <strong className="text-text-primary">{result.device.os_version || 'Detected'}</strong></span>
              <span>Detection Confidence: <strong className="text-brand-bright">{Math.round(result.vendor_confidence * 100)}%</strong></span>
            </div>
          </div>

          {/* Compliance Score Block */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                Compliance Score
              </div>
              <div className="text-3xl font-extrabold font-mono text-brand-bright">
                {score}%
              </div>
              <div className="mt-0.5">
                <RiskBadge risk={result.overall_risk} />
              </div>
            </div>

            <button
              onClick={() => onDownloadReport(result.audit_id)}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 rounded bg-brand-primary hover:bg-brand-bright text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Strip */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7 text-xs">
          <div className="p-2.5 rounded bg-surface-secondary border border-surface-border">
            <div className="text-[10px] font-semibold uppercase text-text-secondary">Total Controls</div>
            <div className="mt-1 text-lg font-bold font-mono text-text-primary">
              {result.total_controls || findings.length}
            </div>
          </div>
          <div className="p-2.5 rounded bg-status-success/10 border border-status-success/30">
            <div className="text-[10px] font-semibold uppercase text-status-success">Passed</div>
            <div className="mt-1 text-lg font-bold font-mono text-status-success">
              {summary.passed ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-status-critical/10 border border-status-critical/30">
            <div className="text-[10px] font-semibold uppercase text-status-critical">Failed</div>
            <div className="mt-1 text-lg font-bold font-mono text-status-critical">
              {summary.failed ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30">
            <div className="text-[10px] font-semibold uppercase text-amber-500">Unknown</div>
            <div className="mt-1 text-lg font-bold font-mono text-amber-500">
              {summary.unknown ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-status-critical/10 border border-status-critical/30">
            <div className="text-[10px] font-semibold uppercase text-status-critical">Critical</div>
            <div className="mt-1 text-lg font-bold font-mono text-status-critical">
              {summary.critical ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30">
            <div className="text-[10px] font-semibold uppercase text-amber-500">High</div>
            <div className="mt-1 text-lg font-bold font-mono text-amber-500">
              {summary.high ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30">
            <div className="text-[10px] font-semibold uppercase text-amber-500">Medium</div>
            <div className="mt-1 text-lg font-bold font-mono text-amber-500">
              {summary.medium ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-surface-border">
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'findings'
              ? 'border-brand-primary text-brand-bright'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Control Findings & Remediation ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('parameters')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'parameters'
              ? 'border-brand-primary text-brand-bright'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Normalized Parameters ({securityEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'telemetry'
              ? 'border-brand-primary text-brand-bright'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Parser & AI Telemetry ({unknownCommands.length} Unknowns)
        </button>
      </div>

      {/* Tab 1: Findings & Remediation */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-surface-border bg-surface-panel">
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold uppercase text-text-secondary mr-1.5">
                Status:
              </span>
              {(['ALL', 'FAIL', 'PASS', 'UNKNOWN'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    statusFilter === st
                      ? 'bg-brand-primary text-white font-bold'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-surface-border'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold uppercase text-text-secondary mr-1.5">
                Severity:
              </span>
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sv) => (
                <button
                  key={sv}
                  onClick={() => setSeverityFilter(sv)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    severityFilter === sv
                      ? 'bg-surface-border text-text-primary'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-surface-border'
                  }`}
                >
                  {sv}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search controls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded bg-black/50 border border-surface-border text-xs text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:outline-none w-44"
              />
            </div>
          </div>

          {/* Findings Technical List */}
          <div className="space-y-3">
            {filteredFindings.length === 0 ? (
              <div className="p-8 rounded-lg border border-surface-border bg-surface-panel text-center text-text-secondary text-xs">
                No compliance findings matching current filter criteria.
              </div>
            ) : (
              filteredFindings.map((finding) => {
                const isFail = finding.status === 'FAIL'
                const hasRemediation = Boolean(finding.remediation)

                return (
                  <div
                    key={finding.control_id}
                    className={`rounded-lg border p-4 bg-surface-panel transition-all ${
                      isFail
                        ? 'border-status-critical/60 shadow-sm'
                        : finding.status === 'PASS'
                        ? 'border-surface-border'
                        : 'border-amber-500/60'
                    }`}
                  >
                    {/* Finding Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-surface-border/80">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-bright bg-brand-primary/10 border border-brand-primary/30 px-1.5 py-0.5 rounded">
                          {finding.control_id}
                        </span>
                        <h3 className="text-sm font-bold text-text-primary">{finding.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={finding.severity} />
                        <StatusPill status={finding.status} />
                      </div>
                    </div>

                    {/* Metadata Matrix */}
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:gap-2 sm:grid-cols-3 text-xs bg-surface-secondary/50 p-2.5 rounded border border-surface-border/50">
                      <div className="flex flex-col">
                        <span className="text-text-secondary text-[11px] block mb-0.5">Expected State:</span>
                        <span className="font-mono text-text-primary font-medium break-words">
                          {String(finding.expected ?? 'Configured')}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-text-secondary text-[11px] block mb-0.5">Observed State:</span>
                        <span className={`font-mono font-medium break-words ${isFail ? 'text-status-critical' : 'text-text-primary'}`}>
                          {String(finding.actual ?? 'Not observed')}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-text-secondary text-[11px] block mb-0.5">Evidence:</span>
                        <span className="font-mono text-text-primary break-all" title={finding.evidence}>
                          {finding.evidence || 'No direct evidence'}
                        </span>
                      </div>
                    </div>

                    {/* Deterministic Remediation CLI Box */}
                    {hasRemediation && finding.remediation && (
                      <div className="mt-3 rounded border border-surface-border bg-black/20 p-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-surface-border/60">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-status-success flex items-center gap-1.5">
                            <Terminal size={13} />
                            Deterministic CLI Remediation ({finding.vendor || result.vendor})
                          </span>
                          <button
                            onClick={() => handleCopy(finding.control_id, finding.remediation!)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-secondary hover:bg-surface-border text-text-primary text-[10px] font-semibold transition-colors border border-surface-border"
                          >
                            {copiedId === finding.control_id ? (
                              <>
                                <Check size={11} className="text-status-success" />
                                <span className="text-status-success">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy CLI</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="mt-2 font-mono text-xs text-status-success whitespace-pre-wrap overflow-x-auto leading-relaxed bg-black/40 p-2.5 rounded border border-surface-border/80">
                          {finding.remediation}
                        </pre>
                      </div>
                    )}

                    {/* AI Review Block */}
                    {(isFail || finding.status === 'UNKNOWN') && (
                      <div className="mt-3 rounded border-2 border-brand-primary bg-brand-primary/10 p-3 shadow-lg shadow-brand-primary/5">
                        <div className="text-[11px] font-bold uppercase text-brand-bright mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Terminal size={12} />
                            AI Auditor Review
                          </span>
                        </div>
                        
                        {(!aiReviews[finding.control_id] || aiReviews[finding.control_id].loading) ? (
                          <div className="flex items-center gap-2 text-brand-bright text-xs font-bold font-mono py-2">
                            <Loader2 size={14} className="animate-spin" />
                            Analyzing finding with Gemini...
                          </div>
                        ) : aiReviews[finding.control_id].error ? (
                          <div className="flex flex-col gap-2">
                            <div className="text-status-critical text-xs font-bold uppercase">
                              {aiReviews[finding.control_id].error}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              <button onClick={() => {
                                setAiReviews(prev => { const n = {...prev}; delete n[finding.control_id]; return n; });
                                handleReviewFinding(finding);
                              }} className="w-full sm:w-auto px-3 py-1.5 text-[10px] bg-brand-primary/20 border border-brand-primary/50 hover:bg-brand-primary/40 rounded text-brand-bright font-bold uppercase tracking-wider transition-colors text-center">
                                Retry AI Review
                              </button>
                              <button className="w-full sm:w-auto px-3 py-1.5 text-[10px] bg-surface-secondary border border-surface-border hover:bg-surface-border rounded text-text-primary font-bold uppercase tracking-wider transition-colors text-center">
                                Fix Manually
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-text-primary space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-black/30 p-2.5 rounded border border-surface-border">
                                <strong className="text-brand-bright block mb-1">What Happened:</strong>
                                {aiReviews[finding.control_id].what_happened}
                              </div>
                              <div className="bg-black/30 p-2.5 rounded border border-surface-border">
                                <strong className="text-status-critical block mb-1">Why It's a Problem:</strong>
                                {aiReviews[finding.control_id].why_is_this_a_problem}
                              </div>
                            </div>
                            
                            <div className="bg-black/30 p-2.5 rounded border border-surface-border">
                              <strong className="text-brand-bright block mb-1">Verification Steps:</strong>
                              {aiReviews[finding.control_id].verification_steps}
                            </div>
                            
                            <div>
                              <strong className="text-brand-bright block mb-1 text-sm">Proposed Solution:</strong>
                              <p className="mb-2 text-text-secondary">{aiReviews[finding.control_id].what_should_we_do}</p>
                              <p className="mb-2 text-text-secondary"><em>Why this solution works: </em>{aiReviews[finding.control_id].why_this_solution}</p>
                              
                              <textarea 
                                value={editedSolutions[finding.control_id] || ''}
                                onChange={(e) => setEditedSolutions(prev => ({ ...prev, [finding.control_id]: e.target.value }))}
                                className="w-full h-32 bg-black font-mono text-status-success p-3 rounded border border-brand-primary/40 focus:border-brand-bright focus:outline-none focus:ring-1 focus:ring-brand-bright resize-y"
                              />
                              <p className="text-[10px] text-text-secondary mt-1">You may edit the CLI commands above before applying.</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2 border-t border-brand-primary/30">
                              <span className="text-[10px] text-text-secondary">Confidence: {Math.round(aiReviews[finding.control_id].confidence * 100)}% | Source: {aiReviews[finding.control_id].source}</span>
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-3 py-2 sm:py-1.5 text-[10px] bg-surface-secondary border border-surface-border hover:bg-surface-border rounded text-text-primary font-bold uppercase tracking-wider transition-colors text-center">
                                  Fix Manually
                                </button>
                                <button
                                  onClick={() => {
                                    setAiReviews(prev => { const n = {...prev}; delete n[finding.control_id]; return n; })
                                  }}
                                  className="w-full sm:w-auto px-3 py-2 sm:py-1.5 text-[10px] bg-status-critical/20 border border-status-critical/50 hover:bg-status-critical/40 rounded text-status-critical font-bold uppercase tracking-wider transition-colors text-center"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleApplyRemediation(finding)}
                                  disabled={loadingAi?.id === finding.control_id && loadingAi.type === 'apply'}
                                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded bg-brand-primary hover:bg-brand-bright text-white font-bold text-[10px] uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50"
                                >
                                  {loadingAi?.id === finding.control_id && loadingAi.type === 'apply' ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                  Approve & Apply
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

      {/* Tab 2: Normalized Security Parameters */}
      {activeTab === 'parameters' && (
        <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
          <div className="pb-3 border-b border-surface-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Normalized Security Model
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Vendor-agnostic parameter mappings extracted by the deterministic parser
              </p>
            </div>
            <span className="text-xs font-mono text-brand-bright bg-brand-primary/10 px-2 py-1 rounded border border-brand-primary/30">
              {securityEntries.length} Parameters
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[500px] whitespace-nowrap text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Security Parameter</th>
                  <th className="pb-2.5 font-medium">Type</th>
                  <th className="pb-2.5 font-medium">Observed Value</th>
                  <th className="pb-2.5 font-medium text-right">Parameter Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-mono">
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
                    <tr key={key} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="py-2.5 font-semibold text-text-primary">{key}</td>
                      <td className="py-2.5 text-text-secondary">{valType}</td>
                      <td className="py-2.5 text-brand-bright">{String(val ?? 'null')}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            status === 'CONFIGURED'
                              ? 'bg-status-success/10 text-status-success border border-status-success/30'
                              : status === 'DISABLED'
                              ? 'bg-status-critical/10 text-status-critical border border-status-critical/30'
                              : status === 'DETECTED'
                              ? 'bg-brand-primary/10 text-brand-bright border border-brand-primary/30'
                              : 'bg-surface-secondary text-text-secondary border border-surface-border'
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

      {/* Tab 3: Parser & AI Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border border-surface-border bg-surface-panel">
              <div className="text-[10px] font-bold uppercase text-text-secondary">AI Provider</div>
              <div className="mt-2 text-base font-bold text-text-primary font-mono">
                {aiStatus.provider || 'Google GenAI (Gemini)'}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-surface-border bg-surface-panel">
              <div className="text-[10px] font-bold uppercase text-text-secondary">AI Engine Status</div>
              <div className="mt-2 text-base font-bold text-brand-bright font-mono">
                {aiStatus.status}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-surface-border bg-surface-panel">
              <div className="text-[10px] font-bold uppercase text-text-secondary">Fallback Engaged</div>
              <div className="mt-2 text-base font-bold font-mono text-text-primary">
                {aiStatus.fallback_used ? 'Yes (Deterministic)' : 'No'}
              </div>
            </div>
            <div className="p-4 rounded-lg border border-surface-border bg-surface-panel">
              <div className="text-[10px] font-bold uppercase text-text-secondary">Detection Confidence</div>
              <div className="mt-2 text-base font-bold font-mono text-status-success">
                {Math.round(result.vendor_confidence * 100)}%
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
            <div className="pb-3 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Unresolved Command Lines
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Commands that were isolated for review and machine-teaching
                </p>
              </div>
              <button
                onClick={() => onNavigate('training')}
                className="text-xs font-semibold text-brand-primary hover:text-brand-bright flex items-center gap-1"
              >
                Go to Training Center &rarr;
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {unknownCommands.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-secondary">
                  No unknown commands isolated from this audit. All lines were parsed deterministically.
                </div>
              ) : (
                unknownCommands.map((cmd, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 p-3 rounded bg-surface-secondary border border-surface-border text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                        <span className="text-text-primary break-all mr-4">{cmd.command}</span>
                        <span className="text-[10px] text-text-secondary flex-shrink-0">
                          Line {cmd.line_number || 'N/A'}
                        </span>
                    </div>
                    {/* AI Learning Block */}
                    <div className="mt-2 pl-3 border-l-2 border-brand-primary">
                        {(!aiUnknownCommands[cmd.command] || aiUnknownCommands[cmd.command].loading) ? (
                            <div className="flex items-center gap-2 text-brand-bright text-[10px] font-bold">
                                <Loader2 size={12} className="animate-spin" />
                                Analyzing command with Gemini...
                            </div>
                        ) : aiUnknownCommands[cmd.command].error ? (
                            <div className="text-status-critical text-[10px] font-bold uppercase">{aiUnknownCommands[cmd.command].error}</div>
                        ) : aiUnknownCommands[cmd.command].taught ? (
                            <div className="text-status-success text-[10px] font-bold uppercase flex items-center gap-1">
                                <Check size={12} /> Taught Successfully
                            </div>
                        ) : (
                            <div className="text-[10px] text-text-secondary">
                                <span className="block text-brand-bright font-bold mb-1 uppercase tracking-wider">Gemini Proposed Learning:</span>
                                <div>Parameter: <strong className="text-text-primary">{aiUnknownCommands[cmd.command].parameter}</strong></div>
                                <div>Value: <strong className="text-text-primary">{String(aiUnknownCommands[cmd.command].value)}</strong></div>
                                <div>Confidence: <strong className="text-brand-bright">{Math.round((aiUnknownCommands[cmd.command].confidence || 0) * 100)}%</strong></div>
                                
                                <div className="mt-2 flex gap-2">
                                    <button 
                                      onClick={() => handleTeach(cmd.command, aiUnknownCommands[cmd.command])} 
                                      disabled={loadingAi?.id === cmd.command && loadingAi.type === 'teach'}
                                      className="flex items-center gap-1 px-2 py-1 bg-brand-primary hover:bg-brand-bright text-white rounded font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                                    >
                                        {loadingAi?.id === cmd.command && loadingAi.type === 'teach' ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                                        Approve & Teach
                                    </button>
                                    <button className="px-2 py-1 bg-surface-panel text-text-primary rounded border border-surface-border hover:bg-surface-border font-bold uppercase tracking-wider transition-colors">
                                      Edit & Teach
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
