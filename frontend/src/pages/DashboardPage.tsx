import React, { useMemo, useState, useEffect } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  FileCode2,
  GraduationCap,
  Plus,
  Download,
  Calendar,
  Layers,
  Search,
  ExternalLink,
  ArrowUpRight,
  Clock,
  History,
  ShieldAlert,
  ArrowRight,
  Activity
} from 'lucide-react'
import { PageKey } from '../components/Sidebar'
import { AuditSummaryItem } from '../types'
import { RiskBadge, StatusPill, VendorBadge } from '../components/Shared'
import { fetchApprovalHistory } from '../services/api'
import { SecurityTopology3D } from '../components/SecurityTopology3D'

export function DashboardPage({
  audits,
  unresolvedCount,
  learnedCount,
  onNavigate,
  onViewAudit,
  onDownloadReport,
  isDownloading,
}: {
  audits: AuditSummaryItem[]
  unresolvedCount: number
  learnedCount: number
  onNavigate: (page: PageKey) => void
  onViewAudit: (auditId: number, framework?: string) => void
  onDownloadReport: (auditId: number) => void
  isDownloading: boolean
}) {
  const completedAudits = audits.filter((a) => a.compliance_score !== null)
  const avgScore = completedAudits.length
    ? Math.round(
        completedAudits.reduce((acc, a) => acc + (a.compliance_score || 0), 0) /
          completedAudits.length
      )
    : null

  const [approvalHistory, setApprovalHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadHistory() {
      setIsLoadingHistory(true)
      try {
        const history = await fetchApprovalHistory()
        setApprovalHistory(history)
      } catch (err) {
        console.error('Failed to fetch approval history', err)
      } finally {
        setIsLoadingHistory(false)
      }
    }
    loadHistory()
  }, [])

  const overallRisk =
    avgScore === null
      ? 'Evaluating'
      : avgScore >= 80
      ? 'Low Risk'
      : avgScore >= 50
      ? 'Medium Risk'
      : 'High Risk'

  // Filtered audits for table search
  const filteredAudits = useMemo(() => {
    if (!searchQuery.trim()) return audits
    const q = searchQuery.toLowerCase()
    return audits.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        String(a.id).includes(q) ||
        (a.framework || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q)
    )
  }, [audits, searchQuery])

  // Real multi-vendor distribution from audits list
  const vendorBreakdown = useMemo(() => {
    const cisco = audits.filter((a) => a.title.toLowerCase().includes('cisco') || a.title.toLowerCase().includes('rtr') || a.title.toLowerCase().includes('switch'))
    const fortinet = audits.filter((a) => a.title.toLowerCase().includes('forti') || a.title.toLowerCase().includes('fgt'))
    const paloalto = audits.filter((a) => a.title.toLowerCase().includes('pan') || a.title.toLowerCase().includes('palo'))
    const juniper = audits.filter((a) => a.title.toLowerCase().includes('juniper') || a.title.toLowerCase().includes('junos') || a.title.toLowerCase().includes('srx'))

    const getAvg = (list: AuditSummaryItem[]) => {
      const valid = list.filter((a) => a.compliance_score !== null)
      return valid.length ? Math.round(valid.reduce((acc, a) => acc + (a.compliance_score || 0), 0) / valid.length) : null
    }

    return {
      cisco: { count: cisco.length, score: getAvg(cisco) },
      fortinet: { count: fortinet.length, score: getAvg(fortinet) },
      paloalto: { count: paloalto.length, score: getAvg(paloalto) },
      juniper: { count: juniper.length, score: getAvg(juniper) },
    }
  }, [audits])

  // Failed audits requiring attention
  const failedAudits = useMemo(() => {
    return audits.filter((a) => a.compliance_score !== null && a.compliance_score < 70)
  }, [audits])

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. EDITORIAL HEADER & ACTIVE BASELINE */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#D7DCE5]">
        <div>
          <div className="eyebrow mb-2">Fleet Overview & Telemetry</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0A282D] tracking-tight">
            Security Compliance Posture
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B60] mt-1">
            Authoritative multi-vendor compliance evaluation across registered network infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D7DCE5] text-xs font-mono text-[#4A5B60]">
            <Calendar size={13} className="text-[#3DB663]" />
            <span>Baselines: CIS &bull; NIST SP 800-53</span>
          </div>

          <button
            onClick={() => onNavigate('audit')}
            className="btn btn--green text-xs px-4 py-2"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Start New Audit</span>
          </button>
        </div>
      </div>

      {/* 2. 3D SECURITY TOPOLOGY POSTURE SCENE */}
      <div className="w-full">
        <SecurityTopology3D
          complianceScore={avgScore}
          riskLevel={overallRisk}
          auditCount={audits.length}
          vendorBreakdown={vendorBreakdown}
        />
      </div>

      {/* 3. SUMMARY STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Fleet Compliance Score */}
        <div className="p-6 bg-white rounded-3xl border border-[#D7DCE5] shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#7E8F95] uppercase">
              Average Fleet Score
            </span>
            <ShieldCheck size={18} className="text-[#3DB663]" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-display font-extrabold text-[#0A282D]">
              {avgScore !== null ? `${avgScore}%` : '—'}
            </span>
            <RiskBadge risk={overallRisk} />
          </div>
          <div className="mt-2 text-xs text-[#4A5B60]">
            {completedAudits.length > 0
              ? `Derived from ${completedAudits.length} evaluated configurations`
              : 'Awaiting initial audit ingestion'}
          </div>
        </div>

        {/* Metric 2: Audited Configurations */}
        <div className="p-6 bg-white rounded-3xl border border-[#D7DCE5] shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#7E8F95] uppercase">
              Total Devices Audited
            </span>
            <FileCode2 size={18} className="text-[#0284C7]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-display font-extrabold text-[#0A282D]">
              {audits.length}
            </span>
            <span className="text-xs text-[#7E8F95] font-mono">devices</span>
          </div>
          <div className="mt-2 text-xs text-[#4A5B60]">
            Heterogeneous network infrastructure
          </div>
        </div>

        {/* Metric 3: Active Learned Rules */}
        <div className="p-6 bg-white rounded-3xl border border-[#D7DCE5] shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#7E8F95] uppercase">
              Authoritative Learned Rules
            </span>
            <GraduationCap size={18} className="text-[#3DB663]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-display font-extrabold text-[#3DB663]">
              {learnedCount}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EDF8F1] text-[#1E6E37] border border-[#BFE7CB]">
              Active
            </span>
          </div>
          <div className="mt-2 text-xs text-[#4A5B60]">
            Persistent adaptive parser knowledge
          </div>
        </div>

        {/* Metric 4: Unresolved Syntax */}
        <div className="p-6 bg-white rounded-3xl border border-[#D7DCE5] shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#7E8F95] uppercase">
              Unknown Syntax Items
            </span>
            <AlertTriangle
              size={18}
              className={unresolvedCount > 0 ? 'text-[#D97706]' : 'text-[#7E8F95]'}
            />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-display font-extrabold ${
                unresolvedCount > 0 ? 'text-[#D97706]' : 'text-[#0A282D]'
              }`}
            >
              {unresolvedCount}
            </span>
            {unresolvedCount > 0 ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] uppercase">
                Needs Review
              </span>
            ) : (
              <span className="text-xs text-[#7E8F95] font-mono">Fully mapped</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-[#4A5B60]">Isolated for validation</span>
            {unresolvedCount > 0 && (
              <button
                onClick={() => onNavigate('training')}
                className="text-[#0A282D] hover:text-[#3DB663] font-bold font-mono uppercase text-[11px] tracking-wider transition-colors"
              >
                Review &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. MULTI-VENDOR FLEET & ATTENTION AREAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Multi-Vendor Distribution (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-[#D7DCE5] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#D7DCE5]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A282D] font-mono">
              Fleet Posture by Vendor
            </h2>
            <span className="text-xs text-[#7E8F95] font-mono">
              {completedAudits.length} of {audits.length} Audited
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#F2F3F7] border border-[#D7DCE5] rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <VendorBadge vendor="cisco" />
                <span className="text-xs font-mono font-bold text-[#0A282D]">
                  {vendorBreakdown.cisco.count} devices
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-xs text-[#4A5B60]">Average Compliance</span>
                <span className="text-xl font-display font-bold text-[#0A282D]">
                  {vendorBreakdown.cisco.score !== null ? `${vendorBreakdown.cisco.score}%` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#F2F3F7] border border-[#D7DCE5] rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <VendorBadge vendor="fortinet" />
                <span className="text-xs font-mono font-bold text-[#0A282D]">
                  {vendorBreakdown.fortinet.count} devices
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-xs text-[#4A5B60]">Average Compliance</span>
                <span className="text-xl font-display font-bold text-[#0A282D]">
                  {vendorBreakdown.fortinet.score !== null ? `${vendorBreakdown.fortinet.score}%` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#F2F3F7] border border-[#D7DCE5] rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <VendorBadge vendor="paloalto" />
                <span className="text-xs font-mono font-bold text-[#0A282D]">
                  {vendorBreakdown.paloalto.count} devices
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-xs text-[#4A5B60]">Average Compliance</span>
                <span className="text-xl font-display font-bold text-[#0A282D]">
                  {vendorBreakdown.paloalto.score !== null ? `${vendorBreakdown.paloalto.score}%` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#F2F3F7] border border-[#D7DCE5] rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <VendorBadge vendor="juniper" />
                <span className="text-xs font-mono font-bold text-[#0A282D]">
                  {vendorBreakdown.juniper.count} devices
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-xs text-[#4A5B60]">Average Compliance</span>
                <span className="text-xl font-display font-bold text-[#0A282D]">
                  {vendorBreakdown.juniper.score !== null ? `${vendorBreakdown.juniper.score}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: High Priority & Failed Findings Warning (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#D7DCE5] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#D7DCE5]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A282D] font-mono flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#E11D48]" />
              Priority Attention
            </h2>
            <span className="text-xs font-mono text-[#E11D48] font-bold">
              {failedAudits.length} Non-Compliant
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {failedAudits.length === 0 ? (
              <div className="p-6 bg-[#EDF8F1] border border-[#BFE7CB] rounded-2xl text-center">
                <ShieldCheck size={32} className="mx-auto text-[#3DB663] mb-2" />
                <p className="text-xs font-semibold text-[#1E6E37]">
                  No critical or failing devices detected.
                </p>
                <p className="text-[11px] text-[#4A5B60] mt-1">
                  All completed audits currently satisfy baseline thresholds (&ge;70%).
                </p>
              </div>
            ) : (
              failedAudits.slice(0, 3).map((audit) => (
                <div
                  key={audit.id}
                  className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-[#0A282D] truncate block font-sans">
                      {audit.title}
                    </span>
                    <span className="text-[10px] text-[#7E8F95] font-mono block">
                      Audit #{audit.id} &bull; {audit.framework || 'CIS'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-base font-display font-extrabold text-[#E11D48]">
                      {audit.compliance_score}%
                    </span>
                    <button
                      onClick={() => onViewAudit(audit.id, audit.framework || 'CIS')}
                      className="text-xs font-mono font-bold text-[#0A282D] hover:text-[#3DB663] transition-colors"
                    >
                      Inspect &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. RECENT AUDITS TABLE (POTADOT CRAFTSMANSHIP) */}
      <div className="bg-white border border-[#D7DCE5] rounded-3xl shadow-xs overflow-hidden">
        {/* Table Controls Bar */}
        <div className="p-5 sm:p-6 border-b border-[#D7DCE5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-display font-bold text-[#0A282D]">
              Recent Configuration Audits
            </h2>
            <p className="text-xs text-[#4A5B60] mt-0.5">
              Historical compliance evaluations with deterministic control proof.
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E8F95]" />
            <input
              type="text"
              placeholder="Search audit archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs font-mono bg-[#F2F3F7] border border-[#D7DCE5] rounded-full text-[#0A282D] placeholder:text-[#7E8F95] focus:outline-none focus:border-[#3DB663] w-full sm:w-64"
            />
          </div>
        </div>

        {/* Audits Table or Empty State */}
        {filteredAudits.length === 0 ? (
          <div className="p-12 text-center bg-[#F2F3F7]/40">
            <FileCode2 size={36} className="mx-auto text-[#7E8F95] mb-3" />
            <h3 className="font-display text-lg font-bold text-[#0A282D]">
              {searchQuery ? 'No matching audits found' : 'No configuration audits yet'}
            </h3>
            <p className="text-xs text-[#4A5B60] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No audit titles or identifiers match "${searchQuery}".`
                : 'Upload your first router or firewall configuration to run deterministic compliance checks.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => onNavigate('audit')}
                className="mt-5 btn btn--green text-xs"
              >
                <span>Ingest First Configuration</span>
                <span className="btn-ico">
                  <ArrowRight size={13} className="stroke-[2.5]" />
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D7DCE5] bg-[#F2F3F7] font-mono text-[11px] font-bold uppercase tracking-wider text-[#7E8F95]">
                  <th className="py-3.5 px-5">Audit ID</th>
                  <th className="py-3.5 px-5">Device Hostname / Title</th>
                  <th className="py-3.5 px-5">Framework</th>
                  <th className="py-3.5 px-5">Date Evaluated</th>
                  <th className="py-3.5 px-5 text-center">Score</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7DCE5] font-mono">
                {filteredAudits.map((audit) => {
                  const score = audit.compliance_score
                  const isPass = score !== null && score >= 70

                  return (
                    <tr key={audit.id} className="hover:bg-[#F2F3F7]/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#0A282D]">
                        #{audit.id}
                      </td>
                      <td className="py-3.5 px-5 font-sans font-semibold text-[#0A282D]">
                        <div className="truncate max-w-xs">{audit.title}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F2F3F7] border border-[#D7DCE5] text-[#4A5B60] font-bold text-[10px]">
                          {audit.framework || 'CIS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-[#7E8F95]">
                        {audit.created_at
                          ? new Date(audit.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold text-sm">
                        {score !== null ? (
                          <span className={isPass ? 'text-[#3DB663]' : 'text-[#E11D48]'}>
                            {score}%
                          </span>
                        ) : (
                          <span className="text-[#7E8F95]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <StatusPill status={audit.status} />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2 font-mono">
                          <button
                            onClick={() => onViewAudit(audit.id, audit.framework || 'CIS')}
                            className="px-3 py-1 bg-white hover:bg-[#F2F3F7] border border-[#D7DCE5] rounded-full text-[#0A282D] font-bold text-[11px] tracking-wider uppercase transition-colors"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => onDownloadReport(audit.id)}
                            disabled={isDownloading}
                            className="p-1.5 rounded-full text-[#7E8F95] hover:text-[#0A282D] hover:bg-[#F2F3F7] disabled:opacity-50 transition-colors"
                            title="Download PDF report"
                          >
                            <Download size={14} />
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
