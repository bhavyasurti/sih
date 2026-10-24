import React, { useState, useMemo } from 'react'
import { FileText, RefreshCw, Search, Loader2, Download, ExternalLink, Calendar, ShieldCheck, ArrowRight } from 'lucide-react'
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

  const compliantCount = audits.filter(
    (a) => a.compliance_score !== null && a.compliance_score >= 70
  ).length

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. EDITORIAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#D7DCE5]">
        <div>
          <div className="eyebrow mb-2">Formal Audit Records</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0A282D] tracking-tight">
            Compliance Reports Archive
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B60] mt-1">
            Formal technical and executive compliance audits formatted for regulatory submission and board review.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="btn btn--soft text-xs"
        >
          <RefreshCw size={13} />
          <span>Refresh Archive</span>
        </button>
      </div>

      {/* 2. STATS SUMMARY ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-3xl border border-[#D7DCE5] shadow-xs">
          <div className="flex items-center justify-between pb-2 text-[#7E8F95] font-mono text-[10px] uppercase font-bold">
            <span>Total Formal Reports</span>
            <FileText size={16} className="text-[#0284C7]" />
          </div>
          <div className="mt-2 text-3xl font-display font-extrabold text-[#0A282D]">
            {audits.length}
          </div>
          <div className="text-xs text-[#4A5B60] mt-1 font-mono">
            Cryptographically signed audit artifacts
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#D7DCE5] shadow-xs">
          <div className="flex items-center justify-between pb-2 text-[#7E8F95] font-mono text-[10px] uppercase font-bold">
            <span>Compliant Audits</span>
            <ShieldCheck size={16} className="text-[#3DB663]" />
          </div>
          <div className="mt-2 text-3xl font-display font-extrabold text-[#3DB663]">
            {compliantCount}
          </div>
          <div className="text-xs text-[#4A5B60] mt-1 font-mono">
            Score &ge; 70% passing threshold
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#D7DCE5] shadow-xs">
          <div className="flex items-center justify-between pb-2 text-[#7E8F95] font-mono text-[10px] uppercase font-bold">
            <span>Export Formats</span>
            <Download size={16} className="text-[#7E8F95]" />
          </div>
          <div className="mt-2 text-3xl font-display font-extrabold text-[#0A282D]">
            PDF / ReportLab
          </div>
          <div className="text-xs text-[#4A5B60] mt-1 font-mono">
            Executive & technical findings breakdown
          </div>
        </div>
      </div>

      {/* 3. REPORTS TABLE */}
      <div className="bg-white border border-[#D7DCE5] rounded-3xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#D7DCE5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-display font-bold text-[#0A282D]">
              Generated Compliance Audits
            </h2>
            <p className="text-xs text-[#4A5B60] mt-0.5">
              Select any report to inspect live findings or download the official PDF.
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E8F95]" />
            <input
              type="text"
              placeholder="Filter by title, ID, framework..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-1.5 text-xs font-mono bg-[#F2F3F7] border border-[#D7DCE5] rounded-full text-[#0A282D] placeholder:text-[#7E8F95] focus:outline-none focus:border-[#3DB663] w-full sm:w-64"
            />
          </div>
        </div>

        {filteredAudits.length === 0 ? (
          <div className="p-12 text-center text-[#7E8F95] font-mono text-xs">
            No compliance reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-[#D7DCE5] bg-[#F2F3F7] text-[11px] font-bold uppercase tracking-wider text-[#7E8F95]">
                  <th className="py-3.5 px-5">Report ID</th>
                  <th className="py-3.5 px-5">Device / Configuration Title</th>
                  <th className="py-3.5 px-5">Baseline</th>
                  <th className="py-3.5 px-5">Generation Date</th>
                  <th className="py-3.5 px-5 text-center">Score</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7DCE5]">
                {filteredAudits.map((a) => {
                  const isDownloadingThis = downloadingId === a.id
                  const score = a.compliance_score
                  const isPass = score !== null && score >= 70

                  return (
                    <tr key={a.id} className="hover:bg-[#F2F3F7]/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#0A282D]">#{a.id}</td>
                      <td className="py-3.5 px-5 font-sans font-semibold text-[#0A282D] truncate max-w-xs">
                        {a.title}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F2F3F7] border border-[#D7DCE5] text-[#4A5B60] text-[10px] font-bold">
                          {a.framework || 'CIS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-[#7E8F95]">
                        {a.created_at
                          ? new Date(a.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold">
                        {score !== null ? (
                          <span className={isPass ? 'text-[#3DB663]' : 'text-[#E11D48]'}>
                            {score}%
                          </span>
                        ) : (
                          <span className="text-[#7E8F95]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <StatusPill status={a.status} />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2 font-mono">
                          <button
                            onClick={() => onViewAudit(a.id, a.framework || 'CIS')}
                            className="px-3 py-1 bg-white hover:bg-[#F2F3F7] border border-[#D7DCE5] rounded-full text-[#0A282D] font-bold text-[11px] uppercase transition-colors"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleDownload(a.id)}
                            disabled={isDownloadingThis}
                            className="btn btn--green text-xs px-3 py-1 disabled:opacity-50"
                            title="Download PDF report"
                          >
                            {isDownloadingThis ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Download size={13} className="stroke-[2.5]" />
                            )}
                            <span className="hidden sm:inline">PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
