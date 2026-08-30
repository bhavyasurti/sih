import React, { useEffect, useRef, useState } from 'react'
import { Shield, ShieldAlert, ShieldCheck, Activity, Wifi, Server, RefreshCw } from 'lucide-react'

interface Node3D {
  id: string
  label: string
  vendor: 'cisco' | 'fortinet' | 'paloalto' | 'core' | 'edge'
  status: 'healthy' | 'warning' | 'critical'
  score?: number | null
  baseAngle: number
  radius: number
  heightOffset: number
  speed: number
  // dynamic 3D projected coords
  x: number
  y: number
  z: number
  screenX: number
  screenY: number
  scale: number
  alpha: number
}

interface Packet {
  sourceId: string
  progress: number // 0 to 1
  speed: number
  status: 'healthy' | 'warning' | 'critical'
}

interface SecurityTopology3DProps {
  complianceScore: number | null
  riskLevel: string
  auditCount: number
  vendorBreakdown?: {
    cisco: { count: number; score: number | null }
    fortinet: { count: number; score: number | null }
    paloalto: { count: number; score: number | null }
  }
}

export function SecurityTopology3D({
  complianceScore,
  riskLevel,
  auditCount,
  vendorBreakdown,
}: SecurityTopology3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  // Respect reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Derive vendor node statuses based on real backend scores
  const getStatusFromScore = (score: number | null | undefined): 'healthy' | 'warning' | 'critical' => {
    if (score === null || score === undefined) return 'healthy'
    if (score >= 80) return 'healthy'
    if (score >= 50) return 'warning'
    return 'critical'
  }

  const ciscoStatus = getStatusFromScore(vendorBreakdown?.cisco.score)
  const fortiStatus = getStatusFromScore(vendorBreakdown?.fortinet.score)
  const panStatus = getStatusFromScore(vendorBreakdown?.paloalto.score)
  const overallStatus = getStatusFromScore(complianceScore)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    // Set canvas dimensions
    const resizeCanvas = () => {
      const container = containerRef.current
      if (!container || !canvas) return
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initial 3D nodes
    const nodes: Node3D[] = [
      {
        id: 'cisco',
        label: 'Cisco IOS-XE Cluster',
        vendor: 'cisco',
        status: ciscoStatus,
        score: vendorBreakdown?.cisco.score ?? null,
        baseAngle: 0,
        radius: 130,
        heightOffset: -20,
        speed: 0.003,
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
      {
        id: 'fortinet',
        label: 'Fortinet FortiOS Perimeter',
        vendor: 'fortinet',
        status: fortiStatus,
        score: vendorBreakdown?.fortinet.score ?? null,
        baseAngle: (Math.PI * 2) / 3,
        radius: 140,
        heightOffset: 25,
        speed: 0.003,
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
      {
        id: 'paloalto',
        label: 'Palo Alto PAN-OS Gateway',
        vendor: 'paloalto',
        status: panStatus,
        score: vendorBreakdown?.paloalto.score ?? null,
        baseAngle: (Math.PI * 4) / 3,
        radius: 135,
        heightOffset: -10,
        speed: 0.003,
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
      {
        id: 'edge',
        label: 'Edge Access Node',
        vendor: 'edge',
        status: 'healthy',
        baseAngle: Math.PI / 4,
        radius: 165,
        heightOffset: 35,
        speed: 0.0025,
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
      {
        id: 'core',
        label: 'Core Distribution Spine',
        vendor: 'core',
        status: 'healthy',
        baseAngle: Math.PI * 1.1,
        radius: 160,
        heightOffset: -35,
        speed: 0.0025,
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        scale: 1,
        alpha: 1,
      },
    ]

    // Packets moving along links
    const packets: Packet[] = [
      { sourceId: 'cisco', progress: 0.1, speed: 0.008, status: ciscoStatus },
      { sourceId: 'fortinet', progress: 0.4, speed: 0.007, status: fortiStatus },
      { sourceId: 'paloalto', progress: 0.7, speed: 0.009, status: panStatus },
      { sourceId: 'edge', progress: 0.25, speed: 0.006, status: 'healthy' },
      { sourceId: 'core', progress: 0.85, speed: 0.007, status: 'healthy' },
    ]

    // Render loop
    const render = () => {
      const container = containerRef.current
      if (!container || !canvas) return
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const centerX = width / 2
      const centerY = height / 2

      ctx.clearRect(0, 0, width, height)

      // Smooth mouse parallax
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05

      const tiltX = (mouseRef.current.y / height - 0.5) * 0.35 + 0.35 // 3D pitch
      const tiltY = (mouseRef.current.x / width - 0.5) * 0.45 // 3D yaw

      if (!prefersReducedMotion) {
        time += 0.012
      }

      // Camera parameters
      const fov = 340
      const cameraZ = 420

      // 1. Draw subtle background coordinate grid / circular depth rings
      ctx.save()
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])

      // Orbital rings
      for (let r of [90, 140, 180]) {
        ctx.beginPath()
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const rawX = Math.cos(a) * r
          const rawZ = Math.sin(a) * r
          const rawY = 25 // planar ground

          // Rotate around X (pitch) and Y (yaw)
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

      // 2. Project 3D nodes
      nodes.forEach((node) => {
        const angle = node.baseAngle + (prefersReducedMotion ? 0 : time * node.speed * 8)
        const rawX = Math.cos(angle) * node.radius
        const rawZ = Math.sin(angle) * node.radius
        const rawY = node.heightOffset + (prefersReducedMotion ? 0 : Math.sin(time * 2 + angle) * 6)

        // Rotate by camera tilt
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
        node.scale = Math.max(0.6, Math.min(1.4, scale * 1.1))
        node.alpha = Math.max(0.3, Math.min(1, (rz2 + 250) / 400))
      })

      // Sort by Z depth for realistic rendering order (back to front)
      const sortedNodes = [...nodes].sort((a, b) => b.z - a.z)

      // Center security core 3D projection
      const centerScale = fov / cameraZ
      const coreScreenX = centerX
      const coreScreenY = centerY

      // 3. Draw connection links from center core to nodes
      nodes.forEach((node) => {
        ctx.save()
        const isWarning = node.status === 'warning'
        const isCrit = node.status === 'critical'

        // Stroke style
        ctx.strokeStyle = isCrit
          ? 'rgba(239, 68, 68, 0.45)'
          : isWarning
          ? 'rgba(245, 158, 11, 0.4)'
          : 'rgba(56, 189, 248, 0.35)'
        ctx.lineWidth = Math.max(1, 1.5 * node.scale)

        // Quadratic curve with subtle arc
        const midX = (coreScreenX + node.screenX) / 2
        const midY = (coreScreenY + node.screenY) / 2 - 15 * node.scale

        ctx.beginPath()
        ctx.moveTo(coreScreenX, coreScreenY)
        ctx.quadraticCurveTo(midX, midY, node.screenX, node.screenY)
        ctx.stroke()
        ctx.restore()
      })

      // 4. Draw moving data packets along lines
      packets.forEach((packet) => {
        const node = nodes.find((n) => n.id === packet.sourceId)
        if (!node) return

        if (!prefersReducedMotion) {
          packet.progress += packet.speed
          if (packet.progress > 1) packet.progress = 0
        }

        const t = packet.progress
        const midX = (coreScreenX + node.screenX) / 2
        const midY = (coreScreenY + node.screenY) / 2 - 15 * node.scale

        // Bezier interpolation
        const px = (1 - t) * (1 - t) * coreScreenX + 2 * (1 - t) * t * midX + t * t * node.screenX
        const py = (1 - t) * (1 - t) * coreScreenY + 2 * (1 - t) * t * midY + t * t * node.screenY

        ctx.save()
        const isCrit = packet.status === 'critical'
        const isWarn = packet.status === 'warning'
        ctx.fillStyle = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#38bdf8'
        ctx.shadowColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#38bdf8'
        ctx.shadowBlur = 6

        ctx.beginPath()
        ctx.arc(px, py, 2.5 * node.scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // 5. Draw 3D Nodes
      sortedNodes.forEach((node) => {
        ctx.save()
        ctx.translate(node.screenX, node.screenY)

        const isCrit = node.status === 'critical'
        const isWarn = node.status === 'warning'
        const baseColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981'
        const bgFill = isCrit ? '#2d1216' : isWarn ? '#2d2212' : '#0e241c'

        // Outer glow/ring
        ctx.fillStyle = bgFill
        ctx.strokeStyle = baseColor
        ctx.lineWidth = 1.5

        ctx.beginPath()
        ctx.arc(0, 0, 11 * node.scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Inner status pip
        ctx.fillStyle = baseColor
        ctx.beginPath()
        ctx.arc(0, 0, 4.5 * node.scale, 0, Math.PI * 2)
        ctx.fill()

        // Node Label
        ctx.font = `600 ${Math.max(9, 10 * node.scale)}px "Inter", sans-serif`
        ctx.fillStyle = '#e2e8f0'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(node.label.split(' ')[0], 0, 14 * node.scale)

        // Subtext / Vendor
        ctx.font = `500 ${Math.max(8, 8.5 * node.scale)}px "JetBrains Mono", monospace`
        ctx.fillStyle = isCrit ? '#f87171' : isWarn ? '#fbbf24' : '#34d399'
        const scoreText =
          node.score !== null && node.score !== undefined
            ? `${Math.round(node.score)}%`
            : node.status.toUpperCase()
        ctx.fillText(scoreText, 0, 26 * node.scale)

        ctx.restore()
      })

      // 6. Draw Central Security Posture 3D Core
      ctx.save()
      ctx.translate(coreScreenX, coreScreenY)

      // Slow 3D rotating dodecahedron / shield ring
      const coreRot = prefersReducedMotion ? 0 : time * 0.4
      const coreRadius = 26 * centerScale

      // Background shield orb
      const coreBg =
        overallStatus === 'critical'
          ? '#2d1216'
          : overallStatus === 'warning'
          ? '#2d2212'
          : '#0a1d2e'
      const coreBorder =
        overallStatus === 'critical'
          ? '#ef4444'
          : overallStatus === 'warning'
          ? '#f59e0b'
          : '#0ea5e9'

      // Rotating faceted wireframe around core
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const ang = coreRot + (i * Math.PI) / 3
        const px = Math.cos(ang) * (coreRadius * 1.35)
        const py = Math.sin(ang) * (coreRadius * 0.85)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()

      // Core Shield Base
      ctx.fillStyle = coreBg
      ctx.strokeStyle = coreBorder
      ctx.lineWidth = 2.5

      ctx.beginPath()
      ctx.arc(0, 0, coreRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Inner Core Emblem
      ctx.fillStyle = '#f8fafc'
      ctx.font = 'bold 11px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('NETSEC', 0, -3)

      ctx.font = 'bold 9px "JetBrains Mono", monospace'
      ctx.fillStyle = coreBorder
      ctx.fillText(complianceScore !== null ? `${Math.round(complianceScore)}%` : 'ARMED', 0, 9)

      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [complianceScore, riskLevel, ciscoStatus, fortiStatus, panStatus, overallStatus, prefersReducedMotion])

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        handleMouseLeave()
      }}
      className="relative w-full h-[280px] rounded-lg border border-slate-800 bg-[#090d16] overflow-hidden select-none flex flex-col justify-between"
    >
      {/* Topology Header Telemetry */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-[#0c1220]/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-sky-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
            Security Posture & Network Topology
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Passed</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
        style={{ touchAction: 'none' }}
      />

      {/* Topology Footer Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 border-t border-slate-800/80 bg-[#0c1220]/80 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span>Active Posture:</span>
          <span
            className={`font-bold ${
              overallStatus === 'healthy'
                ? 'text-emerald-400'
                : overallStatus === 'warning'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {riskLevel ? riskLevel.toUpperCase() : 'ARMED'}
          </span>
          <span>&bull;</span>
          <span>{complianceScore !== null ? `${Math.round(complianceScore)}% Fleet Score` : 'Evaluating'}</span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <Server size={11} className="text-slate-400" />
          <span>{auditCount} Network Nodes Evaluated</span>
        </div>
      </div>
    </div>
  )
}
