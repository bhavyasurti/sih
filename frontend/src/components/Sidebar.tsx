import React from 'react'
import {
  Shield,
  LayoutDashboard,
  FileCode2,
  CheckSquare,
  GraduationCap,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
  LogOut,
  Activity,
  ArrowRight
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

  const navGroups: {
    label: string
    items: {
      key: PageKey
      label: string
      icon: React.ElementType
      badge?: string | number
      badgeVariant?: 'active' | 'warning'
    }[]
  }[] = [
    {
      label: 'OVERVIEW',
      items: [
        {
          key: 'dashboard',
          label: 'Fleet Posture',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: 'AUDITING',
      items: [
        {
          key: 'audit',
          label: 'Configuration Audits',
          icon: FileCode2,
        },
        {
          key: 'results',
          label: 'Audit Results',
          icon: CheckSquare,
          badge: hasActiveAudit ? 'Active' : undefined,
          badgeVariant: 'active',
        },
      ],
    },
    {
      label: 'KNOWLEDGE',
      items: [
        {
          key: 'training',
          label: 'Training Center',
          icon: GraduationCap,
          badge: unresolvedCount > 0 ? unresolvedCount : undefined,
          badgeVariant: 'warning',
        },
      ],
    },
    {
      label: 'REPORTING',
      items: [
        {
          key: 'reports',
          label: 'Reports Archive',
          icon: FileText,
        },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        {
          key: 'settings',
          label: 'System Settings',
          icon: Settings,
        },
        {
          key: 'profile',
          label: 'Auditor Profile',
          icon: UserCheck,
        },
      ],
    },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#D7DCE5] text-[#0A282D]">
      {/* 1. Header / Brand Mark */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-[#D7DCE5]">
        <Link
          to="/"
          className={`flex items-center gap-3 transition-opacity ${
            isCollapsed ? 'justify-center w-full' : ''
          }`}
          title="NetSecure AI Home"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#0A282D] text-white shadow-xs">
            <Shield size={20} className="text-[#3DB663] stroke-[2.4]" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-base font-display font-bold tracking-tight text-[#0A282D] flex items-center gap-1.5">
                <span>NetSecure</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#3DB663] text-white uppercase">
                  AI
                </span>
              </div>
              <div className="text-[9px] tracking-widest text-[#7E8F95] uppercase font-mono font-medium truncate">
                Deterministic Engine
              </div>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-2 rounded-xl text-[#7E8F95] hover:text-[#0A282D] hover:bg-[#F2F3F7]"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* 2. Navigation Items List */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-mono font-bold tracking-wider uppercase text-[#7E8F95] mb-2">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.key

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onNavigate(item.key)
                    onMobileClose()
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0A282D] text-white shadow-sm'
                      : 'text-[#4A5B60] hover:text-[#0A282D] hover:bg-[#F2F3F7]'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon
                    size={17}
                    className={`flex-shrink-0 ${
                      isActive ? 'text-[#3DB663]' : 'text-[#7E8F95]'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left font-display">
                      {item.label}
                    </span>
                  )}
                  {!isCollapsed && item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        item.badgeVariant === 'active'
                          ? 'bg-[#3DB663] text-white'
                          : 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* 3. Footer: Telemetry & Auditor Session */}
      <div className="p-4 border-t border-[#D7DCE5] space-y-3 bg-[#F2F3F7]/50">
        {/* Backend Connectivity Status */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#D7DCE5] text-xs font-mono">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-[#3DB663] animate-ping'
                    : backendStatus === 'checking'
                    ? 'bg-[#D97706]'
                    : 'bg-[#E11D48]'
                }`}
              />
              <span className="text-[#4A5B60] text-[11px] font-medium">
                {backendStatus === 'online'
                  ? 'Core Engine Online'
                  : backendStatus === 'checking'
                  ? 'Connecting...'
                  : 'Engine Offline'}
              </span>
            </div>
            <span className="text-[10px] text-[#7E8F95] font-bold">FastAPI</span>
          </div>
        ) : (
          <div
            className="flex justify-center"
            title={`Backend Status: ${backendStatus}`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-[#3DB663]'
                  : backendStatus === 'checking'
                  ? 'bg-[#D97706]'
                  : 'bg-[#E11D48]'
              }`}
            />
          </div>
        )}

        {/* Auditor Profile & Logout */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-display font-bold text-[#0A282D] truncate">
                {user?.name || user?.email || 'Authorized Auditor'}
              </div>
              <div className="text-[10px] font-mono text-[#7E8F95] truncate">
                {user?.email}
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-[#7E8F95] hover:text-[#E11D48] hover:bg-[#FEECEC] transition-colors"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Collapse Toggle Button (Desktop Only) */}
        <div className="hidden lg:block pt-1">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-xl text-[#7E8F95] hover:text-[#0A282D] hover:bg-white border border-transparent hover:border-[#D7DCE5] transition-all"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block h-screen transition-all duration-300 z-30 flex-shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  )
}
