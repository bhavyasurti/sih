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
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export type PageKey = 'home' | 'dashboard' | 'audit' | 'results' | 'training' | 'reports' | 'settings'

interface SidebarProps {
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  backendStatus: 'checking' | 'online' | 'offline'
  unresolvedCount?: number
  hasActiveAudit?: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({
  currentPage,
  onNavigate,
  backendStatus,
  unresolvedCount = 0,
  hasActiveAudit = false,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
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
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside 
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          flex-shrink-0 flex flex-col border-r border-slate-800 bg-[#090d16] text-slate-300 select-none
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:w-16 w-64' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#0b0f19]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-400">
              <Shield size={20} className="stroke-[2.2]" />
            </div>
            <div className={`transition-opacity duration-300 whitespace-nowrap ${isCollapsed ? 'md:opacity-0 md:w-0 md:overflow-hidden' : 'opacity-100'}`}>
              <div className="text-sm font-bold tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
                NetSecure <span className="text-sky-400 font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800/60">AI</span>
              </div>
              <div className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                Enterprise Security
              </div>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button 
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800" 
            onClick={onMobileClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 py-4 space-y-6 overflow-y-auto no-scrollbar overflow-x-hidden">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className={`px-4 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase transition-all whitespace-nowrap ${isCollapsed ? 'md:text-center md:text-[9px] md:px-1' : ''}`}>
                {isCollapsed ? group.label.substring(0,3) : group.label}
              </div>
              <div className="space-y-1 px-2">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.key

                  return (
                    <button
                      key={item.key}
                      onClick={() => { onNavigate(item.key); onMobileClose(); }}
                      className={`w-full flex items-center px-2 py-2 rounded-md text-xs font-medium transition-colors group relative ${
                        isActive
                          ? 'bg-sky-600/15 text-sky-300 border border-sky-500/30 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      } ${isCollapsed ? 'md:justify-center' : 'justify-between'}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={18}
                          className={`flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-300'}`}
                        />
                        <span className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100'}`}>
                          {item.label}
                        </span>
                      </div>

                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            item.badgeVariant === 'warning'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Badge dot for collapsed state */}
                      {isCollapsed && item.badge !== undefined && (
                        <span className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full hidden md:block ${
                            item.badgeVariant === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                        }`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

      {/* Sidebar Footer / System Health */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0b0f19]/70 relative flex flex-col gap-2">
        <div className={`flex items-center rounded bg-slate-900/90 border border-slate-800 transition-all ${isCollapsed ? 'md:justify-center p-1.5' : 'justify-between px-2 py-1.5'}`}>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`flex-shrink-0 h-2 w-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-400 animate-pulse'
                  : backendStatus === 'offline'
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className={`text-slate-300 font-medium text-[11px] whitespace-nowrap transition-opacity ${isCollapsed ? 'md:hidden' : ''}`}>
              {backendStatus === 'online'
                ? 'Backend Online'
                : backendStatus === 'offline'
                ? 'Backend Disconnected'
                : 'Connecting...'}
            </span>
          </div>
          <span className={`text-[10px] font-mono text-slate-400 whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>
            127.0.0.1:8000
          </span>
        </div>

        <div className={`flex items-center justify-between px-2 text-[10px] text-slate-400 font-mono transition-opacity ${isCollapsed ? 'md:hidden' : ''}`}>
          <span>Engine v2.4</span>
          <span>CIS &bull; NIST</span>
        </div>

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-3 top-[-12px] h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100 z-50 shadow-lg"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
    </>
  )
}
