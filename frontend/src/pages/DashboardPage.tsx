import React, { useMemo, useState, useEffect } from 'react'
import { Activity, AlertTriangle, Calendar, FileCode2, GraduationCap, Layers, Plus, Server, ShieldCheck, Download, History } from 'lucide-react'
import { PageKey } from '../components/Sidebar'
import { SecurityTopology3D } from '../components/SecurityTopology3D'
import { AuditSummaryItem } from '../types'
import { RiskBadge, StatusPill } from '../components/Shared'
import { fetchApprovalHistory } from '../services/api'

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

  // Vendor breakdowns from real data
  const vendorBreakdown = useMemo(() => {
    const ciscoAudits = audits.filter((a) => a.title.toLowerCase().includes('cisco') || a.title.toLowerCase().includes('rtr') || a.title.toLowerCase().includes('switch'))
    const fortiAudits = audits.filter((a) => a.title.toLowerCase().includes('forti') || a.title.toLowerCase().includes('fgt'))
    const panAudits = audits.filter((a) => a.title.toLowerCase().includes('pan') || a.title.toLowerCase().includes('palo'))
    const juniperAudits = audits.filter((a) => a.title.toLowerCase().includes('juniper') || a.title.toLowerCase().includes('junos') || a.title.toLowerCase().includes('srx'))
    const arubaAudits = audits.filter((a) => a.title.toLowerCase().includes('aruba') || a.title.toLowerCase().includes('cx') || a.title.toLowerCase().includes('aoscx'))
    const checkpointAudits = audits.filter((a) => a.title.toLowerCase().includes('check') || a.title.toLowerCase().includes('gaia') || a.title.toLowerCase().includes('cp'))

    const getAvg = (list: AuditSummaryItem[]) => {
      const valid = list.filter((a) => a.compliance_score !== null)
      return valid.length ? Math.round(valid.reduce((acc, a) => acc + (a.compliance_score || 0), 0) / valid.length) : null
    }

    return {
      cisco: { count: ciscoAudits.length, score: getAvg(ciscoAudits) },
      fortinet: { count: fortiAudits.length, score: getAvg(fortiAudits) },
      paloalto: { count: panAudits.length, score: getAvg(panAudits) },
      juniper: { count: juniperAudits.length, score: getAvg(juniperAudits) },
      aruba: { count: arubaAudits.length, score: getAvg(arubaAudits) },
      checkpoint: { count: checkpointAudits.length, score: getAvg(checkpointAudits) },
    }
  }, [audits])

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header Bar with Contextual Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1 border-b border-surface-border">
        <div>
          <h1 className="text-lg font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-bright" />
            Security Compliance Dashboard
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Fleet-wide multi-vendor network security posture and rule telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-panel border border-surface-border text-xs font-mono text-text-secondary">
            <Calendar size={13} className="text-text-secondary" />
            <span>Active Baseline: CIS v1.0 &bull; NIST r5 &bull; STIG &bull; ISO 27001</span>
          </div>

          <button
            onClick={() => onNavigate('audit')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-brand-primary hover:bg-brand-bright text-white font-bold text-xs transition-colors shadow-sm"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>New Audit</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Fleet Compliance */}
        <div className="rounded-lg border border-surface-border bg-surface-panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Fleet Compliance
            </span>
            <ShieldCheck size={16} className="text-brand-bright" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-text-primary font-mono">
              {avgScore !== null ? `${avgScore}%` : 'N/A'}
            </span>
            <RiskBadge risk={overallRisk} />
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            Average posture across {completedAudits.length} evaluated configurations
          </div>
        </div>

        {/* Audited Configurations */}
        <div className="rounded-lg border border-surface-border bg-surface-panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Audited Configurations
            </span>
            <FileCode2 size={16} className="text-text-secondary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-text-primary font-mono">
              {audits.length}
            </span>
            <span className="text-xs text-text-secondary font-medium">total audited devices</span>
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            Multi-vendor network infrastructure
          </div>
        </div>

        {/* Active Learned Rules */}
        <div className="rounded-lg border border-surface-border bg-surface-panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Active Learned Rules
            </span>
            <GraduationCap size={16} className="text-status-success" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-status-success font-mono">
              {learnedCount}
            </span>
            <span className="text-[11px] font-semibold text-status-success font-mono px-1.5 py-0.5 rounded bg-status-success/10 border border-status-success/30">
              SQLite Active
            </span>
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            Persistent adaptive parser knowledge
          </div>
        </div>

        {/* Unresolved Commands */}
        <div className="rounded-lg border border-surface-border bg-surface-panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Unresolved Commands
            </span>
            <AlertTriangle
              size={16}
              className={unresolvedCount > 0 ? 'text-amber-500' : 'text-text-secondary'}
            />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold tracking-tight font-mono ${
                unresolvedCount > 0 ? 'text-amber-500' : 'text-text-secondary'
              }`}
            >
              {unresolvedCount}
            </span>
            {unresolvedCount > 0 ? (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30">
                Needs Review
              </span>
            ) : (
              <span className="text-xs text-text-secondary">All syntax mapped</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-text-secondary">Awaiting machine-teaching</span>
            {unresolvedCount > 0 && (
              <button
                onClick={() => onNavigate('training')}
                className="text-brand-bright hover:text-brand-primary font-semibold flex items-center gap-0.5"
              >
                Review &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main 3D Security Posture Topology Section (30-40% Area) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: 3D Visualization Canvas (2 Cols) */}
        <div className="lg:col-span-2">
          <SecurityTopology3D
            complianceScore={avgScore}
            riskLevel={overallRisk}
            auditCount={audits.length}
            vendorBreakdown={vendorBreakdown}
          />
        </div>

        {/* Right: Security Posture Distribution Breakdown (1 Col) */}
        <div className="rounded-lg border border-surface-border bg-surface-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Activity size={14} className="text-brand-bright" />
                Fleet Posture Breakdown
              </span>
              <span className="font-mono text-xs text-brand-bright">
                {avgScore !== null ? `${avgScore}%` : 'Evaluating'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded bg-surface-secondary border border-surface-border">
                <span className="text-[10px] uppercase font-bold text-status-critical block">Critical Risk</span>
                <span className="text-lg font-bold font-mono text-status-critical mt-1 block">
                  {audits.filter((a) => a.compliance_score !== null && a.compliance_score < 40).length}
                </span>
                <span className="text-[10px] text-text-secondary">&lt;40% compliance</span>
              </div>

              <div className="p-3 rounded bg-surface-secondary border border-surface-border">
                <span className="text-[10px] uppercase font-bold text-amber-500 block">High/Medium Risk</span>
                <span className="text-lg font-bold font-mono text-amber-500 mt-1 block">
                  {audits.filter((a) => a.compliance_score !== null && a.compliance_score >= 40 && a.compliance_score < 80).length}
                </span>
                <span className="text-[10px] text-text-secondary">40-79% compliance</span>
              </div>

              <div className="p-3 rounded bg-surface-secondary border border-surface-border col-span-2">
                <span className="text-[10px] uppercase font-bold text-status-success block">Passing / Compliant</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold font-mono text-status-success">
                    {audits.filter((a) => a.compliance_score !== null && a.compliance_score >= 80).length}
                  </span>
                  <span className="text-[10px] text-text-secondary font-mono">&ge;80% baseline</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs">
            <span className="text-text-secondary">Deterministic Engine:</span>
            <span className="text-status-success font-mono font-bold">ARMED & AUTHORITATIVE</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audits & Multi-Vendor Engine Specs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Audits Table (2 Cols) */}
        <div className="lg:col-span-2 rounded-lg border border-surface-border bg-surface-panel p-5">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Recent Configuration Audits
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Evaluated security baselines across enterprise network devices
              </p>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-brand-bright hover:text-brand-primary font-semibold flex items-center gap-1"
            >
              View All Audits &rarr;
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {audits.length === 0 ? (
              <div className="py-12 text-center text-text-secondary">
                <FileCode2 size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No configuration audits recorded yet.</p>
                <button
                  onClick={() => onNavigate('audit')}
                  className="mt-3 text-xs text-brand-bright hover:underline font-semibold"
                >
                  Upload your first network config &rarr;
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <table className="hidden md:table w-full min-w-[700px] whitespace-nowrap text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="pb-2.5 font-medium">ID</th>
                    <th className="pb-2.5 font-medium">Configuration</th>
                    <th className="pb-2.5 font-medium">Framework</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium">Score</th>
                    <th className="pb-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {audits.slice(0, 6).map((audit) => {
                    const score = audit.compliance_score
                    return (
                      <tr key={audit.id} className="hover:bg-surface-secondary transition-colors">
                        <td className="py-3 font-mono text-text-secondary">#{audit.id}</td>
                        <td className="py-3">
                          <div className="font-semibold text-text-primary">{audit.title}</div>
                        </td>
                        <td className="py-3">
                          <span className="px-1.5 py-0.5 rounded bg-surface-secondary border border-surface-border text-text-primary font-mono text-[10px]">
                            {audit.framework || 'CIS'}
                          </span>
                        </td>
                        <td className="py-3">
                          <StatusPill status={audit.status} />
                        </td>
                        <td className="py-3">
                          {score !== null ? (
                            <span
                              className={`font-mono font-bold ${
                                score >= 80
                                  ? 'text-status-success'
                                  : score >= 50
                                  ? 'text-amber-500'
                                  : 'text-status-critical'
                              }`}
                            >
                              {Math.round(score)}%
                            </span>
                          ) : (
                            <span className="text-text-secondary font-mono">—</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewAudit(audit.id, audit.framework)}
                              className="px-2.5 py-1 rounded bg-surface-secondary hover:bg-surface-border border border-surface-border text-text-primary text-[11px] font-medium transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => onDownloadReport(audit.id)}
                              disabled={isDownloading}
                              className="p-1 rounded bg-surface-secondary hover:bg-surface-border border border-surface-border text-brand-bright transition-colors disabled:opacity-50"
                              title="Download PDF Report"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                </table>
                
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {audits.slice(0, 6).map((audit) => {
                    const score = audit.compliance_score
                    return (
                      <div key={audit.id} className="rounded border border-surface-border bg-surface-secondary p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-text-secondary text-[11px]">#{audit.id}</span>
                          <StatusPill status={audit.status} />
                        </div>
                        
                        <div className="font-semibold text-text-primary text-sm truncate">{audit.title}</div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-surface-primary border border-surface-border text-text-primary font-mono text-[10px]">
                              {audit.framework || 'CIS'}
                            </span>
                            {score !== null ? (
                              <span
                                className={`font-mono font-bold text-xs ${
                                  score >= 80
                                    ? 'text-status-success'
                                    : score >= 50
                                    ? 'text-amber-500'
                                    : 'text-status-critical'
                                }`}
                              >
                                {Math.round(score)}%
                              </span>
                            ) : (
                              <span className="text-text-secondary font-mono text-xs">—</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onViewAudit(audit.id, audit.framework)}
                              className="px-2.5 py-1 rounded bg-surface-primary hover:bg-surface-border border border-surface-border text-text-primary text-[11px] font-medium transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => onDownloadReport(audit.id)}
                              disabled={isDownloading}
                              className="p-1 rounded bg-surface-primary hover:bg-surface-border border border-surface-border text-brand-bright transition-colors disabled:opacity-50"
                              title="Download PDF Report"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Multi-Vendor Parsing Engines & Rule Precedence (1 Col) */}
        <div className="space-y-4">
          {/* Multi-Vendor Parsing Engine Card */}
          <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Server size={14} className="text-brand-bright" />
              Multi-Vendor Parsing Engines
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-surface-secondary border border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-bright" />
                  <span className="font-medium text-text-primary">Cisco IOS / IOS-XE</span>
                </div>
                <span className="text-[10px] font-mono text-status-success bg-status-success/10 px-1.5 py-0.5 rounded border border-status-success/30">
                  Deterministic v2.4
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface-secondary border border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-critical" />
                  <span className="font-medium text-text-primary">Fortinet FortiOS</span>
                </div>
                <span className="text-[10px] font-mono text-status-success bg-status-success/10 px-1.5 py-0.5 rounded border border-status-success/30">
                  Deterministic v2.4
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface-secondary border border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="font-medium text-text-primary">Palo Alto PAN-OS</span>
                </div>
                <span className="text-[10px] font-mono text-status-success bg-status-success/10 px-1.5 py-0.5 rounded border border-status-success/30">
                  Deterministic v2.4
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface-secondary border border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="font-medium text-text-primary">Juniper Junos</span>
                </div>
                <span className="text-[10px] font-mono text-status-success bg-status-success/10 px-1.5 py-0.5 rounded border border-status-success/30">
                  Deterministic v2.4
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface-secondary border border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  <span className="font-medium text-text-primary">Aruba AOS-CX</span>
                </div>
                <span className="text-[10px] font-mono text-status-success bg-status-success/10 px-1.5 py-0.5 rounded border border-status-success/30">
                  Deterministic v2.4
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface-secondary border border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                  <span className="font-medium text-text-primary">Check Point Gaia</span>
                </div>
                <span className="text-[10px] font-mono text-status-success bg-status-success/10 px-1.5 py-0.5 rounded border border-status-success/30">
                  Deterministic v2.4
                </span>
              </div>
            </div>
          </div>

          {/* Engine Precedence Architecture */}
          <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Layers size={14} className="text-status-success" />
              Rule Precedence Hierarchy
            </h3>
            <div className="mt-3 space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center gap-2 p-1.5 rounded bg-status-success/10 text-status-success border border-status-success/30">
                <span className="font-bold">1.</span>
                <span>Deterministic Parser (Authoritative)</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded bg-brand-primary/10 text-brand-bright border border-brand-primary/30">
                <span className="font-bold">2.</span>
                <span>Learned Mappings (SQLite DB)</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded bg-surface-secondary text-text-primary border border-surface-border">
                <span className="font-bold">3.</span>
                <span>AI Normalization (Gemini Suggestion)</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded bg-surface-secondary text-text-secondary border border-surface-border">
                <span className="font-bold">4.</span>
                <span>Unresolved Unknown Syntax</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Remediation Approval History */}
      <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <History size={16} className="text-brand-bright" />
              Recent AI Remediation Approvals
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Log of user-approved fixes and configuration changes generated by Gemini
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {isLoadingHistory ? (
            <div className="py-8 text-center text-text-secondary text-xs">Loading history...</div>
          ) : approvalHistory.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              <History size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">No remediations have been approved yet.</p>
            </div>
          ) : (
            <table className="w-full min-w-[900px] whitespace-nowrap text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Date</th>
                  <th className="pb-2.5 font-medium">Audit ID</th>
                  <th className="pb-2.5 font-medium">Control / Finding</th>
                  <th className="pb-2.5 font-medium">Original State</th>
                  <th className="pb-2.5 font-medium">Proposed Fix</th>
                  <th className="pb-2.5 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {approvalHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="py-3 text-text-secondary font-mono">{new Date(h.created_at).toLocaleDateString()}</td>
                    <td className="py-3 font-mono text-text-secondary">#{h.audit_id}</td>
                    <td className="py-3">
                      <div className="font-semibold text-text-primary">{h.finding}</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">{h.vendor} • {h.framework}</div>
                    </td>
                    <td className="py-3">
                      <StatusPill status={h.original_state || 'FAIL'} />
                    </td>
                    <td className="py-3 font-mono text-[10px] text-status-success max-w-[300px] truncate">
                      {h.proposed_solution}
                      {h.user_edited && <span className="ml-2 px-1 py-0.5 rounded bg-brand-primary/20 text-brand-bright">Edited</span>}
                    </td>
                    <td className="py-3">
                      <StatusPill status={h.resulting_audit_status || 'UNKNOWN'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
