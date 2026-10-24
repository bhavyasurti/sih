import React from 'react'
import { Settings, Server, Network, Activity, Database, Shield, Cpu, Lock } from 'lucide-react'
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
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. EDITORIAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#D7DCE5]">
        <div>
          <div className="eyebrow mb-2">Engine Configuration</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0A282D] tracking-tight">
            System Settings & Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B60] mt-1">
            Engine health telemetry, database storage metrics, and active regulatory baselines.
          </p>
        </div>

        <button
          onClick={onRefreshHealth}
          className="btn btn--soft text-xs"
        >
          <Activity size={13} className="text-[#3DB663]" />
          <span>Refresh Health</span>
        </button>
      </div>

      {/* 2. PLATFORM STATUS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Services Status */}
        <div className="bg-white border border-[#D7DCE5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D7DCE5]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A282D] font-mono flex items-center gap-2">
              <Server size={15} className="text-[#0284C7]" />
              Core Infrastructure
            </h2>
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  backendStatus === 'online' ? 'bg-[#3DB663] animate-ping' : 'bg-[#E11D48]'
                }`}
              />
              <span
                className={
                  backendStatus === 'online' ? 'text-[#1E6E37]' : 'text-[#E11D48]'
                }
              >
                {backendStatus === 'online' ? 'Operational' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F3F7]">
              <span className="text-[#7E8F95]">Deterministic Backend</span>
              <span className="font-bold text-[#0A282D]">FastAPI / Python 3.11</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F3F7]">
              <span className="text-[#7E8F95]">API Health Route</span>
              <span className="text-[#3DB663] font-bold">GET /health &bull; 200 OK</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F3F7]">
              <span className="text-[#7E8F95]">Execution Boundary</span>
              <span className="text-[#0A282D] font-bold">Strict Offline Parsing (No Probe)</span>
            </div>
          </div>
        </div>

        {/* Regulatory Baselines Status */}
        <div className="bg-white border border-[#D7DCE5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D7DCE5]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A282D] font-mono flex items-center gap-2">
              <Shield size={15} className="text-[#3DB663]" />
              Regulatory Baselines
            </h2>
            <span className="text-[11px] font-mono text-[#3DB663] font-bold bg-[#EDF8F1] px-2.5 py-0.5 rounded-full border border-[#BFE7CB]">
              Active &amp; Enforced
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F3F7]">
              <span className="text-[#7E8F95]">CIS Benchmarks</span>
              <span className="font-bold text-[#0A282D]">Level 1 &amp; Level 2 Controls</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F3F7]">
              <span className="text-[#7E8F95]">NIST SP 800-53</span>
              <span className="font-bold text-[#0A282D]">Rev 5 AC, IA, SC, SI Families</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F3F7]">
              <span className="text-[#7E8F95]">Rule Evaluation</span>
              <span className="text-[#3DB663] font-bold">100% Deterministic Regex</span>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="bg-white border border-[#D7DCE5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D7DCE5]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A282D] font-mono flex items-center gap-2">
              <Database size={15} className="text-[#D97706]" />
              Persistent Storage
            </h2>
            <span className="text-xs font-mono text-[#7E8F95]">SQLite Engine</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F3F7]">
              <span className="text-[#7E8F95]">Local Database</span>
              <span className="font-bold text-[#0A282D]">netsecure.db</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F3F7]">
              <span className="text-[#7E8F95]">Audit History Table</span>
              <span className="text-[#3DB663] font-bold">Synchronized</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F3F7]">
              <span className="text-[#7E8F95]">Learned Rules Registry</span>
              <span className="text-[#3DB663] font-bold">Encrypted &amp; Indexed</span>
            </div>
          </div>
        </div>

        {/* Auditor Profile Quick Link */}
        <div className="bg-white border border-[#D7DCE5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D7DCE5]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A282D] font-mono flex items-center gap-2">
              <Lock size={15} className="text-[#0A282D]" />
              Auditor Session
            </h2>
            <span className="text-xs font-mono text-[#3DB663] font-bold">Authorized</span>
          </div>

          <p className="text-xs text-[#4A5B60] leading-relaxed">
            Manage your cryptographic session credentials, Firebase authentication provider, and audit identity.
          </p>

          <div className="pt-2">
            <button
              onClick={() => navigate('/profile')}
              className="btn btn--green text-xs"
            >
              <span>Manage Auditor Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
