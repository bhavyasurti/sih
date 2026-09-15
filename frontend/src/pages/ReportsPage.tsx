import React, { useState, useMemo } from 'react'
import { FileText, RefreshCw, Info, Search, Loader2, Download } from 'lucide-react'
import { AuditSummaryItem } from '../types'
import { StatusPill } from '../components/Shared'

export function ReportsPage({
  audits,
  onViewAudit,
  onDownloadReport,
  isDownloading,
  onRefresh,
}: {
  audits: AuditSummaryItem[]
  onViewAudit: (auditId: number, framework?: string) => void
  onDownloadReport: (auditId: number) => void
  isDownloading: boolean
  onRefresh: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const handleDownload = async (id: number) => {
    setDownloadingId(id)
    try {
      await onDownloadReport(id)
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredAudits = useMemo(() => {
    if (!searchQuery.trim()) return audits
    const q = searchQuery.toLowerCase()
    return audits.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        String(a.id).includes(q) ||
        (a.framework || '').toLowerCase().includes(q)
    )
  }, [audits, searchQuery])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-brand-primary" />
              Compliance Reports Archive
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Export formal PDF audit documentation generated via the local ReportLab reporting engine
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-border/50 hover:bg-surface-border border border-surface-border text-text-primary text-xs font-semibold transition-colors"
          >
            <RefreshCw size={13} />
            <span>Refresh Archive</span>
          </button>
        </div>

        <div className="mt-4 p-3 rounded bg-surface-primary border border-surface-border/80 text-xs text-text-secondary flex items-center gap-2">
          <Info size={14} className="text-brand-primary flex-shrink-0" />
          <span>
            Reports contain formal executive summaries, compliance matrices, evaluated control evidence, and deterministic multi-vendor remediation command playbooks.
          </span>
        </div>
      </div>

      {/* Reports Table (Document Management Interface) */}
      <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Generated Audit Documents ({filteredAudits.length})
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Click Download PDF to export instant reports for compliance reporting
            </p>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded bg-surface-primary border border-surface-border text-xs text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none w-52 transition-all"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {filteredAudits.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-xs">
              <FileText size={32} className="mx-auto text-text-muted mb-2 opacity-50" />
              <div className="font-semibold text-text-primary">No Reports Available</div>
              <p className="text-text-secondary mt-0.5">Run a configuration audit to generate compliance reports.</p>
            </div>
          ) : (
            <>
            {/* Desktop View */}
            <table className="w-full min-w-[700px] whitespace-nowrap text-left text-xs border-collapse hidden md:table">
              <thead>
                <tr className="border-b border-surface-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Audit ID</th>
                  <th className="pb-2.5 font-medium">Document / Configuration</th>
                  <th className="pb-2.5 font-medium">Framework</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium">Compliance Score</th>
                  <th className="pb-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60 font-mono">
                {filteredAudits.map((audit) => {
                  const score = audit.compliance_score
                  const isCurDownloading = downloadingId === audit.id

                  return (
                    <tr key={audit.id} className="hover:bg-surface-border/20 transition-colors">
                      <td className="py-3 text-text-secondary">#{audit.id}</td>
                      <td className="py-3 font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-brand-primary flex-shrink-0" />
                          <span>{audit.title}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-1.5 py-0.5 rounded bg-surface-border border border-surface-border/50 text-text-secondary text-[10px]">
                          {audit.framework || 'CIS'}
                        </span>
                      </td>
                      <td className="py-3">
                        <StatusPill status={audit.status} />
                      </td>
                      <td className="py-3 font-bold">
                        {score !== null ? (
                          <span
                            className={
                              score >= 80
                                ? 'text-emerald-400'
                                : score >= 50
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            {Math.round(score)}%
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewAudit(audit.id, audit.framework)}
                            className="px-2.5 py-1 rounded bg-surface-border/50 hover:bg-surface-border border border-surface-border text-text-primary text-[11px] font-sans font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(audit.id)}
                            disabled={isCurDownloading}
                            className="flex items-center gap-1.5 px-3 py-1 rounded bg-brand-primary hover:bg-brand-secondary text-white font-sans font-bold text-[11px] transition-colors disabled:opacity-50"
                          >
                            {isCurDownloading ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Download size={12} />
                            )}
                            <span>{isCurDownloading ? 'Generating...' : 'PDF'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredAudits.map((audit) => {
                  const score = audit.compliance_score
                  const isCurDownloading = downloadingId === audit.id

                  return (
                    <div key={audit.id} className="rounded-lg border border-surface-border bg-surface-panel p-4 flex flex-col gap-3 font-mono">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 font-semibold text-text-primary text-xs">
                            <FileText size={14} className="text-brand-primary flex-shrink-0" />
                            <span className="break-words line-clamp-2 whitespace-normal">{audit.title}</span>
                          </div>
                          <span className="text-text-secondary text-[10px]">#{audit.id}</span>
                        </div>
                        <StatusPill status={audit.status} />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-text-secondary">Framework:</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-border border border-surface-border/50 text-text-secondary text-[10px]">
                            {audit.framework || 'CIS'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-bold">
                          <span className="text-text-secondary font-sans font-medium text-[11px]">Score:</span>
                          {score !== null ? (
                            <span
                              className={
                                score >= 80
                                  ? 'text-emerald-400'
                                  : score >= 50
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }
                            >
                              {Math.round(score)}%
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-surface-border/50 mt-1">
                          <button
                            onClick={() => onViewAudit(audit.id, audit.framework)}
                            className="flex-1 flex items-center justify-center py-2 rounded bg-surface-border/50 hover:bg-surface-border border border-surface-border text-text-primary text-xs font-sans font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(audit.id)}
                            disabled={isCurDownloading}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-brand-primary hover:bg-brand-secondary text-white font-sans font-bold text-xs transition-colors disabled:opacity-50"
                          >
                            {isCurDownloading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                            <span>{isCurDownloading ? 'Generating...' : 'Download PDF'}</span>
                          </button>
                      </div>
                    </div>
                  )
                })}
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
