import React from 'react'
import {
  Download,
  Plus,
  ShieldCheck,
  FileText,
  Loader2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { PageKey } from './Sidebar'

interface HeaderProps {
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  activeAuditId?: number | null
  activeAuditHostname?: string | null
  onDownloadReport?: (auditId: number) => void
  isDownloadingReport?: boolean
}

export function Header({
  currentPage,
  onNavigate,
  activeAuditId,
  activeAuditHostname,
  onDownloadReport,
  isDownloadingReport = false,
}: HeaderProps) {
  const pageTitles: Record<PageKey, { section: string; title: string; desc: string }> = {
    home: {
      section: 'PORTAL',
      title: 'NetSecure AI Enterprise Platform',
      desc: 'AI-driven multi-vendor network security compliance & deterministic remediation',
    },
    dashboard: {
      section: 'OVERVIEW',
      title: 'Security Compliance Dashboard',
      desc: 'Multi-vendor fleet compliance posture, rule telemetry, and risk metrics',
    },
    audit: {
      section: 'AUDITING',
      title: 'Configuration Audits',
      desc: 'Ingest raw network configurations for deterministic rule parsing & compliance',
    },
    results: {
      section: 'AUDITING',
      title: 'Compliance Evaluation Results',
      desc: activeAuditHostname
        ? `Audit #${activeAuditId} for device ${activeAuditHostname}`
        : 'Detailed control findings, evidence, and deterministic CLI remediations',
    },
    training: {
      section: 'KNOWLEDGE',
      title: 'Training Center & Adaptive Rules',
      desc: 'Review unknown command syntax and maintain authoritative learned mappings',
    },
    reports: {
      section: 'REPORTING',
      title: 'Compliance Reports Archive',
      desc: 'Download formal executive & technical audit reports in PDF format',
    },
    settings: {
      section: 'SYSTEM',
      title: 'System Settings & Telemetry',
      desc: 'Compliance framework baselines, rule registry status, and database metrics',
    },
  }

  const currentMeta = pageTitles[currentPage]

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-800 bg-[#0c101b]">
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>{currentMeta.section}</span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-slate-200 font-semibold">{currentMeta.title}</span>
        </div>
      </div>

      {/* Global Action Bar */}
      <div className="flex items-center gap-2.5">
        {/* If an audit result is active and we are on results/reports page, show direct PDF Download */}
        {activeAuditId && (
          <button
            onClick={() => onDownloadReport && onDownloadReport(activeAuditId)}
            disabled={isDownloadingReport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Download PDF report for current audit"
          >
            {isDownloadingReport ? (
              <Loader2 size={13} className="animate-spin text-sky-400" />
            ) : (
              <Download size={13} className="text-sky-400" />
            )}
            <span>{isDownloadingReport ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
        )}

        {/* Primary "+ New Audit" CTA */}
        {currentPage !== 'audit' && (
          <button
            onClick={() => onNavigate('audit')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>New Audit</span>
          </button>
        )}
      </div>
    </header>
  )
}
