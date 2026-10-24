import { useState, useRef, useMemo } from 'react'
import {
  FileCode2,
  AlertOctagon,
  Upload,
  Play,
  Loader2,
  Search,
  Download,
  FileText,
  Sliders,
  Check,
  ChevronDown,
  ArrowRight,
  Shield,
  Activity,
  Sparkles
} from 'lucide-react'
import { VendorSelection, FrameworkSelection, AuditSummaryItem } from '../types'
import { StatusPill } from '../components/Shared'
import { usePageEntrance } from '../utils/motion'

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
  const containerRef = useRef<HTMLDivElement | null>(null)
  usePageEntrance(containerRef, '.animate-reveal', 0.06)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload')
  const [searchFilter, setSearchFilter] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)

  const filteredAudits = useMemo(() => {
    return audits.filter(
      (a) =>
        a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        String(a.id).includes(searchFilter) ||
        (a.framework || '').toLowerCase().includes(searchFilter.toLowerCase())
    )
  }, [audits, searchFilter])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFilePicked(e.dataTransfer.files[0])
    }
  }

  return (
    <div ref={containerRef} className="space-y-8 max-w-7xl mx-auto">
      {/* 1. EDITORIAL HEADER */}
      <div className="animate-reveal pb-4 border-b border-[#D7DCE5]">
        <div className="eyebrow mb-2">Ingestion Console</div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0A282D] tracking-tight">
          Configuration Audits
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5B60] mt-1">
          Ingest raw device running configurations for deterministic rule parsing, syntax isolation, and regulatory compliance evaluation.
        </p>
      </div>

      {/* 2. MAIN INGESTION CONSOLE */}
      <div className="animate-reveal bg-white border border-[#D7DCE5] rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Console Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D7DCE5]">
          <div>
            <h2 className="text-base font-display font-bold text-[#0A282D]">
              Select Ingestion Method
            </h2>
            <p className="text-xs text-[#7E8F95] mt-0.5">
              Choose between raw file upload (.cfg, .txt, .conf) or direct CLI buffer input.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-full bg-[#F2F3F7] border border-[#D7DCE5] text-xs font-mono">
            <button
              onClick={() => setInputMode('upload')}
              className={`px-4 py-1.5 rounded-full font-bold uppercase transition-all ${
                inputMode === 'upload'
                  ? 'bg-[#0A282D] text-white shadow-xs'
                  : 'text-[#4A5B60] hover:text-[#0A282D]'
              }`}
            >
              Upload Config File
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-4 py-1.5 rounded-full font-bold uppercase transition-all ${
                inputMode === 'paste'
                  ? 'bg-[#0A282D] text-white shadow-xs'
                  : 'text-[#4A5B60] hover:text-[#0A282D]'
              }`}
            >
              Paste CLI Buffer
            </button>
          </div>
        </div>

        {/* Input Zones */}
        <div className="py-6">
          {inputMode === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all group ${
                isDragActive
                  ? 'border-[#3DB663] bg-[#EDF8F1]/80 scale-[1.005]'
                  : 'border-[#D7DCE5] hover:border-[#3DB663] bg-[#F2F3F7]/40 hover:bg-[#F2F3F7]/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.cfg,.conf,.json,.log"
                onChange={(e) => onFilePicked(e.target.files?.[0] || null)}
              />
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#D7DCE5] text-[#3DB663] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-xs">
                <Upload size={24} className="stroke-[2.5]" />
              </div>
              <h3 className="text-base font-display font-bold text-[#0A282D]">
                {uploadedFile ? uploadedFile.name : 'Drop device configuration file here'}
              </h3>
              <p className="text-xs text-[#7E8F95] mt-1 max-w-sm mx-auto font-mono">
                {uploadedFile
                  ? `${(uploadedFile.size / 1024).toFixed(1)} KB · Ready for deterministic audit`
                  : 'Supports Cisco IOS/NX-OS, Fortinet FortiOS, PAN-OS, Junos OS, Aruba CX, and Gaia (.cfg, .txt, .conf)'}
              </p>

              {/* Supported Vendor Badges */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="tag text-[10px]"><i></i>Cisco IOS</span>
                <span className="tag text-[10px]"><i></i>Fortinet FortiOS</span>
                <span className="tag text-[10px]"><i></i>Palo Alto PAN-OS</span>
                <span className="tag text-[10px]"><i></i>Juniper Junos</span>
                <span className="tag text-[10px]"><i></i>Aruba AOS-CX</span>
                <span className="tag text-[10px]"><i></i>Check Point Gaia</span>
              </div>

              <div className="mt-4">
                <span className="btn btn--soft text-xs">
                  Browse Local Files
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#7E8F95]">
                <span>Paste running-configuration buffer</span>
                <span>{configText.length} characters</span>
              </div>
              <textarea
                rows={10}
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                placeholder={`! Sample Cisco IOS Configuration\nhostname CORE-RTR-01\n!\nservice password-encryption\nno ip http server\nip ssh version 2\n!\nline vty 0 4\n transport input ssh\n login authentication default\n!`}
                className="w-full font-mono text-xs bg-[#0A282D] text-white p-4 rounded-2xl border border-[#1E4950] focus:outline-none focus:border-[#3DB663] focus:ring-1 focus:ring-[#3DB663] leading-relaxed resize-y shadow-inner"
              />
            </div>
          )}
        </div>

        {/* Configuration Parameters & Framework Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#D7DCE5]">
          {/* Target Vendor */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#0A282D]">
              Target Vendor Family
            </label>
            <div className="relative">
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value as VendorSelection)}
                className="w-full appearance-none bg-[#F2F3F7] border border-[#D7DCE5] text-[#0A282D] text-xs font-mono rounded-full px-4 py-2.5 pr-8 focus:outline-none focus:border-[#3DB663]"
              >
                <option value="auto">Auto-Detect Grammar (Recommended)</option>
                <option value="cisco">Cisco Systems (IOS / IOS-XE / NX-OS)</option>
                <option value="fortinet">Fortinet (FortiOS)</option>
                <option value="paloalto">Palo Alto Networks (PAN-OS)</option>
                <option value="juniper">Juniper Networks (Junos OS)</option>
                <option value="aruba">Aruba Networks (AOS-CX)</option>
                <option value="checkpoint">Check Point (Gaia OS)</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7E8F95] pointer-events-none"
              />
            </div>
          </div>

          {/* Regulatory Baseline */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#0A282D]">
              Regulatory Baseline
            </label>
            <div className="relative">
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value as FrameworkSelection)}
                className="w-full appearance-none bg-[#F2F3F7] border border-[#D7DCE5] text-[#0A282D] text-xs font-mono rounded-full px-4 py-2.5 pr-8 focus:outline-none focus:border-[#3DB663]"
              >
                <option value="CIS">CIS Benchmark (Level 1 & Level 2)</option>
                <option value="NIST">NIST SP 800-53 (Rev 5 Security Controls)</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7E8F95] pointer-events-none"
              />
            </div>
          </div>

          {/* AI Explanations Toggle */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#0A282D]">
              Analysis Engine Mode
            </label>
            <button
              type="button"
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-full border text-xs font-mono font-bold transition-all ${
                aiEnabled
                  ? 'bg-[#EDF8F1] border-[#BFE7CB] text-[#1E6E37]'
                  : 'bg-[#F2F3F7] border-[#D7DCE5] text-[#4A5B60]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className={aiEnabled ? 'text-[#3DB663]' : 'text-[#7E8F95]'} />
                <span>{aiEnabled ? 'AI Rationale: Enabled' : 'Deterministic Only'}</span>
              </span>
              <span className={`h-2.5 w-2.5 rounded-full ${aiEnabled ? 'bg-[#3DB663]' : 'bg-[#7E8F95]'}`} />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-mono flex items-center gap-3">
            <AlertOctagon size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Progress Pipeline Stages (When Analyzing) */}
        {isAnalyzing && (
          <div className="mt-6 p-6 rounded-2xl bg-[#F2F3F7] border border-[#D7DCE5] space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#0A282D] flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#3DB663]" />
                Executing Deterministic Ingestion Pipeline...
              </span>
              <span className="text-[#3DB663] font-bold">Live Execution</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {progressStages.map((stage, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl text-center text-[10px] font-mono border transition-all ${
                    stage.active
                      ? 'bg-white border-[#3DB663] text-[#0A282D] shadow-2xs font-bold'
                      : 'bg-white/40 border-[#D7DCE5] text-[#7E8F95]'
                  }`}
                >
                  <div className="mb-1 text-[9px] text-[#7E8F95]">0{idx + 1}</div>
                  <div className="truncate">{stage.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution CTA Action */}
        <div className="mt-8 pt-6 border-t border-[#D7DCE5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#7E8F95] font-mono">
            Pure offline configuration parsing · Zero direct production equipment modifications
          </div>

          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || (!configText.trim() && !uploadedFile)}
            className="btn btn--green text-sm px-6 py-3 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Running Audit Pipeline...</span>
              </>
            ) : (
              <>
                <Play size={15} className="stroke-[2.5]" />
                <span>Execute Compliance Audit</span>
                <span className="btn-ico">
                  <ArrowRight size={13} className="stroke-[2.5]" />
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. HISTORICAL INGESTIONS TABLE */}
      <div className="animate-reveal bg-white border border-[#D7DCE5] rounded-3xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#D7DCE5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-display font-bold text-[#0A282D]">
              Historical Ingestion Records
            </h2>
            <p className="text-xs text-[#4A5B60] mt-0.5">
              Select any past configuration audit to inspect findings or export reports.
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E8F95]" />
            <input
              type="text"
              placeholder="Search previous audits..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 pr-3.5 py-1.5 text-xs font-mono bg-[#F2F3F7] border border-[#D7DCE5] rounded-full text-[#0A282D] placeholder:text-[#7E8F95] focus:outline-none focus:border-[#3DB663] w-full sm:w-64"
            />
          </div>
        </div>

        {filteredAudits.length === 0 ? (
          <div className="p-10 text-center text-[#7E8F95] font-mono text-xs">
            No previous configuration records match your search filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D7DCE5] bg-[#F2F3F7] font-mono text-[11px] font-bold uppercase tracking-wider text-[#7E8F95]">
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">Config Title</th>
                  <th className="py-3.5 px-5">Framework</th>
                  <th className="py-3.5 px-5 text-center">Score</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7DCE5] font-mono">
                {filteredAudits.slice(0, 10).map((a) => (
                  <tr key={a.id} className="hover:bg-[#F2F3F7]/50 transition-colors">
                    <td className="py-3 px-5 font-bold text-[#0A282D]">#{a.id}</td>
                    <td className="py-3 px-5 font-sans font-semibold text-[#0A282D] truncate max-w-xs">
                      {a.title}
                    </td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 rounded-full bg-[#F2F3F7] border border-[#D7DCE5] text-[#4A5B60] text-[10px] font-bold">
                        {a.framework || 'CIS'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center font-bold">
                      {a.compliance_score !== null ? (
                        <span className={a.compliance_score >= 70 ? 'text-[#3DB663]' : 'text-[#E11D48]'}>
                          {a.compliance_score}%
                        </span>
                      ) : (
                        <span className="text-[#7E8F95]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => onViewAudit(a.id, a.framework || 'CIS')}
                        className="px-3 py-1 bg-white hover:bg-[#F2F3F7] border border-[#D7DCE5] rounded-full text-[#0A282D] font-bold text-[11px] uppercase transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
