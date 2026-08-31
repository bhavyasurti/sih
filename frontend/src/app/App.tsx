import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  LayoutDashboard,
  Loader2,
  Lock,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Terminal,
  Trash2,
  Upload,
  UserCheck,
  Wifi,
  X,
  XCircle,
} from 'lucide-react'
import {
  analyzeAudit,
  createMapping,
  disableMapping,
  downloadAuditReport,
  evaluateCompliance,
  fetchAudit,
  fetchHealth,
  listAudits,
  listLearnedMappings,
  listUnknownCommands,
  uploadAuditFile,
  type LearnedMapping,
  type MappingPayload,
  type UnknownCommand,
} from '../services/api'
import { Sidebar, type PageKey } from '../components/Sidebar'
import { Header } from '../components/Header'
import { SecurityTopology3D } from '../components/SecurityTopology3D'
import { LandingPage } from '../components/LandingPage'

type VendorSelection = 'auto' | 'cisco' | 'fortinet' | 'paloalto'
type FrameworkSelection = 'CIS' | 'NIST'

type AuditResult = {
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

type AuditSummaryItem = {
  id: number
  title: string
  status: string
  framework: string
  compliance_score: number | null
}

const SUPPORTED_PARAMETERS = [
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

const VALUE_TYPES = ['integer', 'boolean', 'string', 'enum']

function VendorBadge({ vendor }: { vendor?: string | null }) {
  const v = (vendor || 'unknown').toLowerCase()
  if (v.includes('cisco')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-brand-primary/20 text-brand-bright border border-brand-primary/30 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-bright" />
        Cisco IOS
      </span>
    )
  }
  if (v.includes('forti')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-status-darkRed/30 text-status-critical border border-status-critical/30 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-status-critical" />
        Fortinet FortiOS
      </span>
    )
  }
  if (v.includes('palo') || v.includes('pan')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Palo Alto PAN-OS
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-secondary text-text-secondary border border-surface-border font-mono">
      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary" />
      {vendor || 'Unknown'}
    </span>
  )
}

function RiskBadge({ risk }: { risk?: string | null }) {
  const r = (risk || 'low').toLowerCase()
  if (r.includes('critical')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-darkRed/40 text-status-critical border border-status-critical/40 uppercase tracking-wider">
        <AlertOctagon size={11} className="stroke-[2.5]" />
        Critical Risk
      </span>
    )
  }
  if (r.includes('high')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-darkRed/20 text-status-critical border border-status-critical/30 uppercase tracking-wider">
        <AlertTriangle size={11} className="stroke-[2.5]" />
        High Risk
      </span>
    )
  }
  if (r.includes('medium')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase tracking-wider">
        <Info size={11} className="stroke-[2.5]" />
        Medium Risk
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-success/10 text-status-success border border-status-success/30 uppercase tracking-wider">
      <CheckCircle2 size={11} className="stroke-[2.5]" />
      Low Risk
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (s === 'PASS' || s === 'COMPLIANT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-status-success/10 text-status-success border border-status-success/30 font-mono">
        PASS
      </span>
    )
  }
  if (s === 'FAIL' || s === 'NON-COMPLIANT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-status-darkRed/20 text-status-critical border border-status-critical/30 font-mono">
        FAIL
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 font-mono">
      {s || 'UNKNOWN'}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = severity.toUpperCase()
  if (s === 'CRITICAL') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-darkRed/40 text-status-critical border border-status-critical/40 uppercase tracking-wider">
        CRITICAL
      </span>
    )
  }
  if (s === 'HIGH') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-darkRed/20 text-status-critical border border-status-critical/30 uppercase tracking-wider">
        HIGH
      </span>
    )
  }
  if (s === 'MEDIUM') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase tracking-wider">
        MEDIUM
      </span>
    )
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-secondary text-text-secondary border border-surface-border uppercase tracking-wider">
      LOW
    </span>
  )
}

/* =========================================================================
   1. DASHBOARD PAGE (With 3D Security Posture / Network Topology)
   ========================================================================= */
function DashboardPage({
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

    const getAvg = (list: AuditSummaryItem[]) => {
      const valid = list.filter((a) => a.compliance_score !== null)
      return valid.length ? Math.round(valid.reduce((acc, a) => acc + (a.compliance_score || 0), 0) / valid.length) : null
    }

    return {
      cisco: { count: ciscoAudits.length, score: getAvg(ciscoAudits) },
      fortinet: { count: fortiAudits.length, score: getAvg(fortiAudits) },
      paloalto: { count: panAudits.length, score: getAvg(panAudits) },
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
            <span>Active Baseline: CIS v1.0 &bull; NIST r5</span>
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
              <table className="w-full text-left text-xs border-collapse">
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
    </div>
  )
}

/* =========================================================================
   2. CONFIGURATION AUDITS PAGE (Uploader + Audit History)
   ========================================================================= */
function AuditPage({
  configText,
  setConfigText,
  selectedVendor,
  setSelectedVendor,
  selectedFramework,
  setSelectedFramework,
  aiEnabled,
  setAiEnabled,
  onFilePicked,
  onAnalyze,
  isAnalyzing,
  uploadedFile,
  error,
  progressStages,
  audits,
  onViewAudit,
  onDownloadReport,
  isDownloading,
}: {
  configText: string
  setConfigText: (text: string) => void
  selectedVendor: VendorSelection
  setSelectedVendor: (vendor: VendorSelection) => void
  selectedFramework: FrameworkSelection
  setSelectedFramework: (framework: FrameworkSelection) => void
  aiEnabled: boolean
  setAiEnabled: (enabled: boolean) => void
  onFilePicked: (file: File | null) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  uploadedFile: File | null
  error: string
  progressStages: Array<{ label: string; active: boolean }>
  audits: AuditSummaryItem[]
  onViewAudit: (auditId: number, framework?: string) => void
  onDownloadReport: (auditId: number) => void
  isDownloading: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload')
  const [searchFilter, setSearchFilter] = useState('')

  const filteredAudits = useMemo(() => {
    return audits.filter(
      (a) =>
        a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        String(a.id).includes(searchFilter) ||
        (a.framework || '').toLowerCase().includes(searchFilter.toLowerCase())
    )
  }, [audits, searchFilter])

  return (
    <div className="space-y-6">
      {/* Top Section: Audit Ingestion Console */}
      <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <FileCode2 size={16} className="text-brand-bright" />
              Ingest Configuration for Compliance Audit
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Upload or paste running configurations to evaluate against CIS / NIST benchmarks
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded bg-surface-secondary p-1 border border-surface-border">
            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                inputMode === 'upload'
                  ? 'bg-surface-border text-brand-bright shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              File Upload
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                inputMode === 'paste'
                  ? 'bg-surface-border text-brand-bright shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Raw CLI Editor
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded bg-status-critical/10 border border-status-critical/30 text-status-critical text-xs flex items-center gap-2">
            <AlertOctagon size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Area (2 Cols): File Upload Zone or CLI Text Area */}
          <div className="lg:col-span-2 space-y-4">
            {inputMode === 'upload' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
                  className="hidden"
                  accept=".cfg,.conf,.config,.txt,.log"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-surface-border hover:border-brand-primary bg-surface-primary hover:bg-surface-secondary rounded-lg p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px]"
                >
                  <Upload size={28} className="text-text-secondary mb-2 stroke-[1.8]" />
                  <div className="text-xs font-semibold text-text-primary">
                    {uploadedFile ? uploadedFile.name : 'Click to upload configuration file'}
                  </div>
                  <div className="text-[11px] text-text-secondary mt-1">
                    Supports Cisco IOS (.cfg), FortiOS (.conf), PAN-OS (.txt), text configs up to 2MB
                  </div>
                  {uploadedFile && (
                    <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-secondary text-brand-bright text-xs font-mono border border-surface-border">
                      <span>{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                      <span className="text-text-secondary">&bull;</span>
                      <span className="text-status-success">Ready to audit</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Paste Configuration Text
                </label>
                <textarea
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  placeholder="! Paste running-config or device configuration here...&#10;hostname CORE-RTR-01&#10;ip ssh version 2&#10;line vty 0 4&#10; transport input ssh"
                  className="w-full h-56 rounded-lg bg-surface-secondary border border-surface-border p-3 font-mono text-xs text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-text-secondary resize-y"
                />
                <div className="flex items-center justify-between text-[11px] text-text-secondary mt-1">
                  <span>Lines: {configText ? configText.split('\n').length : 0}</span>
                  <span>Characters: {configText.length}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Area (1 Col): Audit Parameters */}
          <div className="space-y-4 rounded-lg bg-surface-panel border border-surface-border p-4">
            {/* Vendor Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Target Vendor Architecture
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'auto' as VendorSelection, label: 'Auto-Detect' },
                  { id: 'cisco' as VendorSelection, label: 'Cisco IOS' },
                  { id: 'fortinet' as VendorSelection, label: 'Fortinet' },
                  { id: 'paloalto' as VendorSelection, label: 'Palo Alto' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedVendor(opt.id)}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium border text-left transition-colors ${
                      selectedVendor === opt.id
                        ? 'bg-brand-primary/10 border-brand-primary/50 text-brand-bright font-semibold'
                        : 'bg-surface-secondary border-surface-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Framework Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                Compliance Framework
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'CIS' as FrameworkSelection, label: 'CIS Benchmark' },
                  { id: 'NIST' as FrameworkSelection, label: 'NIST SP 800-53' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedFramework(opt.id)}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium border text-left transition-colors ${
                      selectedFramework === opt.id
                        ? 'bg-brand-primary/10 border-brand-primary/50 text-brand-bright font-semibold'
                        : 'bg-surface-secondary border-surface-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Normalization Option */}
            <div className="pt-2 border-t border-surface-border">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-surface-border bg-surface-primary text-brand-primary focus:ring-0"
                />
                <div>
                  <div className="text-xs font-semibold text-text-primary">
                    AI-Assisted Normalization (Gemini)
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    Suggest normalized security parameters for unparsed commands. Deterministic engine remains authoritative.
                  </div>
                </div>
              </label>
            </div>

            {/* Run Audit Action */}
            <div className="pt-3">
              <button
                type="button"
                onClick={onAnalyze}
                disabled={isAnalyzing || (!configText.trim() && !uploadedFile)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-brand-primary hover:bg-brand-bright disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Executing Compliance Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-current" />
                    <span>Run Compliance Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Progress Tracker */}
        {isAnalyzing && (
          <div className="mt-6 pt-5 border-t border-surface-border">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-bright mb-3 flex items-center gap-2">
              <Activity size={14} className="animate-pulse" />
              Audit Execution Pipeline
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {progressStages.map((stage, idx) => (
                <div
                  key={stage.label}
                  className="p-2 rounded bg-surface-secondary border border-surface-border text-center"
                >
                  <div className="text-[10px] font-mono text-text-secondary">Stage {idx + 1}</div>
                  <div className="text-[11px] font-semibold text-text-primary mt-0.5 truncate">
                    {stage.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Audit History Archive */}
      <div className="rounded-lg border border-surface-border bg-surface-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Audits History Archive
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Historical network configuration audits and evaluated findings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder="Filter audits..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1 rounded bg-surface-secondary border border-surface-border text-xs text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:outline-none w-48"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {filteredAudits.length === 0 ? (
            <div className="py-8 text-center text-text-secondary text-xs">
              No matching audit records found.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Audit ID</th>
                  <th className="pb-2.5 font-medium">Configuration File</th>
                  <th className="pb-2.5 font-medium">Framework</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium">Score</th>
                  <th className="pb-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredAudits.map((audit) => {
                  const score = audit.compliance_score
                  return (
                    <tr key={audit.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="py-3 font-mono text-text-secondary">#{audit.id}</td>
                      <td className="py-3 font-semibold text-text-primary">{audit.title}</td>
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewAudit(audit.id, audit.framework)}
                            className="px-2.5 py-1 rounded bg-surface-secondary hover:bg-surface-border border border-surface-border text-text-primary text-[11px] font-medium transition-colors"
                          >
                            View Results
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
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   3. AUDIT RESULTS PAGE (Flagship View: Technical Findings & CLI Remediation)
   ========================================================================= */
function ResultsPage({
  result,
  onDownloadReport,
  isDownloading,
  onNavigate,
}: {
  result: AuditResult | null
  onDownloadReport: (auditId: number) => void
  isDownloading: boolean
  onNavigate: (page: PageKey) => void
}) {
  const [activeTab, setActiveTab] = useState<'findings' | 'parameters' | 'telemetry'>('findings')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FAIL' | 'PASS' | 'UNKNOWN'>('ALL')
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs bg-surface-secondary/50 p-2.5 rounded border border-surface-border/50">
                      <div>
                        <span className="text-text-secondary text-[11px] block">Expected State:</span>
                        <span className="font-mono text-text-primary font-medium">
                          {String(finding.expected ?? 'Configured')}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary text-[11px] block">Observed State:</span>
                        <span className={`font-mono font-medium ${isFail ? 'text-status-critical' : 'text-text-primary'}`}>
                          {String(finding.actual ?? 'Not observed')}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary text-[11px] block">Evidence:</span>
                        <span className="font-mono text-text-primary truncate block" title={finding.evidence}>
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
            <table className="w-full text-left text-xs border-collapse">
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
                    className="flex items-center justify-between p-2.5 rounded bg-surface-secondary border border-surface-border text-xs font-mono"
                  >
                    <span className="text-text-primary truncate mr-4">{cmd.command}</span>
                    <span className="text-[10px] text-text-secondary flex-shrink-0">
                      Line {cmd.line_number || 'N/A'}
                    </span>
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

/* =========================================================================
   4. TRAINING CENTER PAGE (Knowledge & Adaptive Machine-Teaching)
   ========================================================================= */
interface ReviewModalData {
  command: UnknownCommand
  suggestion?: {
    parameter: string
    value: unknown
    confidence: number
  } | null
}

function TrainingPage() {
  const [unknownCommands, setUnknownCommands] = useState<UnknownCommand[]>([])
  const [learnedMappings, setLearnedMappings] = useState<LearnedMapping[]>([])
  const [activeTab, setActiveTab] = useState<'unknown' | 'mappings'>('unknown')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [reviewModal, setReviewModal] = useState<ReviewModalData | null>(null)
  const [isSavingMapping, setIsSavingMapping] = useState(false)

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
        <div className="mt-4 p-3 rounded bg-surface-secondary border border-surface-border flex items-center justify-between text-xs font-mono">
          <span className="text-text-secondary">Resolution Priority:</span>
          <div className="flex items-center gap-2 text-[11px]">
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

                  <button
                    onClick={() => setReviewModal({ command: cmd, suggestion: cmd.ai_suggestion })}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-brand-primary hover:bg-brand-bright text-white font-bold text-xs transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    <GraduationCap size={14} />
                    <span>Review & Teach</span>
                  </button>
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
                      className="px-3 py-1.5 rounded bg-surface-secondary hover:bg-status-critical/20 hover:text-status-critical border border-surface-border text-text-primary text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0"
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
    data.suggestion?.parameter || 'ssh_version'
  )
  const [valueType, setValueType] = useState('integer')
  const [value, setValue] = useState(
    data.suggestion?.value !== undefined ? String(data.suggestion.value) : ''
  )
  const [description, setDescription] = useState('')
  const [vendor, setVendor] = useState(data.command.vendor || 'cisco')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let parsedVal: unknown = value
    if (valueType === 'integer') {
      parsedVal = parseInt(value, 10) || 0
    } else if (valueType === 'boolean') {
      parsedVal = value.toLowerCase() === 'true' || value === '1'
    }

    onSave({
      command_pattern: data.command.command,
      normalized_parameter: parameter,
      value_type: valueType,
      vendor: vendor,
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
                className="w-full rounded bg-black/50 border border-surface-border p-2 text-text-primary font-mono text-xs focus:border-brand-primary focus:outline-none"
              >
                <option value="cisco">Cisco IOS</option>
                <option value="fortinet">Fortinet FortiOS</option>
                <option value="paloalto">Palo Alto PAN-OS</option>
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
              className="w-full rounded bg-black/50 border border-surface-border p-2 text-text-primary font-mono text-xs focus:border-brand-primary focus:outline-none"
            >
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

          <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-surface-secondary hover:bg-surface-border text-text-primary font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-brand-primary hover:bg-brand-bright text-white font-bold text-xs transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <SaveIcon size={13} />}
              <span>Save & Enable Rule</span>
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

/* =========================================================================
   5. REPORTS ARCHIVE PAGE (Document Management Style)
   ========================================================================= */
function ReportsPage({
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
            <table className="w-full text-left text-xs border-collapse">
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
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   6. SETTINGS PAGE (System Settings & Telemetry)
   ========================================================================= */
function SettingsPage({
  backendStatus,
  onRefreshHealth,
}: {
  backendStatus: 'checking' | 'online' | 'offline'
  onRefreshHealth: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Settings size={16} className="text-brand-primary" />
              System Settings & Architecture Diagnostics
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Authoritative rule baselines, database connectivity, and engine telemetry
            </p>
          </div>

          <button
            onClick={onRefreshHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-border/50 hover:bg-surface-border border border-surface-border text-text-primary text-xs font-semibold transition-colors"
          >
            <RefreshCw size={13} />
            <span>Check Connectivity</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-3.5 rounded bg-surface-primary border border-surface-border">
            <div className="text-[10px] font-bold uppercase text-text-secondary">Backend API</div>
            <div className="mt-1 flex items-center gap-2 text-xs font-mono font-bold text-text-primary">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
              <span>{backendStatus === 'online' ? 'Connected (200 OK)' : 'Offline'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-primary border border-surface-border">
            <div className="text-[10px] font-bold uppercase text-text-secondary">Database</div>
            <div className="mt-1 text-xs font-mono font-bold text-emerald-400">
              SQLite (netsecure.db)
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-primary border border-surface-border">
            <div className="text-[10px] font-bold uppercase text-text-secondary">PDF Engine</div>
            <div className="mt-1 text-xs font-mono font-bold text-brand-primary">
              ReportLab v4.1+ (Local)
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-primary border border-surface-border">
            <div className="text-[10px] font-bold uppercase text-text-secondary">AI Integration</div>
            <div className="mt-1 text-xs font-mono font-bold text-text-primary">
              Google GenAI (Gemini)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Compliance Baselines */}
        <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-surface-border flex items-center gap-2">
            <Shield size={15} className="text-brand-primary" />
            Compliance Framework Baselines
          </h2>
          <div className="mt-4 space-y-2.5 text-xs">
            <div className="p-3 rounded bg-surface-primary border border-surface-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-text-primary">CIS Network Benchmark v1.0</div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  SSH v2, Telnet disablement, HTTP/HTTPS security, NTP synchronization, session timeouts
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                ACTIVE
              </span>
            </div>

            <div className="p-3 rounded bg-surface-primary border border-surface-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-text-primary">NIST SP 800-53 Rev. 5</div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  AC-2/AC-17 (Access Control), SC-8 (Transmission Confidentiality), AU-2/AU-12 (Audit & Accountability)
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* API Telemetry & Endpoints */}
        <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-surface-border flex items-center gap-2">
            <Server size={15} className="text-emerald-400" />
            Active Service Endpoints
          </h2>
          <div className="mt-4 space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-surface-primary border border-surface-border flex items-center justify-between">
              <span className="text-text-secondary">GET /api/health</span>
              <span className="text-emerald-400 text-[11px]">200 OK</span>
            </div>
            <div className="p-2.5 rounded bg-surface-primary border border-surface-border flex items-center justify-between">
              <span className="text-text-secondary">POST /api/audits/upload</span>
              <span className="text-brand-secondary text-[11px]">Ready</span>
            </div>
            <div className="p-2.5 rounded bg-surface-primary border border-surface-border flex items-center justify-between">
              <span className="text-text-secondary">POST /api/audits/{'{id}'}/analyze</span>
              <span className="text-brand-secondary text-[11px]">Ready</span>
            </div>
            <div className="p-2.5 rounded bg-surface-primary border border-surface-border flex items-center justify-between">
              <span className="text-text-secondary">POST /api/audits/{'{id}'}/compliance</span>
              <span className="text-brand-secondary text-[11px]">Ready</span>
            </div>
            <div className="p-2.5 rounded bg-surface-primary border border-surface-border flex items-center justify-between">
              <span className="text-text-secondary">GET /api/audits/{'{id}'}/report</span>
              <span className="text-emerald-400 text-[11px]">PDF v4.1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   7. ROOT APPLICATION COMPONENT
   ========================================================================= */
export default function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('home')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [selectedVendor, setSelectedVendor] = useState<VendorSelection>('auto')
  const [selectedFramework, setSelectedFramework] = useState<FrameworkSelection>('CIS')
  const [aiEnabled, setAiEnabled] = useState<boolean>(true)
  const [configText, setConfigText] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [auditsList, setAuditsList] = useState<AuditSummaryItem[]>([])
  const [unresolvedCount, setUnresolvedCount] = useState<number>(0)
  const [learnedCount, setLearnedCount] = useState<number>(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [error, setError] = useState<string>('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const progressStages = [
    { label: 'Upload Ingestion', active: isAnalyzing },
    { label: 'Multi-Vendor Detection', active: isAnalyzing },
    { label: 'Rule Parsing', active: isAnalyzing },
    { label: 'Unknown Syntax Isolation', active: isAnalyzing },
    { label: aiEnabled ? 'AI Normalization' : 'Deterministic Mode', active: isAnalyzing },
    { label: 'Compliance Engine', active: isAnalyzing },
    { label: 'Remediation Mapping', active: isAnalyzing },
  ]

  const refreshHealthAndAudits = async () => {
    try {
      await fetchHealth()
      setBackendStatus('online')
    } catch {
      setBackendStatus('offline')
    }

    try {
      const [audits, unknowns, mappings] = await Promise.all([
        listAudits(),
        listUnknownCommands(),
        listLearnedMappings(),
      ])
      setAuditsList(audits)
      setUnresolvedCount(unknowns.length)
      setLearnedCount(mappings.filter((m) => m.enabled).length)
    } catch {
      // Keep existing state if offline
    }
  }

  useEffect(() => {
    refreshHealthAndAudits()
  }, [])

  const handleFileSelect = async (file: File | null) => {
    if (!file) return
    setUploadedFile(file)
    const text = await file.text()
    setConfigText(text)
  }

  const handleAnalyze = async () => {
    if (!configText.trim() && !uploadedFile) {
      setError('Please provide a configuration file or text to audit.')
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      const fileToUpload =
        uploadedFile ??
        new File(
          [configText],
          `${selectedVendor === 'auto' ? 'network_device' : selectedVendor}_config.cfg`,
          { type: 'text/plain' }
        )

      const uploadResponse = await uploadAuditFile(fileToUpload)
      const auditId = uploadResponse.audit_id
      const analysisResult = await analyzeAudit(auditId, aiEnabled)
      const complianceResult = await evaluateCompliance(auditId, selectedFramework)

      setAuditResult({
        ...analysisResult,
        ...complianceResult,
        framework: complianceResult.framework,
        score: complianceResult.score,
        summary: complianceResult.summary,
        findings: complianceResult.findings,
      })

      // Refresh audits and metrics
      await refreshHealthAndAudits()
      setCurrentPage('results')
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Audit pipeline failed'
      setError(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleViewAudit = async (auditId: number, framework: string = 'CIS') => {
    setIsAnalyzing(true)
    setError('')
    try {
      const analysisResult = await analyzeAudit(auditId, aiEnabled)
      const complianceResult = await evaluateCompliance(auditId, framework || 'CIS')

      setAuditResult({
        ...analysisResult,
        ...complianceResult,
        framework: complianceResult.framework,
        score: complianceResult.score,
        summary: complianceResult.summary,
        findings: complianceResult.findings,
      })
      setCurrentPage('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit results')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDownloadReport = async (auditId: number) => {
    setIsDownloadingReport(true)
    try {
      await downloadAuditReport(auditId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report')
    } finally {
      setIsDownloadingReport(false)
    }
  }

  // If on home landing page, render full enterprise portal
  if (currentPage === 'home') {
    return (
      <LandingPage
        onNavigate={setCurrentPage}
        onStartAudit={() => setCurrentPage('audit')}
      />
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-primary text-text-primary font-sans antialiased">
      {/* Persistent Left Enterprise Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        backendStatus={backendStatus}
        unresolvedCount={unresolvedCount}
        hasActiveAudit={Boolean(auditResult)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Enterprise Header */}
        <Header
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          activeAuditId={auditResult?.audit_id}
          activeAuditHostname={auditResult?.device?.hostname}
          onDownloadReport={handleDownloadReport}
          isDownloadingReport={isDownloadingReport}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface-primary">
          {currentPage === 'dashboard' && (
            <DashboardPage
              audits={auditsList}
              unresolvedCount={unresolvedCount}
              learnedCount={learnedCount}
              onNavigate={setCurrentPage}
              onViewAudit={handleViewAudit}
              onDownloadReport={handleDownloadReport}
              isDownloading={isDownloadingReport}
            />
          )}

          {currentPage === 'audit' && (
            <AuditPage
              configText={configText}
              setConfigText={setConfigText}
              selectedVendor={selectedVendor}
              setSelectedVendor={setSelectedVendor}
              selectedFramework={selectedFramework}
              setSelectedFramework={setSelectedFramework}
              aiEnabled={aiEnabled}
              setAiEnabled={setAiEnabled}
              onFilePicked={handleFileSelect}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              uploadedFile={uploadedFile}
              error={error}
              progressStages={progressStages}
              audits={auditsList}
              onViewAudit={handleViewAudit}
              onDownloadReport={handleDownloadReport}
              isDownloading={isDownloadingReport}
            />
          )}

          {currentPage === 'results' && (
            <ResultsPage
              result={auditResult}
              onDownloadReport={handleDownloadReport}
              isDownloading={isDownloadingReport}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'training' && <TrainingPage />}

          {currentPage === 'reports' && (
            <ReportsPage
              audits={auditsList}
              onViewAudit={handleViewAudit}
              onDownloadReport={handleDownloadReport}
              isDownloading={isDownloadingReport}
              onRefresh={refreshHealthAndAudits}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              backendStatus={backendStatus}
              onRefreshHealth={refreshHealthAndAudits}
            />
          )}
        </main>
      </div>
    </div>
  )
}
