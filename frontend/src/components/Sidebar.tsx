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
  ChevronLeft,
  LogOut,
  X,
  UserCheck,
  ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export type PageKey = 'home' | 'dashboard' | 'audit' | 'results' | 'training' | 'reports' | 'settings' | 'profile'

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
  const { user, logout } = useAuth()
  const navGroups: { label: string; isMobileOnly?: boolean; items: { key: PageKey; label: string; icon: React.ElementType; badge?: string | number; badgeVariant?: 'active' | 'warning' }[] }[] = [
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
          label: 'Settings',
          icon: Settings,
        },
        {
          key: 'profile' as PageKey,
          label: 'My Profile',
          icon: UserCheck,
        },
      ],
    }
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-surface-primary/80 backdrop-blur-sm transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside 
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          flex-shrink-0 flex flex-col border-r border-surface-border bg-surface-secondary text-text-primary select-none
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:w-16 w-64' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-border bg-surface-primary">
          <Link to="/" className="flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-90">
            <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/20 border border-brand-primary/30 text-brand-bright">
              <Shield size={20} className="stroke-[2.2]" />
            </div>
            <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100 w-auto'}`}>
              <div className="text-sm font-bold tracking-wider text-text-primary uppercase flex items-center gap-1.5">
                NetSecure <span className="text-brand-bright font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-surface-panel border border-brand-primary/30">AI</span>
              </div>
              <div className="text-[10px] font-medium text-text-secondary tracking-wider uppercase">
                Enterprise Security
              </div>
            </div>
          </Link>
          
          {/* Mobile close button */}
          <button 
            className="md:hidden p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-surface-hover" 
            onClick={onMobileClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 py-4 space-y-6 overflow-y-auto no-scrollbar overflow-x-hidden">
          {navGroups.map((group) => {
            if (group.isMobileOnly && !isMobileOpen) return null;
            return (
            <div key={group.label} className={`space-y-1 ${group.isMobileOnly ? 'md:hidden' : ''}`}>
              <div className={`px-4 pb-1.5 text-[10px] font-semibold tracking-wider text-text-secondary uppercase transition-all whitespace-nowrap ${isCollapsed ? 'md:text-center md:text-[9px] md:px-1' : ''}`}>
                {isCollapsed ? group.label.substring(0,3) : group.label}
              </div>
              <div className="space-y-1 px-2">
                {group.items.map((item) => {
                  // Only show My Profile in the SYSTEM group if we are in the mobile drawer
                  if (item.key === 'profile' && !isMobileOpen) return null;
                  
                  const Icon = item.icon
                  const isActive = currentPage === item.key

                  return (
                    <button
                      key={item.key}
                      onClick={() => { onNavigate(item.key); onMobileClose(); }}
                      className={`w-full flex items-center px-2 py-2 rounded-md text-xs font-medium transition-colors group relative ${
                        isActive
                          ? 'bg-brand-primary/15 text-brand-bright border border-brand-primary/30 font-semibold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent'
                      } ${isCollapsed ? 'md:justify-center' : 'justify-between'}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={18}
                          className={`flex-shrink-0 ${isActive ? 'text-brand-bright' : 'text-text-secondary group-hover:text-text-primary'}`}
                        />
                        <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100 w-auto'}`}>
                          {item.label}
                        </span>
                      </div>

                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            item.badgeVariant === 'warning'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-brand-primary/20 text-brand-bright border border-brand-primary/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Badge dot for collapsed state */}
                      {isCollapsed && item.badge !== undefined && (
                        <span className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full hidden md:block ${
                            item.badgeVariant === 'warning' ? 'bg-amber-500' : 'bg-brand-primary'
                        }`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          )}
        </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-surface-border bg-surface-primary/70 relative flex flex-col gap-2">
        <button 
          onClick={() => { onNavigate('profile'); onMobileClose(); }}
          className={`pt-2 mt-1 flex items-center justify-between transition-colors rounded p-1.5 hover:bg-surface-hover w-full text-left ${isCollapsed ? 'md:justify-center' : 'px-2'}`}
        >
          {!isCollapsed && (
            <div className="flex flex-col truncate pr-2">
              <span className="text-[11px] font-medium text-text-primary truncate">{user?.name || 'User'}</span>
              <span className="text-[9px] text-text-secondary truncate">{user?.email}</span>
            </div>
          )}
          {isCollapsed && (
            <div className="h-6 w-6 rounded-full bg-brand-primary/20 text-brand-bright flex items-center justify-center font-bold text-[10px]">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-3 top-[-12px] h-6 w-6 items-center justify-center rounded-full bg-surface-panel border border-surface-border text-text-secondary hover:bg-surface-hover hover:text-text-primary z-50 shadow-lg"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
    </>
  )
}
