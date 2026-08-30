import React from 'react'
import {
  Shield,
  LayoutDashboard,
  FileCode2,
  CheckSquare,
  GraduationCap,
  FileText,
  Settings,
  Activity,
  CircleDot,
  Layers,
  Home,
} from 'lucide-react'

export type PageKey = 'home' | 'dashboard' | 'audit' | 'results' | 'training' | 'reports' | 'settings'

interface SidebarProps {
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  backendStatus: 'checking' | 'online' | 'offline'
  unresolvedCount?: number
  hasActiveAudit?: boolean
}

export function Sidebar({
  currentPage,
  onNavigate,
  backendStatus,
  unresolvedCount = 0,
  hasActiveAudit = false,
}: SidebarProps) {
  const navGroups = [
    {
      label: 'PORTAL',
      items: [
        {
          key: 'home' as PageKey,
          label: 'Home / Overview',
          icon: Home,
        },
      ],
    },
    {
      label: 'OVERVIEW',
      items: [
        {
          key: 'dashboard' as PageKey,
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: 'AUDITING',
      items: [
        {
          key: 'audit' as PageKey,
          label: 'Configuration Audits',
          icon: FileCode2,
        },
        {
          key: 'results' as PageKey,
          label: 'Audit Results',
          icon: CheckSquare,
          badge: hasActiveAudit ? 'Active' : undefined,
          badgeVariant: 'active' as const,
        },
      ],
    },
    {
      label: 'KNOWLEDGE',
      items: [
        {
          key: 'training' as PageKey,
          label: 'Training Center',
          icon: GraduationCap,
          badge: unresolvedCount > 0 ? unresolvedCount : undefined,
          badgeVariant: 'warning' as const,
        },
      ],
    },
    {
      label: 'REPORTING',
      items: [
        {
          key: 'reports' as PageKey,
          label: 'Reports Archive',
          icon: FileText,
        },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        {
          key: 'settings' as PageKey,
          label: 'Settings & Telemetry',
          icon: Settings,
        },
      ],
    },
  ]

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-slate-800 bg-[#090d16] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80 bg-[#0b0f19]">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-400">
          <Shield size={20} className="stroke-[2.2]" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
            NetSecure <span className="text-sky-400 font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800/60">AI</span>
          </div>
          <div className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
            Enterprise Security
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.key

                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-600/15 text-sky-300 border border-sky-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        className={isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-300'}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          item.badgeVariant === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer / System Health */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0b0f19]/70 space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5 rounded bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-400 animate-pulse'
                  : backendStatus === 'offline'
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-slate-300 font-medium text-[11px]">
              {backendStatus === 'online'
                ? 'Backend Online'
                : backendStatus === 'offline'
                ? 'Backend Disconnected'
                : 'Connecting...'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">127.0.0.1:8000</span>
        </div>

        <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-mono">
          <span>Engine v2.4</span>
          <span>CIS &bull; NIST</span>
        </div>
      </div>
    </aside>
  )
}
