import React from 'react'
import {
  Download,
  Plus,
  Loader2,
  ChevronRight,
  Menu,
  Shield,
  Activity,
  FileCode2
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
      desc: 'Deterministic multi-vendor network security compliance & verified remediation',
    },
    dashboard: {
      section: 'OVERVIEW',
      title: 'Fleet Security Posture',
      desc: 'Multi-vendor compliance score telemetry, active risk index, and network topology',
    },
    audit: {
      section: 'AUDITING',
      title: 'Configuration Audits',
      desc: 'Ingest raw device running configurations for deterministic rule parsing & compliance',
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
      desc: 'Formal executive & technical audit reports in PDF format',
    },
    settings: {
      section: 'SYSTEM',
      title: 'System Settings & Telemetry',
      desc: 'Compliance framework baselines, rule registry status, and database metrics',
    },
    profile: {
      section: 'ACCOUNT',
      title: 'Auditor Profile',
      desc: 'Manage your authenticated session and account security details',
    },
  }

  const currentMeta = pageTitles[currentPage]

  return (
    <header className="h-20 flex-shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-[#D7DCE5] bg-[#F2F3F7] min-w-0">
      {/* Breadcrumb & Section Eyebrow */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white text-[#0A282D] transition-colors border border-[#D7DCE5]"
            aria-label="Open mobile menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2 text-xs text-[#7E8F95] font-medium min-w-0 truncate font-mono">
          <span className="hidden sm:inline tracking-wider uppercase font-bold text-[#3DB663] bg-[#EDF8F1] px-2 py-0.5 rounded-full border border-[#BFE7CB]">
            {currentMeta.section}
          </span>
          <ChevronRight size={12} className="hidden sm:block text-[#A6B0C0] flex-shrink-0" />
          <span className="text-[#0A282D] font-display font-bold text-base truncate">
            {currentMeta.title}
          </span>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Auditor Clearance Badge */}
        <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D7DCE5] shadow-2xs font-mono text-xs text-[#4A5B60]">
          <span className="h-2 w-2 rounded-full bg-[#3DB663] animate-ping" />
          <span className="font-semibold text-[#0A282D]">Auditor Session Active</span>
        </div>

        {/* Dynamic Context Buttons */}
        {currentPage === 'results' && activeAuditId && onDownloadReport && (
          <button
            onClick={() => onDownloadReport(activeAuditId)}
            disabled={isDownloadingReport}
            className="btn btn--green text-xs px-4 py-2"
          >
            {isDownloadingReport ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} className="stroke-[2.5]" />
            )}
            <span>Export Official PDF</span>
          </button>
        )}

        {currentPage !== 'audit' && (
          <button
            onClick={() => onNavigate('audit')}
            className="btn btn--green text-xs px-4 py-2"
          >
            <Plus size={13} className="stroke-[2.5]" />
            <span className="hidden sm:inline">New Audit</span>
          </button>
        )}
      </div>
    </header>
  )
}
