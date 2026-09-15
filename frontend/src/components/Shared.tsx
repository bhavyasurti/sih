import React from 'react'
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

export function VendorBadge({ vendor }: { vendor?: string | null }) {
  const v = (vendor || 'unknown').toLowerCase()
  if (v.includes('cisco')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-brand-primary/20 text-brand-bright border border-brand-primary/30 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-bright" />
        Cisco IOS
      </span>
    )
  }
  if (v.includes('forti')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-status-darkRed/30 text-status-critical border border-status-critical/30 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-status-critical" />
        Fortinet FortiOS
      </span>
    )
  }
  if (v.includes('palo') || v.includes('pan')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Palo Alto PAN-OS
      </span>
    )
  }
  if (v.includes('juniper') || v.includes('junos')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Juniper Junos
      </span>
    )
  }
  if (v.includes('aruba') || v.includes('cx')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-orange-500/10 text-orange-500 border border-orange-500/30 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        Aruba AOS-CX
      </span>
    )
  }
  if (v.includes('check') || v.includes('gaia')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-pink-500/10 text-pink-500 border border-pink-500/30 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
        Check Point Gaia
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-secondary text-text-secondary border border-surface-border font-mono">
      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary" />
      {vendor || 'Unknown'}
    </span>
  )
}

export function RiskBadge({ risk }: { risk?: string | null }) {
  const r = (risk || 'low').toLowerCase()
  if (r.includes('critical')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-darkRed/40 text-status-critical border border-status-critical/40 uppercase tracking-wider">
        <AlertOctagon size={11} className="stroke-[2.5]" />
        Critical Risk
      </span>
    )
  }
  if (r.includes('high')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-darkRed/20 text-status-critical border border-status-critical/30 uppercase tracking-wider">
        <AlertTriangle size={11} className="stroke-[2.5]" />
        High Risk
      </span>
    )
  }
  if (r.includes('medium')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase tracking-wider">
        <Info size={11} className="stroke-[2.5]" />
        Medium Risk
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-success/10 text-status-success border border-status-success/30 uppercase tracking-wider">
      <CheckCircle2 size={11} className="stroke-[2.5]" />
      Low Risk
    </span>
  )
}

export function StatusPill({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (s === 'PASS' || s === 'COMPLIANT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-status-success/10 text-status-success border border-status-success/30 font-mono">
        PASS
      </span>
    )
  }
  if (s === 'FAIL' || s === 'NON-COMPLIANT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-status-darkRed/20 text-status-critical border border-status-critical/30 font-mono">
        FAIL
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 font-mono">
      {s || 'UNKNOWN'}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = severity.toUpperCase()
  if (s === 'CRITICAL') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-darkRed/40 text-status-critical border border-status-critical/40 uppercase tracking-wider">
        CRITICAL
      </span>
    )
  }
  if (s === 'HIGH') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-darkRed/20 text-status-critical border border-status-critical/30 uppercase tracking-wider">
        HIGH
      </span>
    )
  }
  if (s === 'MEDIUM') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase tracking-wider">
        MEDIUM
      </span>
    )
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-secondary text-text-secondary border border-surface-border uppercase tracking-wider">
      LOW
    </span>
  )
}
