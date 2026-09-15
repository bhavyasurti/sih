import { useState, useRef, useMemo } from 'react'
import {
  FileCode2,
  AlertOctagon,
  Upload,
  Play,
  Loader2,
  Activity,
  Search,
  Download,
} from 'lucide-react'
import { VendorSelection, FrameworkSelection, AuditSummaryItem } from '../types'
import { StatusPill } from '../components/Shared'

export function AuditPage({
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
  const [showAdvanced, setShowAdvanced] = useState(false)

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
              Upload or paste running configurations to evaluate against CIS / NIST / STIG / ISO benchmarks
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
                    Supports Cisco IOS (.cfg), FortiOS (.conf), PAN-OS (.txt), Junos, AOS-CX, Gaia text configs up to 2MB
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
          <div className="space-y-4 rounded-lg bg-surface-panel border border-surface-border p-4 h-fit">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Analysis Settings</h3>
              <button 
                type="button" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[10px] font-semibold text-brand-primary hover:text-brand-bright transition-colors"
              >
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-surface-border/50">
                {/* Vendor Selection */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Target Vendor Architecture
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'auto' as VendorSelection, label: 'Auto-Detect' },
                      { id: 'cisco' as VendorSelection, label: 'Cisco IOS' },
                      { id: 'fortinet' as VendorSelection, label: 'Fortinet' },
                      { id: 'paloalto' as VendorSelection, label: 'Palo Alto' },
                      { id: 'juniper' as VendorSelection, label: 'Juniper' },
                      { id: 'aruba' as VendorSelection, label: 'Aruba AOS-CX' },
                      { id: 'checkpoint' as VendorSelection, label: 'Check Point' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedVendor(opt.id)}
                        className={`px-2 py-1 rounded text-[11px] font-medium border text-left transition-colors ${
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
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-primary mb-1.5">
                    Compliance Framework
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'CIS' as FrameworkSelection, label: 'CIS Benchmark' },
                      { id: 'NIST' as FrameworkSelection, label: 'NIST SP 800-53' },
                      { id: 'STIG' as FrameworkSelection, label: 'DISA STIG' },
                      { id: 'ISO' as FrameworkSelection, label: 'ISO 27001' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedFramework(opt.id)}
                        className={`px-2 py-1 rounded text-[11px] font-medium border text-left transition-colors ${
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
                      <div className="text-[11px] font-semibold text-text-primary">
                        AI-Assisted Normalization (Gemini)
                      </div>
                      <div className="text-[10px] text-text-secondary">
                        Suggest normalized security parameters for unparsed commands. Deterministic engine remains authoritative.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Run Audit Action */}
            <div className="pt-3 border-t border-surface-border">
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
            <>
              {/* Desktop Table View */}
              <table className="hidden md:table w-full min-w-[700px] whitespace-nowrap text-left text-xs border-collapse">
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
              
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredAudits.map((audit) => {
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
                            View Results
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
    </div>
  )
}
