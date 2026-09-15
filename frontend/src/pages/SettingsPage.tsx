import React from 'react'
import { Settings, Shield, Server, Bot, Activity, Network, FileText, Database, ShieldCheck, Cpu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function SettingsPage({
  backendStatus,
  onRefreshHealth,
}: {
  backendStatus: 'checking' | 'online' | 'offline'
  onRefreshHealth: () => void
}) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary uppercase tracking-tight flex items-center gap-2">
            <Settings size={22} className="text-brand-primary" />
            System Settings & Status
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your NetSecure AI platform configuration and security policies
          </p>
        </div>
        <button
          onClick={onRefreshHealth}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-border/50 hover:bg-surface-border border border-surface-border text-text-primary text-xs font-semibold transition-colors"
        >
          <Activity size={13} />
          <span>Refresh Status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PLATFORM STATUS */}
        <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-surface-border flex items-center gap-2">
            <Server size={15} className="text-emerald-400" />
            Platform Status
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded bg-surface-primary border border-surface-border">
              <div className="flex items-center gap-3">
                <Network size={16} className="text-text-secondary" />
                <span className="text-sm font-semibold text-text-primary">Core Services</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className={`h-2 w-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                <span className={backendStatus === 'online' ? 'text-emerald-400' : 'text-rose-500'}>
                  {backendStatus === 'online' ? 'Operational' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ACCOUNT SECURITY */}
        <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-surface-border flex items-center gap-2">
            <ShieldCheck size={15} className="text-brand-primary" />
            Account Security
          </h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded bg-surface-primary border border-surface-border gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-primary/20 text-brand-bright flex items-center justify-center font-bold">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{user?.name || 'Authorized User'}</div>
                <div className="text-xs text-text-secondary">{user?.email || 'user@enterprise.com'}</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-3 py-1.5 rounded bg-surface-secondary hover:bg-surface-hover border border-surface-border text-text-primary text-xs font-semibold transition-colors"
            >
              My Profile
            </button>
          </div>
        </div>

        {/* SECURITY & COMPLIANCE */}
        <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-surface-border flex items-center gap-2">
            <Shield size={15} className="text-brand-primary" />
            Security & Compliance Frameworks
          </h2>
          
          <div className="space-y-3">
            <div className="p-3 rounded bg-surface-primary border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-text-primary">CIS Network Benchmark v1.0</div>
                <div className="text-[11px] text-text-secondary mt-0.5">Authoritative security baselines for network devices</div>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                ACTIVE
              </span>
            </div>

            <div className="p-3 rounded bg-surface-primary border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-text-primary">NIST SP 800-53 Rev. 5</div>
                <div className="text-[11px] text-text-secondary mt-0.5">Access Control & Transmission Confidentiality</div>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                ACTIVE
              </span>
            </div>

            <div className="p-3 rounded bg-surface-primary border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 opacity-60">
              <div>
                <div className="text-sm font-semibold text-text-primary">DISA STIG</div>
                <div className="text-[11px] text-text-secondary mt-0.5">Infrastructure Guidelines</div>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold bg-surface-secondary text-text-secondary border border-surface-border">
                FUTURE PACK
              </span>
            </div>

            <div className="p-3 rounded bg-surface-primary border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 opacity-60">
              <div>
                <div className="text-sm font-semibold text-text-primary">ISO/IEC 27001</div>
                <div className="text-[11px] text-text-secondary mt-0.5">Security Management & Boundary Protection</div>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold bg-surface-secondary text-text-secondary border border-surface-border">
                FUTURE PACK
              </span>
            </div>
          </div>
        </div>

        {/* AUDIT ENGINE & AI */}
        <div className="space-y-6">
          <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-surface-border flex items-center gap-2">
              <Cpu size={15} className="text-brand-primary" />
              Audit Engine
            </h2>
            
            <div className="p-3 rounded bg-surface-primary border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-text-primary">Deterministic Compliance Engine</div>
                <div className="text-[11px] text-text-secondary mt-0.5 max-w-[250px]">
                  Supported Vendors: Cisco IOS/IOS-XE, Fortinet FortiOS, Palo Alto PAN-OS, Juniper Junos, Aruba AOS-CX, Check Point Gaia
                </div>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                ACTIVE
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-surface-border flex items-center gap-2">
              <Bot size={15} className="text-brand-primary" />
              AI Security Copilot
            </h2>
            
            <div className="p-3 rounded bg-surface-primary border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-text-primary">Gemini AI Integration</div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Automated finding reviews, syntactic learning, and remediation proposals
                </div>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary/20 text-brand-bright border border-brand-primary/40">
                AVAILABLE
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-surface-border flex items-center gap-2">
              <Database size={15} className="text-brand-primary" />
              Data & Reporting
            </h2>
            
            <div className="space-y-3">
              <div className="p-2.5 rounded bg-surface-primary border border-surface-border flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-2">
                  <FileText size={14} className="text-text-secondary" />
                  Audit Reports & PDF Exports
                </span>
                <span className="text-emerald-400 text-[10px] font-bold">AVAILABLE</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
