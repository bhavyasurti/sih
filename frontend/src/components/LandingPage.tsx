import React, { useEffect, useRef, useState } from 'react'
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Terminal,
  Cpu,
  Layers,
  Lock,
  ChevronRight,
  Menu,
  X,
  Sliders,
  Check,
  RefreshCw,
  FileText,
  Activity,
  Download,
  AlertOctagon,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import type { PageKey } from './Sidebar'
import { Link, useNavigate } from 'react-router-dom'
import { Hero3DVisual } from './Hero3DVisual'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface LandingPageProps {
  onNavigate: (page: PageKey) => void
  onStartAudit: () => void
}

export function LandingPage({ onNavigate, onStartAudit }: LandingPageProps) {
  const navigate = useNavigate()
  const pageContainerRef = useRef<HTMLDivElement | null>(null)
  const preloaderRef = useRef<HTMLDivElement | null>(null)
  const heroDotsCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const tabsContentRef = useRef<HTMLDivElement | null>(null)

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [navDropOpen, setNavDropOpen] = useState(false)
  const [activeServeTab, setActiveServeTab] = useState(0)
  const [activeSxItem, setActiveSxItem] = useState(0)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [sandboxRemediated, setSandboxRemediated] = useState(false)
  const [loaderVisible, setLoaderVisible] = useState(true)
  const [loaderProgress, setLoaderProgress] = useState(0)
  const [loaderMessage, setLoaderMessage] = useState('Collecting multi-vendor syntax grammars')

  // 1. Session Entrance Preloader (Potadot Benchmark)
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setLoaderVisible(false)
      return
    }

    setLoaderVisible(true)
    let progress = 0
    const messages = [
      'Collecting multi-vendor syntax grammars',
      'Calibrating deterministic CIS & NIST engine',
      'Connecting vendor topologies (Cisco, Fortinet, Palo Alto)',
      'Synthesizing 3D security topology',
      'Operational readiness verified',
    ]

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 14) + 10
      if (progress > 100) progress = 100
      setLoaderProgress(progress)
      const msgIdx = Math.min(Math.floor((progress / 100) * messages.length), messages.length - 1)
      setLoaderMessage(messages[msgIdx])

      if (progress >= 100) {
        clearInterval(interval)
        if (preloaderRef.current) {
          const tl = gsap.timeline({
            onComplete: () => {
              setLoaderVisible(false)
            },
          })

          // Slide curtain up
          tl.to(preloaderRef.current, {
            yPercent: -100,
            duration: 0.85,
            ease: 'power4.inOut',
          })

          // Staggered hero entrance
          tl.fromTo(
            '.hero-anim-badge',
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
            '-=0.35'
          )
          tl.fromTo(
            '.hero-anim-title',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
            '-=0.4'
          )
          tl.fromTo(
            '.hero-anim-desc',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
            '-=0.35'
          )
          tl.fromTo(
            '.hero-anim-cta',
            { opacity: 0, y: 15, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(1.5)' },
            '-=0.3'
          )
          tl.fromTo(
            '.hero-anim-visual',
            { opacity: 0, scale: 0.94, y: 25 },
            { opacity: 1, scale: 1, y: 0, duration: 0.85, ease: 'power3.out' },
            '-=0.55'
          )
        } else {
          setLoaderVisible(false)
        }
      }
    }, 45)

    return () => clearInterval(interval)
  }, [])

  // 2. Full-Bleed Interactive Hero Dot Field (#heroDots)
  useEffect(() => {
    if (loaderVisible) return
    const canvas = heroDotsCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const heroSection = canvas.parentElement

    const updateSize = () => {
      if (!canvas || !heroSection) return
      canvas.width = heroSection.offsetWidth || window.innerWidth
      canvas.height = heroSection.offsetHeight || 750
    }
    updateSize()

    const mouse = { x: -1000, y: -1000, active: false }
    const onMouseMove = (e: MouseEvent) => {
      if (!heroSection) return
      const rect = heroSection.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.active = true
    }
    const onMouseLeave = () => {
      mouse.active = false
    }

    heroSection?.addEventListener('mousemove', onMouseMove, { passive: true })
    heroSection?.addEventListener('mouseleave', onMouseLeave, { passive: true })

    const spacing = 36
    const dots: { x: number; y: number; ox: number; oy: number; vx: number; vy: number }[] = []
    for (let x = spacing / 2; x < 2600; x += spacing) {
      for (let y = spacing / 2; y < 1400; y += spacing) {
        dots.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 })
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]
        if (d.ox > canvas.width + 30 || d.oy > canvas.height + 30) continue

        if (mouse.active) {
          const dx = mouse.x - d.x
          const dy = mouse.y - d.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 110
          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 16
            d.vx -= (dx / dist) * force * 0.14
            d.vy -= (dy / dist) * force * 0.14
          }
        }

        d.vx += (d.ox - d.x) * 0.08
        d.vy += (d.oy - d.y) * 0.08
        d.vx *= 0.82
        d.vy *= 0.82
        d.x += d.vx
        d.y += d.vy

        const distFromOrig = Math.sqrt((d.x - d.ox) ** 2 + (d.y - d.oy) ** 2)
        const isDisplaced = distFromOrig > 1.2
        ctx.fillStyle = isDisplaced ? '#3DB663' : 'rgba(10, 40, 45, 0.13)'
        ctx.beginPath()
        ctx.arc(d.x, d.y, isDisplaced ? 2.5 : 1.4, 0, Math.PI * 2)
        ctx.fill()
      }
      animId = requestAnimationFrame(render)
    }

    render()

    const ro = new ResizeObserver(() => updateSize())
    if (heroSection) ro.observe(heroSection)

    return () => {
      ro.disconnect()
      heroSection?.removeEventListener('mousemove', onMouseMove)
      heroSection?.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(animId)
    }
  }, [loaderVisible])

  // 3. GSAP ScrollTrigger section animations
  useEffect(() => {
    if (loaderVisible) return

    const ctx = gsap.context(() => {
      ScrollTrigger.refresh()

      const revealElements = document.querySelectorAll('.gsap-reveal')
      revealElements.forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.65,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
        })
      })

      const cardGrids = document.querySelectorAll('.gsap-stagger-grid')
      cardGrids.forEach((grid) => {
        gsap.from(grid.children, {
          opacity: 0,
          y: 24,
          stagger: 0.1,
          duration: 0.55,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: grid,
            start: 'top 88%',
            once: true,
          },
        })
      })
    }, pageContainerRef)

    return () => ctx.revert()
  }, [loaderVisible])

  // Tab switch micro-animation
  useEffect(() => {
    if (tabsContentRef.current) {
      gsap.fromTo(
        tabsContentRef.current,
        { opacity: 0.3, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
    }
  }, [activeServeTab])

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

  // Multi-Vendor Fleet Tabs
  const serveTabs = [
    {
      title: 'Perimeter Firewalls',
      subtitle: 'Fortinet FortiOS & Palo Alto PAN-OS',
      tag: 'Edge Security',
      desc: 'Ingress packet filtering, TLS 1.3 decryption policies, zone security, and administrative lockouts verified against CIS standards.',
      stats: [
        { label: 'Ingress Filtering', val: 'Enforced' },
        { label: 'Admin SSH Hardening', val: 'v2 Only' },
        { label: 'DNS Sinkholing', val: 'Active' },
      ],
      sampleCode: `config system global\n  set admin-https-redirect enable\n  set admin-lockout-threshold 3\n  set admin-ssh-v1 disable\nend`,
    },
    {
      title: 'Core Routing & Campus',
      subtitle: 'Cisco IOS-XE & Juniper Junos',
      tag: 'Backbone Fabric',
      desc: 'Control Plane Policing (CoPP), BGP MD5 authentication, TACACS+ AAA server fallback, and cryptographic secret protection.',
      stats: [
        { label: 'CoPP Protection', val: 'Strict' },
        { label: 'BGP Auth MD5', val: 'Active' },
        { label: 'AAA TACACS+', val: 'Dual Server' },
      ],
      sampleCode: `service password-encryption\nno ip http server\nip ssh version 2\nline vty 0 4\n transport input ssh\n login authentication default`,
    },
    {
      title: 'Zero-Trust Access Edge',
      subtitle: 'Aruba CX & Check Point Gaia',
      tag: 'Access Hardening',
      desc: '802.1X port security, MAC address limits, dynamic VLAN assignment, and immutable syslog forwarding for regulatory non-repudiation.',
      stats: [
        { label: 'Port Security', val: '802.1X' },
        { label: 'Syslog TLS', val: 'Encrypted' },
        { label: 'Session Timeout', val: '10 Min' },
      ],
      sampleCode: `aaa authentication port-access dot1x\nport-access security 1/1/1-1/1/48\n violation shutdown\n max-mac-count 1`,
    },
    {
      title: 'Multi-Cloud Gateways',
      subtitle: 'AWS Transit & Hybrid IPsec',
      tag: 'Hybrid Routing',
      desc: 'IPsec tunnel cryptographic algorithms (AES-256-GCM, DH Group 14+), BGP transit filtering, and VPC peering segmentation audits.',
      stats: [
        { label: 'Phase 2 Cipher', val: 'AES-256-GCM' },
        { label: 'PFS Group', val: 'Group 14' },
        { label: 'Anti-Replay', val: 'Enabled' },
      ],
      sampleCode: `crypto ipsec transform-set SECURE-TS esp-gcm 256\ncrypto map SECURE-MAP 10 ipsec-isakmp\n set pfs group14\n set security-association lifetime seconds 28800`,
    },
  ]

  // 4-Step Audit Lifecycle
  const sxItems = [
    {
      num: '01',
      title: 'Multi-Vendor Configuration Ingestion',
      sub: 'Ingest raw configurations without vendor lock-in or proprietary agents.',
      features: [
        'Supports Cisco, Fortinet, Palo Alto, Juniper, Aruba, Check Point',
        'Automatic vendor & operating system grammar detection',
        'Zero production device modifications (strictly offline configuration audits)',
        'Unknown syntax isolation for continuous engine learning',
      ],
      mockup: {
        badge: 'Ingestion Engine',
        filename: 'core-switch-cisco.cfg',
        tokens: [
          { key: 'Detected Vendor', val: 'Cisco IOS-XE 17.9' },
          { key: 'Interfaces Parsed', val: '48 Physical, 4 SVI' },
          { key: 'Security Directives', val: '142 Rules Isolated' },
        ],
      },
    },
    {
      num: '02',
      title: 'Deterministic Compliance Evaluation',
      sub: 'Zero AI hallucinations: evaluated with pure deterministic code rules.',
      features: [
        'Authoritative CIS Benchmark Level 1 & Level 2 controls',
        'NIST SP 800-53 security control family mapping',
        'Deterministic regex logic executed directly in Python',
        'Clear PASS, FAIL, and UNKNOWN findings with rule citations',
      ],
      mockup: {
        badge: 'Compliance Core',
        filename: 'cis_eval_matrix.json',
        tokens: [
          { key: 'CIS Level 1 Score', val: '92% Compliant' },
          { key: 'Critical Violations', val: '0 Detected' },
          { key: 'Controls Tested', val: '28 Deterministic Checks' },
        ],
      },
    },
    {
      num: '03',
      title: 'AI-Assisted Root Cause & Explanations',
      sub: 'Contextual technical rationale powered by Google Gemini.',
      features: [
        'Translates raw CLI findings into auditor-friendly explanations',
        'Cites relevant CVE vulnerabilities and real-world attack vectors',
        'Identifies configuration interdependencies across features',
        'Strict guardrails: AI never overrides deterministic compliance scores',
      ],
      mockup: {
        badge: 'Gemini Synthesizer',
        filename: 'ai_explanation_report.txt',
        tokens: [
          { key: 'Analysis Confidence', val: '99.4%' },
          { key: 'CVE Reference', val: 'CVE-2023-20198' },
          { key: 'Exploit Risk', val: 'Privilege Escalation' },
        ],
      },
    },
    {
      num: '04',
      title: 'Deterministic CLI Remediation & Re-Audit',
      sub: 'Verified configuration fixes staged before deployment.',
      features: [
        'Synthesizes exact native CLI syntax for the specific device OS',
        'Stages changes in an isolated working-configuration sandbox',
        'Automated instant re-audit to verify the fix passes compliance',
        'Exportable change-set scripts ready for human change-approval',
      ],
      mockup: {
        badge: 'Remediation Staging',
        filename: 'staged_remediation.diff',
        tokens: [
          { key: 'Commands Proposed', val: '3 Precise Directives' },
          { key: 'Post-Fix Score', val: '100% PASS' },
          { key: 'Human Approval', val: 'Required Prior to Apply' },
        ],
      },
    },
  ]

  // FAQs
  const faqs = [
    {
      q: 'Does NetSecure AI connect directly to or modify physical network devices?',
      a: 'No. NetSecure AI maintains a strict, safe boundary: it audits uploaded or pasted offline configuration files. It never connects directly to or modifies live hardware. All proposed CLI fixes are staged in a working configuration for human review and approval.',
    },
    {
      q: 'How does NetSecure AI prevent AI hallucinations in compliance scores?',
      a: 'Compliance results (PASS, FAIL, UNKNOWN) are computed exclusively by a deterministic Python regex engine using official CIS and NIST SP 800-53 criteria. Gemini AI is strictly used as an analytical layer to explain technical implications and format remediation options; it can never alter or hallucinate a compliance score.',
    },
    {
      q: 'Which network vendors and operating systems are supported?',
      a: 'NetSecure AI includes specialized deterministic parsers for Cisco (IOS, IOS-XE, NX-OS), Fortinet (FortiOS), Palo Alto Networks (PAN-OS), Juniper (Junos OS), Aruba (AOS-CX), and Check Point (Gaia OS).',
    },
    {
      q: 'Can we generate formal audit reports for compliance auditors?',
      a: 'Yes. NetSecure AI features a formal PDF reporting engine that generates executive summaries, control breakdown charts, parameter audits, and line-by-line technical evidence formatted for board and regulatory submission.',
    },
    {
      q: 'How does the Training Center handle unknown or proprietary commands?',
      a: 'When an unmapped vendor command is detected in a configuration, NetSecure AI isolates it into the Training Center. Auditors can review AI-assisted parameter suggestions, set authoritative mappings, and permanently teach the engine for future audits.',
    },
  ]

  return (
    <div
      ref={pageContainerRef}
      className="min-h-screen bg-[#F2F3F7] text-[#0A282D] font-sans selection:bg-[#3DB663]/25 selection:text-[#0A282D]"
    >
      {/* 1. SESSION ENTRANCE PRELOADER (Potadot Benchmark) */}
      {loaderVisible && (
        <div
          ref={preloaderRef}
          className="fixed inset-0 z-[100] flex flex-col justify-between p-6 sm:p-12 bg-[#0A282D] text-white dark-dots relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-radial from-[#3DB663]/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between font-mono text-xs text-[#8AA3A8] tracking-widest uppercase">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3DB663] animate-pulse" />
              NetSecure AI
            </span>
            <span className="hidden sm:inline text-[#3DB663]/80">Deterministic Compliance Engine</span>
            <span>v0.1.0 · Ready</span>
          </div>

          <div className="relative z-10 max-w-xl mx-auto w-full text-center my-auto flex flex-col items-center">
            {/* Animated Security Core Symbol */}
            <div className="relative mb-8 flex items-center justify-center">
              <div
                className="absolute w-24 h-24 rounded-full border border-dashed border-[#3DB663]/40 animate-spin"
                style={{ animationDuration: '14s' }}
              />
              <div
                className="absolute w-20 h-20 rounded-full border border-[#3DB663]/60 animate-ping opacity-25"
                style={{ animationDuration: '3s' }}
              />
              <div className="w-16 h-16 rounded-2xl bg-[#0F343A] border border-[#1E4950] flex items-center justify-center shadow-lg shadow-[#3DB663]/15">
                <Shield size={28} className="text-[#3DB663] stroke-[2.2]" />
              </div>
            </div>

            {/* Large 3-Digit Counter */}
            <div className="text-7xl sm:text-9xl font-display font-extrabold tracking-tight text-white mb-5 select-none">
              {String(loaderProgress).padStart(3, '0')}
              <span className="text-3xl sm:text-4xl text-[#3DB663] font-mono ml-1 font-semibold">%</span>
            </div>

            {/* Telemetry Stage Pill */}
            <div className="inline-flex items-center gap-2.5 text-xs font-mono font-medium text-[#8AA3A8] bg-[#0F343A]/90 px-5 py-2.5 rounded-full border border-[#1E4950] shadow-md backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#3DB663] animate-ping" />
              <span className="text-white/90">{loaderMessage}</span>
            </div>
          </div>

          {/* Bottom Progress Bar */}
          <div className="relative z-10 w-full bg-[#1E4950]/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#3DB663] h-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(61,182,99,0.8)]"
              style={{ width: `${loaderProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. FLOATING NAVIGATION BAR (Potadot Floating Pill with Dropdown Preview) */}
      <div className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8 pointer-events-none">
        <header className="max-w-6xl mx-auto h-16 sm:h-20 px-5 sm:px-7 rounded-full bg-white/95 backdrop-blur-md border border-[#D7DCE5] shadow-[0_10px_35px_rgba(10,40,45,0.08)] flex items-center justify-between pointer-events-auto transition-all">
          {/* Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A282D] text-white shadow-sm transition-transform group-hover:scale-105">
              <Shield size={20} className="text-[#3DB663] stroke-[2.4]" />
            </div>
            <div>
              <div className="text-lg font-display font-bold tracking-tight text-[#0A282D] flex items-center gap-1.5 leading-none">
                <span>NetSecure</span>
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full bg-[#3DB663] text-white uppercase tracking-wider">
                  AI
                </span>
              </div>
              <div className="text-[9px] tracking-widest text-[#7E8F95] uppercase font-mono font-semibold mt-1">
                Multi-Vendor Security
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links with Mega Dropdown */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-[#4A5B60] relative">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[#0A282D] hover:text-[#3DB663] transition-colors"
            >
              Overview
            </button>

            {/* Dropdown Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setNavDropOpen(true)}
              onMouseLeave={() => setNavDropOpen(false)}
            >
              <button
                onClick={() => scrollToSection('ecosystem')}
                className="hover:text-[#0A282D] transition-colors flex items-center gap-1.5 py-2"
              >
                <span>Ecosystem</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${navDropOpen ? 'rotate-180 text-[#3DB663]' : ''}`}
                />
              </button>

              {/* Potadot Mega-Dropdown Card */}
              {navDropOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[620px] rounded-3xl bg-white border border-[#D7DCE5] shadow-[0_20px_50px_rgba(10,40,45,0.12)] p-6 grid grid-cols-12 gap-6 z-50 pointer-events-auto">
                  <div className="col-span-7 space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7E8F95] mb-2">
                      Supported Architectures
                    </div>
                    {serveTabs.map((t, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveServeTab(idx)
                          scrollToSection('ecosystem')
                          setNavDropOpen(false)
                        }}
                        className="p-2.5 rounded-xl hover:bg-[#F2F3F7] cursor-pointer transition-colors group/item flex items-center justify-between"
                      >
                        <div>
                          <div className="font-display text-sm font-bold text-[#0A282D] group-hover/item:text-[#3DB663] transition-colors">
                            {t.title}
                          </div>
                          <div className="text-[11px] font-mono text-[#7E8F95]">
                            {t.subtitle}
                          </div>
                        </div>
                        <ArrowRight size={13} className="text-[#D7DCE5] group-hover/item:text-[#3DB663] group-hover/item:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>

                  <div className="col-span-5 bg-[#0A282D] rounded-2xl p-4 text-white font-mono text-xs flex flex-col justify-between border border-[#1E4950]">
                    <div>
                      <div className="text-[10px] text-[#3DB663] font-bold uppercase tracking-wider">
                        Live Engine Status
                      </div>
                      <div className="font-display font-bold text-sm text-white mt-1">
                        Deterministic Core
                      </div>
                      <p className="text-[10px] text-[#A3B8BC] mt-2 font-sans leading-relaxed">
                        Evaluates 6 vendor operating systems against official CIS & NIST benchmarks.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-[#7E8F95]">
                      <span>Zero Hallucinations</span>
                      <span className="text-[#3DB663] font-bold">100% Math</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => scrollToSection('lifecycle')}
              className="hover:text-[#0A282D] transition-colors"
            >
              Lifecycle
            </button>
            <button
              onClick={() => scrollToSection('why-deterministic')}
              className="hover:text-[#0A282D] transition-colors"
            >
              Why Deterministic
            </button>
            <button
              onClick={() => scrollToSection('sandbox')}
              className="hover:text-[#0A282D] transition-colors"
            >
              Live Demo
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-[#0A282D] transition-colors"
            >
              FAQ
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-bold font-mono tracking-wider uppercase text-[#4A5B60] hover:text-[#0A282D] px-3.5 py-2 transition-colors"
            >
              Sign In
            </Link>
            <button
              onClick={() => onNavigate('dashboard')}
              className="btn btn--green text-xs px-4 py-2"
            >
              <span>Launch Console</span>
              <span className="btn-ico w-5 h-5">
                <ArrowRight size={12} className="stroke-[2.5]" />
              </span>
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#0A282D] rounded-full hover:bg-[#F2F3F7] transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-3 max-w-6xl mx-auto rounded-3xl border border-[#D7DCE5] bg-white p-6 space-y-4 shadow-2xl pointer-events-auto">
            <div className="flex flex-col space-y-3 font-display font-semibold text-base text-[#0A282D]">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  setIsMobileMenuOpen(false)
                }}
                className="text-left py-2 border-b border-[#F2F3F7]"
              >
                <small className="text-xs font-mono text-[#7E8F95] mr-2">01</small>
                Overview
              </button>
              <button
                onClick={() => {
                  scrollToSection('ecosystem')
                  setIsMobileMenuOpen(false)
                }}
                className="text-left py-2 border-b border-[#F2F3F7]"
              >
                <small className="text-xs font-mono text-[#7E8F95] mr-2">02</small>
                Multi-Vendor Ecosystem
              </button>
              <button
                onClick={() => {
                  scrollToSection('lifecycle')
                  setIsMobileMenuOpen(false)
                }}
                className="text-left py-2 border-b border-[#F2F3F7]"
              >
                <small className="text-xs font-mono text-[#7E8F95] mr-2">03</small>
                Audit Lifecycle
              </button>
              <button
                onClick={() => {
                  scrollToSection('why-deterministic')
                  setIsMobileMenuOpen(false)
                }}
                className="text-left py-2 border-b border-[#F2F3F7]"
              >
                <small className="text-xs font-mono text-[#7E8F95] mr-2">04</small>
                Why Deterministic
              </button>
              <button
                onClick={() => {
                  scrollToSection('sandbox')
                  setIsMobileMenuOpen(false)
                }}
                className="text-left py-2 border-b border-[#F2F3F7]"
              >
                <small className="text-xs font-mono text-[#7E8F95] mr-2">05</small>
                Interactive Demo
              </button>
              <button
                onClick={() => {
                  scrollToSection('faq')
                  setIsMobileMenuOpen(false)
                }}
                className="text-left py-2"
              >
                <small className="text-xs font-mono text-[#7E8F95] mr-2">06</small>
                FAQ
              </button>
            </div>

            <div className="pt-4 border-t border-[#D7DCE5] flex flex-col gap-3">
              <Link
                to="/login"
                className="text-center py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[#0A282D] bg-[#F2F3F7] rounded-full border border-[#D7DCE5]"
              >
                Auditor Sign In
              </Link>
              <button
                onClick={() => onNavigate('dashboard')}
                className="btn btn--green w-full"
              >
                <span>Launch Console</span>
                <span className="btn-ico">
                  <ArrowRight size={13} className="stroke-[2.5]" />
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. HERO EXPERIENCE (Potadot Benchmark with Full-Bleed Dot Canvas) */}
      <section className="relative pt-6 pb-16 lg:pt-10 lg:pb-24 overflow-hidden bg-[#F2F3F7]" id="overview">
        {/* Full-Bleed Interactive Spring-Dot Canvas */}
        <canvas
          ref={heroDotsCanvasRef}
          className="hero-canvas"
          id="heroDots"
          aria-hidden="true"
        />

        <div className="orb orb--ring w-[540px] h-[540px] -right-24 -top-24 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Hero Editorial Copy */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="hero-anim-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D7DCE5] text-xs font-mono font-bold text-[#0A282D] w-fit mb-5 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-[#3DB663] animate-pulse" />
                <span>MULTI-VENDOR DETERMINISTIC COMPLIANCE</span>
              </div>

              <h1 className="hero-anim-title font-display text-4xl sm:text-5xl lg:text-6xl text-[#0A282D] font-extrabold tracking-tight leading-[1.06]">
                Enterprise network security,{' '}
                <span className="text-[#3DB663] underline decoration-[#3DB663]/30 underline-offset-4">
                  verified with mathematical certainty.
                </span>
              </h1>

              <p className="hero-anim-desc mt-5 text-base sm:text-lg text-[#4A5B60] leading-relaxed font-normal">
                Deterministic regex compliance parsing across Cisco, Fortinet, Palo Alto, Juniper, Aruba, and Check Point configurations. Verified against CIS Benchmarks and NIST SP 800-53 before changes touch production.
              </p>

              <div className="hero-anim-cta mt-8 flex flex-wrap items-center gap-3.5">
                <button
                  onClick={onStartAudit}
                  className="btn btn--green text-sm px-6 py-3"
                >
                  <span>Start Configuration Audit</span>
                  <span className="btn-ico">
                    <ArrowRight size={14} className="stroke-[2.5]" />
                  </span>
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="btn btn--soft text-sm px-6 py-3"
                >
                  <span>Live Dashboard</span>
                  <span className="btn-ico">
                    <ArrowRight size={14} className="stroke-[2.5]" />
                  </span>
                </button>
              </div>

              {/* Potadot Signature Pill Tags */}
              <div className="hero-anim-cta mt-8 pt-6 border-t border-[#D7DCE5] flex flex-wrap items-center gap-2.5">
                <span className="tag">
                  <i></i>CIS Benchmark L1 & L2
                </span>
                <span className="tag">
                  <i></i>Zero Physical Device Modification
                </span>
                <span className="tag">
                  <i></i>6 Native Vendor Parsers
                </span>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs font-mono text-[#7E8F95]">
                <div className="hero-hint">
                  <b></b>Scroll to explore
                </div>
              </div>
            </div>

            {/* Right Column: Hero 3D Interactive Topology Visual */}
            <div className="hero-anim-visual lg:col-span-7 w-full">
              <Hero3DVisual />
            </div>
          </div>
        </div>
      </section>

      {/* 4. EDITORIAL STATEMENT SECTION (Potadot pad style) */}
      <section className="gsap-reveal py-20 lg:py-28 relative overflow-hidden bg-white border-y border-[#D7DCE5]">
        <div className="orb orb--ring w-[440px] h-[440px] -left-32 top-10" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <span className="eyebrow mb-4">The Compliance Dilemma</span>
          <p className="statement">
            Still auditing multi-vendor routers, firewalls, and switches with{' '}
            <em>manual checklists</em>, fragmented spreadsheets, and slow guess-and-check CLI? NetSecure AI delivers the{' '}
            <span className="accent">one deterministic platform</span>{' '}
            your network engineering and security teams can trust with zero doubt.
          </p>

          <div className="mt-8">
            <button
              onClick={() => scrollToSection('ecosystem')}
              className="link-arrow"
            >
              <span>Explore supported multi-vendor architectures</span>
              <ArrowRight size={15} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. MULTI-VENDOR FLEET (Potadot serve section with tabbed stages) */}
      <section className="gsap-reveal py-20 lg:py-28" id="ecosystem">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Side Tabs */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="eyebrow mb-3">Multi-Vendor Ecosystem</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0A282D] tracking-tight">
                  Normalized security across your entire fleet.
                </h2>
                <p className="mt-3 text-sm text-[#4A5B60] leading-relaxed">
                  Different vendors use entirely different CLI grammars, syntax flags, and configuration paradigms. NetSecure AI parses each device natively and evaluates unified compliance.
                </p>
              </div>

              {/* Tabs List */}
              <div className="space-y-3 pt-2">
                {serveTabs.map((tab, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveServeTab(idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      activeServeTab === idx
                        ? 'bg-white border-[#3DB663] shadow-md ring-1 ring-[#3DB663]/20'
                        : 'bg-white/60 hover:bg-white border-[#D7DCE5] text-[#4A5B60]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#7E8F95] uppercase">
                        0{idx + 1} · {tab.tag}
                      </span>
                      {activeServeTab === idx && (
                        <span className="h-2 w-2 rounded-full bg-[#3DB663]" />
                      )}
                    </div>
                    <div className="font-display text-base font-bold text-[#0A282D] mt-1">
                      {tab.title}
                    </div>
                    <div className="text-xs text-[#7E8F95] font-mono mt-0.5">
                      {tab.subtitle}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="btn btn--soft"
                >
                  <span>View Fleet Compliance Posture</span>
                  <span className="btn-ico">
                    <ArrowRight size={13} className="stroke-[2.5]" />
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Living Simulated UI Stage (Potadot sa-cards & sa-track) */}
            <div
              ref={tabsContentRef}
              className="lg:col-span-7 bg-white rounded-3xl border border-[#D7DCE5] p-6 sm:p-8 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-5 border-b border-[#D7DCE5]">
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-[#3DB663]">
                    {serveTabs[activeServeTab].tag}
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#0A282D] mt-0.5">
                    {serveTabs[activeServeTab].title}
                  </h3>
                  <div className="text-xs text-[#7E8F95] font-mono">
                    {serveTabs[activeServeTab].subtitle}
                  </div>
                </div>
                <span className="ui-pill">
                  ✓ CIS Compliant
                </span>
              </div>

              {/* Potadot Micro UI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
                <div className="ui-card">
                  <div className="ui-strong">Ingress Rules</div>
                  <div className="ui-mini">Strict Filtering</div>
                  <div className="meter"><i></i></div>
                </div>
                <div className="ui-card">
                  <div className="ui-strong">SSH Protocol</div>
                  <div className="ui-mini">v2 Enforced</div>
                  <span className="ui-pill">Active</span>
                </div>
                <div className="ui-card">
                  <div className="ui-strong">Syslog TLS</div>
                  <div className="ui-mini">Encrypted Forwarding</div>
                  <span className="ui-pill">Non-repudiation</span>
                </div>
              </div>

              {/* Native Configuration Preview Box */}
              <div className="rounded-2xl bg-[#0A282D] p-4 text-[#A3B8BC] font-mono text-xs overflow-x-auto shadow-inner border border-[#1E4950]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] text-[#7E8F95] uppercase">
                  <span>Device Running Configuration</span>
                  <span className="text-[#3DB663]">Validated Regex Match</span>
                </div>
                <pre className="text-white leading-relaxed">
                  {serveTabs[activeServeTab].sampleCode}
                </pre>
              </div>

              {/* Potadot Signature Pipeline Stage Track */}
              <div className="sa-track">
                <div className="sa-line">
                  <i style={{ width: `${(activeServeTab + 1) * 25}%` }} />
                </div>
                <div className="sa-node">
                  <span className="n">01</span>
                  <span>Ingestion</span>
                </div>
                <div className="sa-node">
                  <span className="n">02</span>
                  <span>AST Parsing</span>
                </div>
                <div className="sa-node">
                  <span className="n">03</span>
                  <span>Regex Core</span>
                </div>
                <div className="sa-node">
                  <span className="n">04</span>
                  <span>CIS Certified</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#D7DCE5] flex items-center justify-between text-xs font-mono text-[#7E8F95]">
                <span>Deterministic Check: PASS (100% Match)</span>
                <span className="text-[#3DB663] font-bold">Zero Security Anomalies</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. AUDIT LIFECYCLE (Potadot sx-sec accordion cards) */}
      <section className="gsap-reveal py-20 lg:py-28 bg-white border-y border-[#D7DCE5]" id="lifecycle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="eyebrow mb-3">Deterministic Pipeline</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0A282D] tracking-tight">
              The four stages of verifiable audit integrity.
            </h2>
            <p className="mt-3 text-sm text-[#4A5B60] leading-relaxed">
              From raw configuration ingestion to verified staged CLI remediation, every step follows strict deterministic logic with complete auditability.
            </p>
          </div>

          {/* Accordion Cards (.sx) */}
          <div className="sx">
            {sxItems.map((item, idx) => (
              <article
                key={idx}
                className={`sx-item ${activeSxItem === idx ? 'is-open' : ''}`}
              >
                <div
                  className="sx-tab"
                  onClick={() => setActiveSxItem(activeSxItem === idx ? -1 : idx)}
                >
                  <span className="sx-n">{item.num}</span>
                  <span className="sx-name">{item.title}</span>
                  <span
                    className={`ml-auto w-8 h-8 rounded-full border border-[#D7DCE5] flex items-center justify-center transition-transform ${
                      activeSxItem === idx ? 'rotate-180 bg-[#3DB663] text-white border-transparent' : 'bg-[#F2F3F7] text-[#0A282D]'
                    }`}
                  >
                    <ChevronDown size={16} />
                  </span>
                </div>

                {activeSxItem === idx && (
                  <div className="sx-body animate-fadeIn">
                    <div className="sx-copy">
                      <span className="text-xs font-mono font-bold uppercase text-[#3DB663]">
                        {item.num} / 04 Pipeline Stage
                      </span>
                      <h3 className="font-display text-2xl font-bold text-[#0A282D] mt-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#4A5B60] mt-2 leading-relaxed">
                        {item.sub}
                      </p>
                      <ul className="my-6 space-y-2.5">
                        {item.features.map((f, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2.5 text-sm text-[#0A282D]">
                            <span className="h-5 w-5 rounded-full bg-[#EDF8F1] text-[#3DB663] flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check size={12} className="stroke-[3]" />
                            </span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={onStartAudit}
                        className="btn btn--green"
                      >
                        <span>Execute Stage in Ingestion Console</span>
                        <span className="btn-ico">
                          <ArrowRight size={13} className="stroke-[2.5]" />
                        </span>
                      </button>
                    </div>

                    {/* Realistic System Window Mockup (.mk-win) */}
                    <div className="sx-visual">
                      <div className="mk-win">
                        <div className="mk-top">
                          <span>{item.mockup.filename}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#EDF8F1] text-[#1E6E37] text-[10px] font-bold border border-[#BFE7CB]">
                            {item.mockup.badge}
                          </span>
                        </div>
                        <div className="mk-kpis">
                          {item.mockup.tokens.map((t, tIdx) => (
                            <div key={tIdx}>
                              <small>{t.key}</small>
                              <b>{t.val}</b>
                            </div>
                          ))}
                        </div>
                        <div className="pt-3 border-t border-[#1E4950] text-[10px] text-[#8AA3A8] flex items-center justify-between">
                          <span>State: Deterministic Verified</span>
                          <span className="text-[#3DB663] font-bold">100% Cryptographic Match</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 7. WHY DETERMINISTIC SECURITY (Potadot on-dark section with glowing rings) */}
      <section className="gsap-reveal py-20 lg:py-28 on-dark" id="why-deterministic">
        <div className="dark-dots absolute inset-0 opacity-40 pointer-events-none" />
        <div className="orb orb--dark-ring w-[500px] h-[500px] -right-32 top-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mb-14">
            <span className="eyebrow eyebrow-dark mb-3">Guaranteed Safety</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Security built on proof, not probabilistic guessing.
            </h2>
            <p className="mt-3 text-sm text-[#A3B8BC] leading-relaxed">
              We never guess compliance or run generative AI loops on physical infrastructure. Deterministic rules dictate facts; AI explains them.
            </p>
          </div>

          {/* Numbered Glowing Rings (.rings) */}
          <div className="rings">
            <div className="ring-item">
              <div className="ring-num"><b>01</b></div>
              <h3>100% Deterministic & Verifiable</h3>
              <p>
                Rules are evaluated by strict deterministic Python regular expressions based on official CIS Benchmarks and NIST SP 800-53 controls. Generative AI never determines whether a check passes or fails.
              </p>
            </div>

            <div className="ring-item">
              <div className="ring-num"><b>02</b></div>
              <h3>Safe Boundary Isolation</h3>
              <p>
                NetSecure AI audits uploaded configuration text files. It contains zero active network probes and zero device write permissions. Your physical infrastructure is completely isolated from live risks.
              </p>
            </div>

            <div className="ring-item">
              <div className="ring-num"><b>03</b></div>
              <h3>Continuous Autonomous Learning</h3>
              <p>
                Unmapped vendor commands are safely isolated in the Training Center, enabling network architects to permanently teach the engine new vendor parameters with human oversight.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE FINDINGS & REMEDIATION PLAYGROUND */}
      <section className="gsap-reveal py-20 lg:py-28" id="sandbox">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="eyebrow mb-3">Live Interactive Demonstration</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0A282D] tracking-tight">
              Test deterministic remediation in real time.
            </h2>
            <p className="mt-3 text-sm text-[#4A5B60] leading-relaxed">
              Experience how NetSecure AI isolates a failed CIS control, generates native CLI remediation syntax, and confirms the fix in the staged working configuration.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#D7DCE5] p-6 sm:p-10 shadow-sm">
            {/* Header with Posture Meter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D7DCE5]">
              <div>
                <span className="text-xs font-mono uppercase text-[#7E8F95] font-semibold">
                  Device: Cisco-Catalyst-9300-Core
                </span>
                <div className="font-display text-2xl font-bold text-[#0A282D] mt-0.5">
                  CIS Cisco IOS 15 Benchmark Audit
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right font-mono">
                  <div className="text-xs text-[#7E8F95] uppercase">Compliance Posture</div>
                  <div className={`text-2xl font-bold ${sandboxRemediated ? 'text-[#3DB663]' : 'text-[#E11D48]'}`}>
                    {sandboxRemediated ? '100% Compliant' : '75% Non-Compliant'}
                  </div>
                </div>
                <button
                  onClick={() => setSandboxRemediated(!sandboxRemediated)}
                  className={`btn ${sandboxRemediated ? 'btn--soft' : 'btn--green'}`}
                >
                  <RefreshCw size={14} className={sandboxRemediated ? '' : 'animate-spin'} />
                  <span>{sandboxRemediated ? 'Reset Demo State' : 'Apply Staged Remediation'}</span>
                </button>
              </div>
            </div>

            {/* Findings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
              {/* Control 1: Telnet Hardening */}
              <div className="p-5 rounded-2xl border border-[#D7DCE5] bg-[#F2F3F7]/50 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A282D]">CIS 1.1.1: Ensure Telnet is Disabled</span>
                  {sandboxRemediated ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EDF8F1] text-[#1E6E37] font-bold border border-[#BFE7CB]">
                      PASS
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FEECEC] text-[#9F1239] font-bold border border-[#FCA5A5]">
                      FAIL
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-[#4A5B60]">
                  {sandboxRemediated
                    ? 'Transport input is set strictly to SSH. Plaintext telnet daemon is disabled.'
                    : 'Cleartext Telnet credentials transmission detected across VTY lines 0 through 4.'}
                </p>
                <div className="p-3 rounded-xl bg-white border border-[#D7DCE5] text-[11px]">
                  <span className="text-[#7E8F95]">Config Line: </span>
                  <span className={sandboxRemediated ? 'text-[#3DB663] font-bold' : 'text-[#E11D48] font-bold line-through'}>
                    {sandboxRemediated ? 'transport input ssh' : 'transport input telnet ssh'}
                  </span>
                </div>
              </div>

              {/* Control 2: SSH Protocol Version 2 */}
              <div className="p-5 rounded-2xl border border-[#D7DCE5] bg-[#F2F3F7]/50 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A282D]">CIS 1.1.2: Enforce SSH Version 2</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EDF8F1] text-[#1E6E37] font-bold border border-[#BFE7CB]">
                    PASS
                  </span>
                </div>
                <p className="font-sans text-xs text-[#4A5B60]">
                  Legacy SSH v1 protocol disabled. 2048-bit RSA keys negotiated for cryptographic transport.
                </p>
                <div className="p-3 rounded-xl bg-white border border-[#D7DCE5] text-[11px]">
                  <span className="text-[#7E8F95]">Config Line: </span>
                  <span className="text-[#3DB663] font-bold">ip ssh version 2</span>
                </div>
              </div>
            </div>

            {/* CLI Staged Remediation Box */}
            <div className="rounded-2xl bg-[#0A282D] text-white p-6 font-mono text-xs border border-[#1E4950]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-[#3DB663]" />
                  <span className="font-bold">Deterministic Staged Remediation Script</span>
                </div>
                <span className="text-[10px] text-[#A3B8BC] uppercase">
                  {sandboxRemediated ? 'Verified in Sandbox' : 'Staged for Review'}
                </span>
              </div>
              <pre className="text-[#3DB663] leading-relaxed">
{`configure terminal
line vty 0 4
 transport input ssh
 exit
write memory`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 9. MARQUEE BANNER (Potadot big-marquee) */}
      <section className="big-marquee" aria-hidden="true">
        <div className="marquee-track">
          <span>Cisco IOS-XE</span>
          <i className="sep" />
          <span>Fortinet FortiOS</span>
          <i className="sep" />
          <span>Palo Alto PAN-OS</span>
          <i className="sep" />
          <span>Juniper Junos</span>
          <i className="sep" />
          <span>Aruba AOS-CX</span>
          <i className="sep" />
          <span>Check Point Gaia</span>
          <i className="sep" />
          <span>CIS Benchmark Certified</span>
          <i className="sep" />
          <span>NIST SP 800-53</span>
          <i className="sep" />
          <span>Deterministic Regex Core</span>
          <i className="sep" />
          <span>Cisco IOS-XE</span>
          <i className="sep" />
          <span>Fortinet FortiOS</span>
          <i className="sep" />
          <span>Palo Alto PAN-OS</span>
          <i className="sep" />
          <span>Juniper Junos</span>
          <i className="sep" />
          <span>Aruba AOS-CX</span>
          <i className="sep" />
          <span>Check Point Gaia</span>
          <i className="sep" />
          <span>CIS Benchmark Certified</span>
        </div>
      </section>

      {/* 10. FREQUENTLY ASKED QUESTIONS (Potadot faq) */}
      <section className="gsap-reveal py-20 lg:py-28" id="faq">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <span className="eyebrow mb-3">Straight Answers</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0A282D] tracking-tight">
                Frequently asked technical questions.
              </h2>
              <p className="text-sm text-[#4A5B60] leading-relaxed">
                Everything you need to know about our deterministic rules, multi-vendor parsers, and zero-touch security boundary.
              </p>
              <div className="pt-2">
                <button
                  onClick={onStartAudit}
                  className="btn btn--green"
                >
                  <span>Launch Ingestion Console</span>
                  <span className="btn-ico">
                    <ArrowRight size={13} className="stroke-[2.5]" />
                  </span>
                </button>
              </div>
            </div>

            <div className="faq lg:col-span-7">
              {faqs.map((f, idx) => (
                <details key={idx} open={idx === 0}>
                  <summary>
                    <span>{f.q}</span>
                    <span className="pm" aria-hidden="true" />
                  </summary>
                  <div className="ans">
                    <p>{f.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 11. HIGH-IMPACT DARK CALL TO ACTION CARD (Potadot cta) */}
      <section className="gsap-reveal py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cta">
            <div className="cta-orb" />
            <div className="dark-dots absolute inset-0 opacity-40 pointer-events-none" />

            <div className="cta-row">
              <div className="space-y-6">
                <span className="eyebrow eyebrow-dark">Get Started Immediately</span>
                <h2>
                  Have network configurations that need deterministic compliance?
                </h2>
                <p className="text-sm sm:text-base text-[#A3B8BC] leading-relaxed">
                  Upload raw device configuration files now to generate instant CIS & NIST audit evaluations, AI explanations, and verified CLI remediation scripts.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    onClick={onStartAudit}
                    className="btn btn--green text-sm sm:text-base px-6 py-3"
                  >
                    <span>Launch Configuration Audit</span>
                    <span className="btn-ico">
                      <ArrowRight size={14} className="stroke-[2.5]" />
                    </span>
                  </button>
                  <Link
                    to="/login"
                    className="btn btn--light text-sm sm:text-base px-6 py-3"
                  >
                    <span>Auditor Sign In</span>
                    <span className="btn-ico">
                      <ArrowRight size={14} className="stroke-[2.5]" />
                    </span>
                  </Link>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs text-[#A3B8BC] border-l border-white/10 pl-6 hidden lg:block">
                <div>Offline Configuration Ingestion</div>
                <div>CIS Benchmark Level 1 & Level 2</div>
                <div>NIST SP 800-53 Rev 5 Mapping</div>
                <div className="text-[#3DB663] font-bold">Zero Production Hardware Touching</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. ARCHITECTURAL SITE FOOTER (Potadot site-footer) */}
      <footer className="site-footer">
        <div className="dark-dots absolute inset-0 opacity-25 pointer-events-none" />
        {/* Background Watermark Mark SVG */}
        <svg
          className="foot-mark"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="foot-grid">
            {/* Brand Column */}
            <div className="foot-brand space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3DB663] text-white">
                  <Shield size={18} className="stroke-[2.4]" />
                </div>
                <div className="text-lg font-display font-bold tracking-tight text-white">
                  NetSecure AI
                </div>
              </div>
              <p>
                Deterministic Multi-Vendor Network Security Compliance, Adaptive Rule Learning, and Verified Remediation Engine.
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs font-mono text-[#3DB663]">
                <span className="h-2 w-2 rounded-full bg-[#3DB663] animate-ping" />
                <span>Deterministic Core Active</span>
              </div>
            </div>

            {/* Column: Platform */}
            <div>
              <h4>Platform</h4>
              <ul>
                <li><button onClick={() => onNavigate('dashboard')} className="hover:text-white transition-colors">Fleet Dashboard</button></li>
                <li><button onClick={onStartAudit} className="hover:text-white transition-colors">Configuration Audits</button></li>
                <li><button onClick={() => onNavigate('results')} className="hover:text-white transition-colors">Audit Findings</button></li>
                <li><button onClick={() => onNavigate('training')} className="hover:text-white transition-colors">Training Center</button></li>
                <li><button onClick={() => onNavigate('reports')} className="hover:text-white transition-colors">PDF Reports Archive</button></li>
              </ul>
            </div>

            {/* Column: Vendors */}
            <div>
              <h4>Vendors</h4>
              <ul>
                <li><span>Cisco IOS / IOS-XE</span></li>
                <li><span>Fortinet FortiOS</span></li>
                <li><span>Palo Alto PAN-OS</span></li>
                <li><span>Juniper Junos OS</span></li>
                <li><span>Aruba AOS-CX</span></li>
                <li><span>Check Point Gaia</span></li>
              </ul>
            </div>

            {/* Column: Standards */}
            <div>
              <h4>Compliance</h4>
              <ul>
                <li><span>CIS Benchmark L1 & L2</span></li>
                <li><span>NIST SP 800-53 Rev 5</span></li>
                <li><span>Zero-Touch Boundary</span></li>
                <li><span>Deterministic Regex</span></li>
                <li><span>Staged CLI Sandbox</span></li>
              </ul>
            </div>
          </div>

          <div className="foot-bottom">
            <div>
              © {new Date().getFullYear()} NetSecure AI Platform. All rights reserved.
            </div>
            <div>
              Offline Configuration Auditing · Zero Direct Production Write Access
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
