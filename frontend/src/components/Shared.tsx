import React from 'react'
import { AlertOctagon, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react'

export function VendorBadge({ vendor }: { vendor?: string | null }) {
  const v = (vendor || 'unknown').toLowerCase()
  if (v.includes('cisco')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EAF2F8] text-[#0E3A5D] border border-[#C5D9EB] font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-[#0E3A5D]" />
        Cisco IOS-XE
      </span>
    )
  }
  if (v.includes('forti')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FEECEC] text-[#9F1239] border border-[#FCA5A5] font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-[#E11D48]" />
        Fortinet FortiOS
      </span>
    )
  }
  if (v.includes('palo') || v.includes('pan')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFF4ED] text-[#9A3412] border border-[#FDBA74] font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-[#EA580C]" />
        Palo Alto PAN-OS
      </span>
    )
  }
  if (v.includes('juniper') || v.includes('junos')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EDF8F1] text-[#1E6E37] border border-[#BFE7CB] font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-[#3DB663]" />
        Juniper Junos
      </span>
    )
  }
  if (v.includes('aruba') || v.includes('cx')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
        Aruba AOS-CX
      </span>
    )
  }
  if (v.includes('check') || v.includes('gaia')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD] font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-[#475467]" />
        Check Point Gaia
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD] font-mono">
      <span className="h-1.5 w-1.5 rounded-full bg-[#667085]" />
      {vendor || 'Unknown Vendor'}
    </span>
  )
}

export function RiskBadge({ risk }: { risk?: string | null }) {
  const r = (risk || 'low').toLowerCase()
  if (r.includes('critical')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FEECEC] text-[#9F1239] border border-[#FCA5A5] uppercase tracking-wider font-mono">
        <AlertOctagon size={12} className="stroke-[2.5]" />
        Critical Risk
      </span>
    )
  }
  if (r.includes('high')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] uppercase tracking-wider font-mono">
        <AlertTriangle size={12} className="stroke-[2.5]" />
        High Risk
      </span>
    )
  }
  if (r.includes('medium')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] uppercase tracking-wider font-mono">
        <AlertTriangle size={12} className="stroke-[2.5]" />
        Medium Risk
      </span>
    )
  }
  if (r.includes('evaluating')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EBF4FF] text-[#1E40AF] border border-[#BFDBFE] uppercase tracking-wider font-mono">
        <HelpCircle size={12} className="stroke-[2.5]" />
        Evaluating
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EDF8F1] text-[#1E6E37] border border-[#BFE7CB] uppercase tracking-wider font-mono">
      <CheckCircle2 size={12} className="stroke-[2.5]" />
      Low Risk
    </span>
  )
}

export function StatusPill({ status }: { status: string }) {
  const s = (status || '').toUpperCase()
  if (s === 'PASS' || s === 'COMPLIANT') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EDF8F1] text-[#1E6E37] border border-[#BFE7CB] font-mono tracking-wider">
        PASS
      </span>
    )
  }
  if (s === 'FAIL' || s === 'NON-COMPLIANT') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEECEC] text-[#9F1239] border border-[#FCA5A5] font-mono tracking-wider">
        FAIL
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] font-mono tracking-wider">
      {s || 'UNKNOWN'}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = (severity || '').toUpperCase()
  if (s === 'CRITICAL') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEECEC] text-[#9F1239] border border-[#FCA5A5] uppercase tracking-wider font-mono">
        CRITICAL
      </span>
    )
  }
  if (s === 'HIGH') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] uppercase tracking-wider font-mono">
        HIGH
      </span>
    )
  }
  if (s === 'MEDIUM') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] uppercase tracking-wider font-mono">
        MEDIUM
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD] uppercase tracking-wider font-mono">
      LOW
    </span>
  )
}
