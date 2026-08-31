import React, { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Terminal,
  UserCheck,
  Wifi,
  XCircle,
} from 'lucide-react'
import { Hero3DVisual } from './Hero3DVisual'
import type { PageKey } from './Sidebar'

interface LandingPageProps {
  onNavigate: (page: PageKey) => void
  onStartAudit: () => void
}

export function LandingPage({ onNavigate, onStartAudit }: LandingPageProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary font-sans selection:bg-brand-primary/30 selection:text-brand-bright antialiased">
      {/* 1. COMPACT ENTERPRISE NAVBAR */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-surface-primary/95 border-b border-surface-border shadow-md backdrop-blur-md'
            : 'bg-surface-primary/80 border-b border-surface-border/60 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Left: NetSecure AI Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-primary/20 border border-brand-primary/30 text-brand-bright">
              <ShieldCheck size={18} className="stroke-[2.3]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold tracking-wider text-text-primary uppercase font-mono flex items-center gap-1">
                <span>NETSECURE</span>
                <span className="text-brand-primary">AI</span>
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-wider text-text-secondary uppercase font-medium">
                ENTERPRISE NETWORK SECURITY
              </div>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-text-secondary">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-brand-bright transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="hover:text-brand-primary text-text-secondary transition-colors"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection('capabilities')}
              className="hover:text-brand-primary text-text-secondary transition-colors"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection('solutions')}
              className="hover:text-brand-primary text-text-secondary transition-colors"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-brand-primary text-text-secondary transition-colors"
            >
              About
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="hidden sm:inline-flex px-3 py-1.5 rounded text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onStartAudit}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs transition-colors shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight size={13} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (90–100vh) */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden border-b border-surface-border/80 bg-surface-primary">
        {/* Full-screen 3D Background */}
        <div className="absolute inset-0 z-0">
          <Hero3DVisual />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-20 flex flex-col pointer-events-none">
          <div className="md:w-1/2 lg:w-[45%] space-y-6 pointer-events-auto">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-secondary/60 backdrop-blur-sm border border-surface-border/80 text-[10px] sm:text-[11px] font-mono text-brand-bright font-semibold tracking-widest uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-bright animate-pulse" />
              <span>DETERMINISTIC SECURITY</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-text-primary leading-[1.05] drop-shadow-xl">
              SECURE EVERY<br />NETWORK.<br />
              <span className="text-text-secondary">PROVE EVERY<br />CONTROL.</span><br />
              <span className="text-brand-primary">AUTOMATE<br />COMPLIANCE.</span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md drop-shadow-md">
              NetSecure AI analyzes heterogeneous network configurations, evaluates security controls against industry frameworks, identifies configuration gaps, and provides deterministic remediation guidance with audit-ready reporting.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-6 py-3 rounded bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(22,131,216,0.3)] hover:shadow-[0_0_30px_rgba(22,131,216,0.5)]"
              >
                <span>Explore Platform</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </button>

              <button
                onClick={() => scrollToSection('how-it-works')}
                className="flex items-center gap-2 px-6 py-3 rounded bg-surface-secondary/80 hover:bg-surface-hover backdrop-blur-sm border border-surface-border/80 text-text-primary font-semibold text-xs sm:text-sm transition-colors"
              >
                <Play size={13} className="fill-current text-brand-bright" />
                <span>See How It Works</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: ABOUT NETSECURE AI */}
      <section id="about" className="py-16 lg:py-20 border-b border-surface-border bg-surface-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-bright font-mono">
              Enterprise Platform Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary mt-2">
              What is NetSecure AI?
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-3 leading-relaxed">
              NetSecure AI is an enterprise network security and compliance platform designed for heterogeneous network environments. It analyzes network configurations, evaluates security controls, identifies security gaps, provides deterministic remediation guidance, and generates auditable compliance reports.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* The Operational Challenge */}
            <div className="rounded-xl border border-surface-border bg-surface-panel p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-status-critical text-xs font-bold uppercase tracking-wider font-mono">
                <AlertTriangle size={15} />
                <span>The Challenge</span>
              </div>
              <h3 className="text-base font-bold text-text-primary">
                Heterogeneous Configurations & Manual Audits
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Enterprise networks contain equipment from many vendors and operating systems. Security teams must continuously verify configurations against multiple security frameworks, but manual review is slow, inconsistent, and difficult to scale across global fleets.
              </p>
            </div>

            {/* The Deterministic Solution */}
            <div className="rounded-xl border border-surface-border bg-surface-panel p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-status-success text-xs font-bold uppercase tracking-wider font-mono">
                <ShieldCheck size={15} />
                <span>The Solution</span>
              </div>
              <h3 className="text-base font-bold text-text-primary">
                Unified Deterministic & Adaptive Pipeline
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                NetSecure AI combines deterministic configuration parsing, compliance evaluation, administrator-approved learning, deterministic remediation guidance, and reporting into one unified workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: HOW IT WORKS (Five-Stage Workflow) */}
      <section id="how-it-works" className="py-16 lg:py-20 border-b border-surface-border bg-surface-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-bright font-mono">
              Audit Pipeline Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary mt-2">
              How NetSecure AI Works
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-2">
              A five-stage technical pipeline turning raw device configurations into audit evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 relative">
            {[
              {
                step: '01',
                label: 'DISCOVER',
                title: 'Identify Devices',
                desc: 'Identify network devices and ingest raw running configurations.',
              },
              {
                step: '02',
                label: 'ANALYZE',
                title: 'Analyze Posture',
                desc: 'Analyze configuration security posture via deterministic parsing engines.',
              },
              {
                step: '03',
                label: 'EVALUATE',
                title: 'Evaluate Controls',
                desc: 'Evaluate against CIS and NIST security controls to isolate gaps.',
              },
              {
                step: '04',
                label: 'REMEDIATE',
                title: 'Generate Remediation',
                desc: 'Generate exact deterministic vendor-specific CLI remediation playbooks.',
              },
              {
                step: '05',
                label: 'PROVE',
                title: 'Generate Reports',
                desc: 'Generate auditable compliance reports and executive documentation.',
              },
            ].map((stage, idx) => (
              <div
                key={stage.step}
                className="rounded-xl border border-surface-border bg-surface-panel p-5 flex flex-col justify-between hover:border-brand-primary/50 transition-colors shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold font-mono text-brand-bright">
                      {stage.step}
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary px-1.5 py-0.5 rounded bg-surface-primary border border-surface-border">
                      {stage.label}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    {stage.title}
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
                {idx < 4 && (
                  <div className="hidden lg:block mt-4 pt-2 text-right text-text-secondary font-mono text-xs">
                    &rarr;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SECTION: MULTI-VENDOR NETWORK ARCHITECTURE */}
      <section id="solutions" className="py-16 lg:py-20 border-b border-surface-border bg-surface-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-bright font-mono">
              Multi-Vendor Normalization
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary mt-2">
              Multi-Vendor Architecture
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
              NetSecure AI normalizes vendor-specific configuration syntax across heterogeneous infrastructure into a unified compliance model.
            </p>
          </div>

          {/* Conceptual Flow Diagram */}
          <div className="rounded-xl border border-surface-border bg-surface-panel p-6 mb-8 text-center shadow-sm">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-surface-primary border border-surface-border text-text-primary">Cisco</span>
              <span className="text-text-muted">&bull;</span>
              <span className="px-2.5 py-1 rounded bg-surface-primary border border-surface-border text-text-primary">Fortinet</span>
              <span className="text-text-muted">&bull;</span>
              <span className="px-2.5 py-1 rounded bg-surface-primary border border-surface-border text-text-primary">Palo Alto</span>
              <span className="text-text-muted">&bull;</span>
              <span className="px-2.5 py-1 rounded bg-surface-primary border border-surface-border text-text-primary">Check Point</span>
              <span className="text-text-muted">&bull;</span>
              <span className="px-2.5 py-1 rounded bg-surface-primary border border-surface-border text-text-primary">Juniper</span>
            </div>

            <div className="py-2 text-brand-primary font-mono text-xs">&darr;</div>

            <div className="inline-flex px-4 py-1.5 rounded bg-brand-primary/20 text-brand-bright font-mono font-bold text-xs border border-brand-primary/40">
              NETSECURE AI
            </div>

            <div className="py-2 text-brand-primary font-mono text-xs">&darr;</div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-text-secondary">
              <span className="px-2.5 py-1 rounded bg-surface-primary border border-surface-border">Security Analysis</span>
              <span className="text-text-muted">&rarr;</span>
              <span className="px-2.5 py-1 rounded bg-surface-primary border border-surface-border">Compliance</span>
              <span className="text-text-muted">&rarr;</span>
              <span className="px-2.5 py-1 rounded bg-surface-primary border border-surface-border">Remediation</span>
              <span className="text-text-muted">&rarr;</span>
              <span className="px-2.5 py-1 rounded bg-surface-primary border border-surface-border">Reporting</span>
            </div>
          </div>

          {/* Supported Multi-Vendor Syntax Breakdown */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Cisco */}
            <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <span className="font-bold text-xs text-text-primary uppercase font-mono">Cisco IOS / IOS-XE</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-blue-950 text-[10px] font-mono text-blue-300 border border-blue-800/60">
                  Routers & Switches
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Extracts SSH version, Telnet status, HTTP/HTTPS server settings, syslog forwarding, NTP synchronization, and login timeouts.
              </p>
              <pre className="font-mono text-[10px] text-text-secondary bg-surface-primary p-2.5 rounded border border-surface-border overflow-x-auto">
                ip ssh version 2&#10;no ip http server&#10;line vty 0 4&#10; transport input ssh
              </pre>
            </div>

            {/* Fortinet */}
            <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="font-bold text-xs text-text-primary uppercase font-mono">Fortinet FortiOS</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-red-950 text-[10px] font-mono text-red-300 border border-red-800/60">
                  FortiGate NGFW
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Parses global admin timeouts, SSH v2 port policies, administrator lockout thresholds, and remote logging configurations.
              </p>
              <pre className="font-mono text-[10px] text-text-secondary bg-surface-primary p-2.5 rounded border border-surface-border overflow-x-auto">
                config system global&#10;  set admintimeout 10&#10;  set ssh-version 2&#10;end
              </pre>
            </div>

            {/* Palo Alto */}
            <div className="rounded-xl border border-surface-border bg-surface-panel p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <span className="font-bold text-xs text-text-primary uppercase font-mono">Palo Alto PAN-OS</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-orange-950 text-[10px] font-mono text-orange-300 border border-orange-800/60">
                  Firewall & Panorama
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Evaluates system management interface profiles, permitted IP ranges, telnet prohibition, and secure NTP server configuration.
              </p>
              <pre className="font-mono text-[10px] text-text-secondary bg-surface-primary p-2.5 rounded border border-surface-border overflow-x-auto">
                set deviceconfig system&#10;  service disable-telnet yes&#10;  ntp-servers primary ...
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: COMPLIANCE FRAMEWORKS */}
      <section id="capabilities" className="py-16 lg:py-20 border-b border-surface-border bg-surface-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-bright font-mono">
              Regulatory Alignment
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary mt-2">
              Supported Security & Compliance Frameworks
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-2">
              Evaluates configurations against applicable security and compliance controls without ambiguity.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* CIS */}
            <div className="p-5 rounded-xl bg-surface-panel border border-surface-border shadow-sm space-y-2">
              <div className="text-xs font-bold font-mono text-brand-bright">CIS Benchmarks</div>
              <div className="text-sm font-bold text-text-primary">Network Device v1.0</div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Hardening baselines for enterprise routers, firewalls, and switches including SSH, Telnet, HTTP, and timeout controls.
              </p>
              <div className="pt-2 text-[10px] font-mono text-status-success font-bold">
                ✓ Implemented Baseline
              </div>
            </div>

            {/* NIST */}
            <div className="p-5 rounded-xl bg-surface-panel border border-surface-border shadow-sm space-y-2">
              <div className="text-xs font-bold font-mono text-status-success">NIST SP 800-53</div>
              <div className="text-sm font-bold text-text-primary">Revision 5 Controls</div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Access control (AC-2/AC-17), transmission confidentiality (SC-8), and audit accountability (AU-2/AU-12) controls.
              </p>
              <div className="pt-2 text-[10px] font-mono text-status-success font-bold">
                ✓ Implemented Baseline
              </div>
            </div>

            {/* DISA STIG */}
            <div className="p-5 rounded-xl bg-surface-panel border border-surface-border shadow-sm space-y-2">
              <div className="text-xs font-bold font-mono text-text-secondary">DISA STIG</div>
              <div className="text-sm font-bold text-text-primary">Infrastructure Guidelines</div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Security technical implementation guidelines for perimeter routing, management plane access, and encryption.
              </p>
              <div className="pt-2 text-[10px] font-mono text-text-secondary">
                Comparable Architecture
              </div>
            </div>

            {/* ISO 27001 */}
            <div className="p-5 rounded-xl bg-surface-panel border border-surface-border shadow-sm space-y-2">
              <div className="text-xs font-bold font-mono text-text-secondary">ISO/IEC 27001</div>
              <div className="text-sm font-bold text-text-primary">Security Management</div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Annex A controls for network security management, boundary protection, and administrative segregation.
              </p>
              <div className="pt-2 text-[10px] font-mono text-text-secondary">
                Comparable Architecture
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECTION: FINAL CALL TO ACTION */}
      <section className="py-16 lg:py-24 bg-surface-primary border-b border-surface-border relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-secondary border border-surface-border text-xs font-mono text-brand-bright font-semibold">
            <ShieldCheck size={14} />
            <span>ENTERPRISE NETWORK COMPLIANCE PLATFORM</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
            Turn Network Complexity<br />
            Into Compliance Confidence.
          </h2>

          <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
            Understand your security posture, identify compliance gaps, and move from findings to deterministic remediation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onStartAudit}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight size={14} className="stroke-[2.5]" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-surface-secondary hover:bg-surface-hover border border-surface-border text-text-primary font-semibold text-xs sm:text-sm transition-colors"
            >
              <span>Explore Platform</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 8. ENTERPRISE FOOTER */}
      <footer className="py-12 bg-[#020305] text-xs text-text-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-surface-border/80">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary font-mono">
                <ShieldCheck size={16} className="text-brand-primary" />
                <span>NETSECURE AI</span>
              </div>
              <div className="text-[11px] text-text-secondary mt-1">
                Enterprise Network Security &amp; Compliance Platform
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-medium">
              <button
                onClick={() => onNavigate('dashboard')}
                className="hover:text-text-primary transition-colors"
              >
                Platform
              </button>
              <button
                onClick={() => scrollToSection('capabilities')}
                className="hover:text-text-primary transition-colors"
              >
                Capabilities
              </button>
              <button
                onClick={() => scrollToSection('solutions')}
                className="hover:text-text-primary transition-colors"
              >
                Solutions
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="hover:text-text-primary transition-colors"
              >
                About
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="hover:text-text-primary transition-colors"
              >
                Contact
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-[11px] text-text-secondary font-mono">
            <div>
              &copy; {new Date().getFullYear()} NetSecure AI. All rights reserved. Deterministic Engine v2.4.
            </div>
            <div className="flex items-center gap-4">
              <span>Security</span>
              <span>&bull;</span>
              <span>Privacy</span>
              <span>&bull;</span>
              <span>Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
