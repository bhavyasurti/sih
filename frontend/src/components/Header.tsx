import React from 'react'
import {
  Download,
  Plus,
  ShieldCheck,
  FileText,
  Loader2,
  ChevronRight,
  RefreshCw,
  Menu,
} from 'lucide-react'
import { PageKey } from './Sidebar'

interface HeaderProps {
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  activeAuditId?: number | null
  activeAuditHostname?: string | null
  onDownloadReport?: (auditId: number) => void
  isDownloadingReport?: boolean
  onMenuClick?: () => void
}

export function Header({
  currentPage,
  onNavigate,
  activeAuditId,
  activeAuditHostname,
  onDownloadReport,
  isDownloadingReport = false,
  onMenuClick,
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
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-surface-border bg-surface-primary min-w-0">
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 -ml-1.5 rounded hover:bg-surface-hover text-text-secondary transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium min-w-0 truncate">
          <span className="hidden sm:inline truncate">{currentMeta.section}</span>
          <ChevronRight size={12} className="hidden sm:block text-text-secondary flex-shrink-0" />
          <span className="text-text-primary font-semibold truncate">{currentMeta.title}</span>
        </div>
      </div>

      {/* Global Action Bar */}
      <div className="flex items-center gap-2.5 flex-shrink-0 pl-2">
        {/* If an audit result is active and we are on results/reports page, show direct PDF Download */}
        {activeAuditId && (
          <button
            onClick={() => onDownloadReport && onDownloadReport(activeAuditId)}
            disabled={isDownloadingReport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-secondary hover:bg-surface-hover border border-surface-border text-text-primary text-xs font-semibold transition-colors disabled:opacity-50"
            title="Download PDF report for current audit"
          >
            {isDownloadingReport ? (
              <Loader2 size={13} className="animate-spin text-brand-bright" />
            ) : (
              <Download size={13} className="text-brand-bright" />
            )}
            <span className="hidden sm:inline">{isDownloadingReport ? 'Generating...' : 'Download PDF'}</span>
          </button>
        )}

        {/* Primary "+ New Audit" CTA */}
        {currentPage !== 'audit' && (
          <button
            onClick={() => onNavigate('audit')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-brand-primary hover:bg-brand-bright text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span className="hidden sm:inline">New Audit</span>
          </button>
        )}
      </div>
    </header>
  )
}
