import React, { useEffect, useRef, useState } from 'react'

interface Node3D {
  id: string
  label: string
  sublabel: string
  type: 'cisco' | 'fortinet' | 'paloalto' | 'server' | 'cloud' | 'gateway' | 'remote'
  baseAngle: number
  radius: number
  heightOffset: number
  speed: number
  color: string
  bgColor: string
  // Dynamic 3D coordinates
  x: number
  y: number
  z: number
  screenX: number
  screenY: number
  scale: number
  alpha: number
}

interface Particle {
  sourceIndex: number
  targetIndex: number // -1 = central core
  progress: number
  speed: number
  type: 'network' | 'analysis' | 'finding' | 'compliant'
  color: string
}

export function Hero3DVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [activeStoryStage, setActiveStoryStage] = useState(1)

  // Floating panel visibility & active stage simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStoryStage((prev) => (prev % 7) + 1)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resize = () => {
      const container = containerRef.current
      if (!container || !canvas) return
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    // Realistic Enterprise Network Topology Nodes with 3D Depth
    const nodes: Node3D[] = [
      {
        id: 'cisco-core',
        label: 'Cisco IOS-XE',
        sublabel: 'Core Router &bull; 10.10.1.1',
        type: 'cisco',
        baseAngle: 0.15,
        radius: 195,
        heightOffset: -35,
        speed: 0.0018,
        color: '#38bdf8',
        bgColor: '#0c2238',
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
      {
        id: 'fortinet-ngfw',
        label: 'Fortinet FortiOS',
        sublabel: 'Perimeter NGFW &bull; 10.20.0.1',
        type: 'fortinet',
        baseAngle: (Math.PI * 2) / 7 + 0.1,
        radius: 210,
        heightOffset: 30,
        speed: 0.0018,
        color: '#f87171',
        bgColor: '#2a1216',
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
      {
        id: 'paloalto-edge',
        label: 'Palo Alto PAN-OS',
        sublabel: 'Security Gateway &bull; 10.30.0.1',
        type: 'paloalto',
        baseAngle: (Math.PI * 4) / 7 + 0.2,
        radius: 200,
        heightOffset: -20,
        speed: 0.0018,
        color: '#fb923c',
        bgColor: '#2a190e',
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
      {
        id: 'cloud-vpc',
        label: 'Cloud Infrastructure',
        sublabel: 'AWS/Azure Transit Hub',
        type: 'cloud',
        baseAngle: (Math.PI * 6) / 7 + 0.05,
        radius: 220,
        heightOffset: 45,
        speed: 0.0018,
        color: '#a78bfa',
        bgColor: '#1e1435',
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
      {
        id: 'dc-servers',
        label: 'Enterprise Data Center',
        sublabel: 'Auth & Logging Cluster',
        type: 'server',
        baseAngle: (Math.PI * 8) / 7 + 0.15,
        radius: 185,
        heightOffset: -45,
        speed: 0.0018,
        color: '#34d399',
        bgColor: '#0e291e',
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
      {
        id: 'branch-remote',
        label: 'Remote Branch Node',
        sublabel: 'IPSec VPN Tunnel',
        type: 'remote',
        baseAngle: (Math.PI * 10) / 7 + 0.3,
        radius: 215,
        heightOffset: 15,
        speed: 0.0018,
        color: '#60a5fa',
        bgColor: '#13233a',
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
      {
        id: 'edge-gateway',
        label: 'Perimeter Gateway',
        sublabel: 'DMZ Ingress Point',
        type: 'gateway',
        baseAngle: (Math.PI * 12) / 7 + 0.25,
        radius: 190,
        heightOffset: -10,
        speed: 0.0018,
        color: '#fbbf24',
        bgColor: '#2a220e',
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
    ]

    // Multi-color data particles communicating the visual storyline
    const particles: Particle[] = [
      { sourceIndex: 0, targetIndex: -1, progress: 0.08, speed: 0.0055, type: 'network', color: '#38bdf8' },
      { sourceIndex: 1, targetIndex: -1, progress: 0.28, speed: 0.0062, type: 'finding', color: '#f87171' },
      { sourceIndex: 2, targetIndex: -1, progress: 0.48, speed: 0.005, type: 'finding', color: '#fb923c' },
      { sourceIndex: 3, targetIndex: -1, progress: 0.68, speed: 0.007, type: 'analysis', color: '#a78bfa' },
      { sourceIndex: 4, targetIndex: -1, progress: 0.88, speed: 0.006, type: 'compliant', color: '#34d399' },
      { sourceIndex: 5, targetIndex: -1, progress: 0.38, speed: 0.0052, type: 'network', color: '#60a5fa' },
      { sourceIndex: 6, targetIndex: -1, progress: 0.58, speed: 0.0065, type: 'analysis', color: '#fbbf24' },
      // Cross-node particle streams
      { sourceIndex: 0, targetIndex: 4, progress: 0.22, speed: 0.0045, type: 'network', color: '#38bdf8' },
      { sourceIndex: 1, targetIndex: 2, progress: 0.62, speed: 0.0055, type: 'finding', color: '#f87171' },
      { sourceIndex: 3, targetIndex: 5, progress: 0.82, speed: 0.0048, type: 'compliant', color: '#34d399' },
    ]

    const render = () => {
      const container = containerRef.current
      if (!container || !canvas) return
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const centerX = width / 2
      const centerY = height / 2

      ctx.clearRect(0, 0, width, height)

      // Smooth mouse parallax easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04

      const tiltX = (mouseRef.current.y / height - 0.5) * 0.32 + 0.38 // 3D pitch
      const tiltY = (mouseRef.current.x / width - 0.5) * 0.42 // 3D yaw

      if (!prefersReducedMotion) {
        time += 0.008
      }

      const fov = 400
      const cameraZ = 460

      // 1. Subtle 3D background coordinate concentric grid
      ctx.save()
      ctx.strokeStyle = '#1e293b50'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 5])

      for (const r of [110, 190, 260]) {
        ctx.beginPath()
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const rawX = Math.cos(a) * r
          const rawZ = Math.sin(a) * r
          const rawY = 25

          const rx1 = rawX * Math.cos(tiltY) + rawZ * Math.sin(tiltY)
          const rz1 = -rawX * Math.sin(tiltY) + rawZ * Math.cos(tiltY)
          const ry1 = rawY * Math.cos(tiltX) - rz1 * Math.sin(tiltX)
          const rz2 = rawY * Math.sin(tiltX) + rz1 * Math.cos(tiltX)

          const scale = fov / (cameraZ + rz2)
          const screenX = centerX + rx1 * scale
          const screenY = centerY + ry1 * scale

          if (a === 0) ctx.moveTo(screenX, screenY)
          else ctx.lineTo(screenX, screenY)
        }
        ctx.closePath()
        ctx.stroke()
      }
      ctx.restore()

      // 2. Project 3D Network Nodes
      nodes.forEach((node) => {
        const angle = node.baseAngle + (prefersReducedMotion ? 0 : time * node.speed * 8)
        const rawX = Math.cos(angle) * node.radius
        const rawZ = Math.sin(angle) * node.radius
        const rawY = node.heightOffset + (prefersReducedMotion ? 0 : Math.sin(time * 1.5 + angle) * 6)

        const rx1 = rawX * Math.cos(tiltY) + rawZ * Math.sin(tiltY)
        const rz1 = -rawX * Math.sin(tiltY) + rawZ * Math.cos(tiltY)
        const ry1 = rawY * Math.cos(tiltX) - rz1 * Math.sin(tiltX)
        const rz2 = rawY * Math.sin(tiltX) + rz1 * Math.cos(tiltX)

        const scale = fov / (cameraZ + rz2)
        node.x = rx1
        node.y = ry1
        node.z = rz2
        node.screenX = centerX + rx1 * scale
        node.screenY = centerY + ry1 * scale
        node.scale = Math.max(0.6, Math.min(1.4, scale * 1.05))
        node.alpha = Math.max(0.3, Math.min(1, (rz2 + 300) / 480))
      })

      const sortedNodes = [...nodes].sort((a, b) => b.z - a.z)

      const coreScreenX = centerX
      const coreScreenY = centerY
      const centerScale = fov / cameraZ

      // 3. Draw connection lines between nodes & central security engine
      nodes.forEach((node, i) => {
        ctx.save()
        // Subtle depth opacity
        const lineAlpha = (node.alpha * 0.45).toFixed(2)
        ctx.strokeStyle = `${node.color}${Math.round(parseFloat(lineAlpha) * 255).toString(16).padStart(2, '0')}`
        ctx.lineWidth = Math.max(1, 1.3 * node.scale)

        const midX = (coreScreenX + node.screenX) / 2
        const midY = (coreScreenY + node.screenY) / 2 - 16 * node.scale

        ctx.beginPath()
        ctx.moveTo(coreScreenX, coreScreenY)
        ctx.quadraticCurveTo(midX, midY, node.screenX, node.screenY)
        ctx.stroke()

        // Cross connection to subsequent node
        const nextNode = nodes[(i + 1) % nodes.length]
        ctx.strokeStyle = '#22304930'
        ctx.setLineDash([2, 4])
        ctx.beginPath()
        ctx.moveTo(node.screenX, node.screenY)
        ctx.lineTo(nextNode.screenX, nextNode.screenY)
        ctx.stroke()

        ctx.restore()
      })

      // 4. Draw Traveling Data Particles along network arcs
      particles.forEach((packet) => {
        const sourceNode = nodes[packet.sourceIndex]
        if (!sourceNode) return

        let targetX = coreScreenX
        let targetY = coreScreenY

        if (packet.targetIndex >= 0 && nodes[packet.targetIndex]) {
          const targetNode = nodes[packet.targetIndex]
          targetX = targetNode.screenX
          targetY = targetNode.screenY
        }

        if (!prefersReducedMotion) {
          packet.progress += packet.speed
          if (packet.progress > 1) packet.progress = 0
        }

        const t = packet.progress
        const midX = (targetX + sourceNode.screenX) / 2
        const midY = (targetY + sourceNode.screenY) / 2 - 16 * sourceNode.scale

        const px = (1 - t) * (1 - t) * sourceNode.screenX + 2 * (1 - t) * t * midX + t * t * targetX
        const py = (1 - t) * (1 - t) * sourceNode.screenY + 2 * (1 - t) * t * midY + t * t * targetY

        ctx.save()
        ctx.fillStyle = packet.color
        ctx.shadowColor = packet.color
        ctx.shadowBlur = 6

        ctx.beginPath()
        ctx.arc(px, py, 2.4 * sourceNode.scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // 5. Draw 3D Network Nodes with Atmospheric Depth
      sortedNodes.forEach((node) => {
        ctx.save()
        ctx.translate(node.screenX, node.screenY)
        ctx.globalAlpha = node.alpha

        // Outer Node Ring
        ctx.fillStyle = node.bgColor
        ctx.strokeStyle = node.color
        ctx.lineWidth = 1.6

        ctx.beginPath()
        ctx.arc(0, 0, 12 * node.scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Inner Core Pip
        ctx.fillStyle = node.color
        ctx.beginPath()
        ctx.arc(0, 0, 4.5 * node.scale, 0, Math.PI * 2)
        ctx.fill()

        // Node Label
        ctx.font = `600 ${Math.max(10, 11 * node.scale)}px "Inter", sans-serif`
        ctx.fillStyle = '#f1f5f9'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(node.label, 0, 16 * node.scale)

        // Sublabel / IP
        ctx.font = `500 ${Math.max(8, 8.5 * node.scale)}px "JetBrains Mono", monospace`
        ctx.fillStyle = node.color
        ctx.fillText(node.sublabel.split('&bull;')[0].trim(), 0, 29 * node.scale)

        ctx.restore()
      })

      // 6. Draw Central NetSecure AI Security Engine (Metallic Shield Core)
      ctx.save()
      ctx.translate(coreScreenX, coreScreenY)

      const coreRot = prefersReducedMotion ? 0 : time * 0.35
      const coreRadius = 36 * centerScale

      // Outer rotating geometric frame
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const ang = coreRot + (i * Math.PI) / 4
        const px = Math.cos(ang) * (coreRadius * 1.35)
        const py = Math.sin(ang) * (coreRadius * 0.95)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()

      // Metallic/Dark Core Base Shield
      ctx.fillStyle = '#081424'
      ctx.strokeStyle = '#0284c7'
      ctx.lineWidth = 2.4

      ctx.beginPath()
      ctx.moveTo(0, -coreRadius)
      ctx.lineTo(coreRadius * 0.85, -coreRadius * 0.4)
      ctx.lineTo(coreRadius * 0.7, coreRadius * 0.5)
      ctx.lineTo(0, coreRadius * 1.08)
      ctx.lineTo(-coreRadius * 0.7, coreRadius * 0.5)
      ctx.lineTo(-coreRadius * 0.85, -coreRadius * 0.4)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Faceted metallic shine lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, -coreRadius)
      ctx.lineTo(0, coreRadius * 1.08)
      ctx.moveTo(-coreRadius * 0.85, -coreRadius * 0.4)
      ctx.lineTo(coreRadius * 0.85, -coreRadius * 0.4)
      ctx.stroke()

      // Abstract "N" / Shield Core Emblem
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('NETSECURE', 0, -4)

      ctx.font = 'bold 9px "JetBrains Mono", monospace'
      ctx.fillStyle = '#38bdf8'
      ctx.fillText('ENGINE v2.4', 0, 10)

      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [prefersReducedMotion])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseRef.current.targetX = e.clientX - rect.left
    mouseRef.current.targetY = e.clientY - rect.top
  }

  const handleMouseLeave = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseRef.current.targetX = rect.width / 2
    mouseRef.current.targetY = rect.height / 2
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[540px] lg:h-[600px] rounded-lg border border-slate-800 bg-[#070b16] overflow-hidden select-none"
    >
      {/* 3D Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
        style={{ touchAction: 'none' }}
      />

      {/* Top Left Floating Security Panel: Configuration Analysis */}
      <div className="absolute top-4 left-4 z-20 w-48 sm:w-56 p-3 rounded-md bg-[#0a1120]/95 border border-slate-800 shadow-xl backdrop-blur-md transition-transform duration-300 pointer-events-none">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Configuration Analysis
          </span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-800/60">
            COMPLETE
          </span>
        </div>
        <div className="mt-2 space-y-1 font-mono text-[10px]">
          <div className="flex items-center justify-between text-slate-300">
            <span>SSH v2.0</span>
            <span className="text-emerald-400">ENFORCED</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Logging Host</span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Authentication</span>
            <span className="text-sky-300">AAA / TACACS+</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Encryption</span>
            <span className="text-emerald-400">AES-256</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Access Control</span>
            <span className="text-emerald-400">RESTRICTED</span>
          </div>
        </div>
      </div>

      {/* Top Right Floating Security Panel: Compliance Frameworks */}
      <div className="absolute top-4 right-4 z-20 w-48 sm:w-52 p-3 rounded-md bg-[#0a1120]/95 border border-slate-800 shadow-xl backdrop-blur-md transition-transform duration-300 pointer-events-none">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono">
            Compliance
          </span>
          <span className="text-[9px] font-mono text-sky-400">100% Evaluated</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[10px]">
          <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-bold">CIS</span>
            <span className="text-emerald-400">✓</span>
          </div>
          <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-bold">NIST</span>
            <span className="text-emerald-400">✓</span>
          </div>
          <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-bold">ISO 27001</span>
            <span className="text-emerald-400">✓</span>
          </div>
          <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-bold">DISA STIG</span>
            <span className="text-emerald-400">✓</span>
          </div>
        </div>
      </div>

      {/* Bottom Left Floating Security Panel: Security Findings */}
      <div className="absolute bottom-16 left-4 z-20 w-52 sm:w-60 p-3 rounded-md bg-[#0a1120]/95 border border-slate-800 shadow-xl backdrop-blur-md transition-transform duration-300 pointer-events-none">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono">
            Security Findings
          </span>
          <span className="text-[9px] font-mono text-rose-400 bg-rose-950/80 px-1 py-0.2 rounded border border-rose-800/60">
            DEMO
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
          <div className="p-1 rounded bg-rose-950/40 border border-rose-800/40">
            <span className="text-[9px] text-rose-400 block font-sans">CRITICAL</span>
            <span className="font-bold text-rose-300">02</span>
          </div>
          <div className="p-1 rounded bg-amber-950/40 border border-amber-800/40">
            <span className="text-[9px] text-amber-400 block font-sans">HIGH</span>
            <span className="font-bold text-amber-300">05</span>
          </div>
          <div className="p-1 rounded bg-yellow-950/40 border border-yellow-800/40">
            <span className="text-[9px] text-yellow-400 block font-sans">MEDIUM</span>
            <span className="font-bold text-yellow-300">12</span>
          </div>
        </div>
        <div className="mt-2 p-1.5 rounded bg-slate-950 border border-slate-800/80 text-[10px] font-mono text-amber-300 flex items-center justify-between">
          <span>WEAK SSH CONFIG</span>
          <span className="text-[9px] font-bold uppercase px-1 rounded bg-amber-950 text-amber-300">HIGH</span>
        </div>
      </div>

      {/* Bottom Right Floating Security Panel: Deterministic Remediation */}
      <div className="absolute bottom-16 right-4 z-20 w-52 sm:w-60 p-3 rounded-md bg-[#0a1120]/95 border border-slate-800 shadow-xl backdrop-blur-md transition-transform duration-300 pointer-events-none">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
            Deterministic Remediation
          </span>
        </div>
        <div className="mt-2 space-y-1 text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span>Finding isolated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span>Control evaluated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span>Remediation validated</span>
          </div>
        </div>
        <div className="mt-2 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 p-1.5 rounded border border-emerald-800/60 font-mono text-center">
          ✓ Ready for implementation
        </div>
      </div>

      {/* Middle Floating Panel: Compliance Report */}
      <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 right-4 z-20 w-48 p-3 rounded-md bg-[#0a1120]/95 border border-slate-800 shadow-xl backdrop-blur-md pointer-events-none">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 font-mono">
            Compliance Report
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[10px]">
          <div>
            <span className="text-slate-400 block text-[9px]">SCORE</span>
            <span className="text-emerald-400 font-bold text-xs">91%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">CONTROLS</span>
            <span className="text-slate-200 font-bold text-xs">1,284</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">FINDINGS</span>
            <span className="text-amber-400 font-bold text-xs">07</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">REMEDIATED</span>
            <span className="text-sky-300 font-bold text-xs">87%</span>
          </div>
        </div>
        <div className="mt-2 text-[9px] font-mono text-sky-400 text-center border-t border-slate-800/60 pt-1.5">
          ● REPORT GENERATED
        </div>
      </div>

      {/* Bottom Process Storyline Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between px-3 py-1.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300 font-semibold">STAGE {activeStoryStage}/7:</span>
          <span className="text-sky-300">
            {activeStoryStage === 1 && 'Network Devices Activated'}
            {activeStoryStage === 2 && 'Configuration Ingestion Stream'}
            {activeStoryStage === 3 && 'Deterministic Security Analysis'}
            {activeStoryStage === 4 && 'Compliance Framework Mapping'}
            {activeStoryStage === 5 && 'Security Findings Isolation'}
            {activeStoryStage === 6 && 'Deterministic Remediation Generation'}
            {activeStoryStage === 7 && 'Audit-Ready Report Export'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 hidden md:inline">
            Devices &rarr; Config &rarr; Analysis &rarr; Controls &rarr; Findings &rarr; Remediation &rarr; Report
          </span>
          <span className="text-emerald-400 font-bold">Live Visual Telemetry</span>
        </div>
      </div>
    </div>
  )
}
