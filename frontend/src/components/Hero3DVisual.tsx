import React, { useEffect, useRef, useState } from 'react'

interface Node3D {
  id: string
  label: string
  sublabel: string
  type: 'cisco' | 'fortinet' | 'paloalto' | 'server' | 'cloud' | 'gateway' | 'remote' | 'compliance' | 'report' | 'finding'
  x: number
  y: number
  z: number
  baseX: number
  baseY: number
  baseZ: number
  speed: number
  color: string
  bgColor: string
  screenX: number
  screenY: number
  scale: number
  alpha: number
  status?: 'ok' | 'alert' | 'remediated'
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStoryStage((prev) => (prev % 7) + 1)
    }, 4000)
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
    const ctx = canvas.getContext('2d', { alpha: false }) // Optimize for solid bg
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

    // Expanded 3D scene covering a wide area. 
    // Left side: Network devices. Center: Analysis. Right: Compliance/Reports.
    const nodes: Node3D[] = [
      // Left side: Sources
      { id: 'cisco-core', label: 'Cisco IOS-XE', sublabel: 'Core', type: 'cisco', baseX: -400, baseY: -80, baseZ: 100, speed: 0.001, color: '#38bdf8', bgColor: '#0c2238', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1, status: 'ok' },
      { id: 'fortinet-edge', label: 'FortiOS NGFW', sublabel: 'Perimeter', type: 'fortinet', baseX: -350, baseY: 120, baseZ: -50, speed: 0.0015, color: '#f87171', bgColor: '#2a1216', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1, status: 'alert' },
      { id: 'paloalto-vpn', label: 'PAN-OS Gateway', sublabel: 'VPN', type: 'paloalto', baseX: -250, baseY: -200, baseZ: 200, speed: 0.0012, color: '#fb923c', bgColor: '#2a190e', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1, status: 'remediated' },
      { id: 'aws-vpc', label: 'AWS Transit Gateway', sublabel: 'Cloud', type: 'cloud', baseX: -150, baseY: 220, baseZ: -150, speed: 0.0018, color: '#a78bfa', bgColor: '#1e1435', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1, status: 'ok' },
      { id: 'aruba-switch', label: 'Aruba CX', sublabel: 'Access', type: 'gateway', baseX: -500, baseY: 40, baseZ: 50, speed: 0.0014, color: '#34d399', bgColor: '#0e291e', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1, status: 'ok' },

      // Center-ish top/bottom (Analysis context)
      { id: 'policy-engine', label: 'Policy Engine', sublabel: 'Evaluating', type: 'server', baseX: 50, baseY: -250, baseZ: -200, speed: 0.002, color: '#60a5fa', bgColor: '#13233a', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1 },
      { id: 'remediation-bot', label: 'Auto-Remediation', sublabel: 'Fixing', type: 'server', baseX: 100, baseY: 250, baseZ: 100, speed: 0.002, color: '#34d399', bgColor: '#0e291e', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1 },

      // Right side: Compliance & Output
      { id: 'cis-benchmark', label: 'CIS Benchmark', sublabel: 'Framework', type: 'compliance', baseX: 250, baseY: -120, baseZ: 150, speed: 0.001, color: '#eab308', bgColor: '#2a220e', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1 },
      { id: 'nist-800', label: 'NIST 800-53', sublabel: 'Framework', type: 'compliance', baseX: 300, baseY: 80, baseZ: -100, speed: 0.0015, color: '#fbbf24', bgColor: '#2a220e', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1 },
      { id: 'iso-27001', label: 'ISO 27001', sublabel: 'Framework', type: 'compliance', baseX: 450, baseY: -40, baseZ: 50, speed: 0.0012, color: '#fbbf24', bgColor: '#2a220e', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1 },
      { id: 'pdf-report', label: 'Audit-Ready Report', sublabel: 'PDF Export', type: 'report', baseX: 550, baseY: 150, baseZ: 200, speed: 0.001, color: '#ec4899', bgColor: '#2a1222', x: 0, y: 0, z: 0, screenX: 0, screenY: 0, scale: 1, alpha: 1 },
    ]

    const particles: Particle[] = []
    // Generate particles flowing from left -> center -> right
    // Left to center
    for (let i = 0; i < 5; i++) {
      particles.push({ sourceIndex: i, targetIndex: -1, progress: Math.random(), speed: 0.003 + Math.random() * 0.003, type: 'network', color: nodes[i].color })
      particles.push({ sourceIndex: i, targetIndex: -1, progress: Math.random(), speed: 0.003 + Math.random() * 0.003, type: 'analysis', color: '#60a5fa' })
    }
    // Center to right
    for (let i = 7; i <= 10; i++) {
      particles.push({ sourceIndex: -1, targetIndex: i, progress: Math.random(), speed: 0.003 + Math.random() * 0.003, type: 'compliant', color: nodes[i].color })
    }

    const render = () => {
      const container = containerRef.current
      if (!container || !canvas) return
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const centerX = width / 2
      const centerY = height / 2

      // Solid background
      ctx.fillStyle = '#03060a'
      ctx.fillRect(0, 0, width, height)

      // Smooth mouse parallax easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04

      const tiltX = (mouseRef.current.y / height - 0.5) * 0.3 + 0.2 // Pitch
      const tiltY = (mouseRef.current.x / width - 0.5) * 0.4 // Yaw

      if (!prefersReducedMotion) {
        time += 0.008
      }

      const fov = Math.max(600, width * 0.6)
      const cameraZ = 800

      // Core position is offset slightly to the right to accommodate text on the left
      // But we dynamically adjust based on screen width. On mobile, center it.
      const isMobile = width < 768
      const coreBaseX = isMobile ? 0 : width * 0.15 
      const coreScreenX = centerX + coreBaseX
      const coreScreenY = centerY

      // 1. Grid Background (Floor)
      ctx.save()
      ctx.strokeStyle = '#1e293b40'
      ctx.lineWidth = 1
      for (let i = -800; i <= 800; i += 100) {
        // Z lines
        const lineNodes = [
          { x: i, y: 300, z: -800 },
          { x: i, y: 300, z: 800 }
        ]
        ctx.beginPath()
        lineNodes.forEach((p, idx) => {
          const rx1 = p.x * Math.cos(tiltY) + p.z * Math.sin(tiltY)
          const rz1 = -p.x * Math.sin(tiltY) + p.z * Math.cos(tiltY)
          const ry1 = p.y * Math.cos(tiltX) - rz1 * Math.sin(tiltX)
          const rz2 = p.y * Math.sin(tiltX) + rz1 * Math.cos(tiltX)
          const scale = fov / (cameraZ + rz2)
          const sx = centerX + coreBaseX + rx1 * scale
          const sy = centerY + ry1 * scale
          if (idx === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        })
        ctx.stroke()
        
        // X lines
        const lineNodesX = [
          { x: -800, y: 300, z: i },
          { x: 800, y: 300, z: i }
        ]
        ctx.beginPath()
        lineNodesX.forEach((p, idx) => {
          const rx1 = p.x * Math.cos(tiltY) + p.z * Math.sin(tiltY)
          const rz1 = -p.x * Math.sin(tiltY) + p.z * Math.cos(tiltY)
          const ry1 = p.y * Math.cos(tiltX) - rz1 * Math.sin(tiltX)
          const rz2 = p.y * Math.sin(tiltX) + rz1 * Math.cos(tiltX)
          const scale = fov / (cameraZ + rz2)
          const sx = centerX + coreBaseX + rx1 * scale
          const sy = centerY + ry1 * scale
          if (idx === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        })
        ctx.stroke()
      }
      ctx.restore()

      // 2. Project 3D Nodes
      nodes.forEach((node) => {
        // Floating motion
        const floatY = prefersReducedMotion ? 0 : Math.sin(time * 2 + node.baseX) * 20
        const floatX = prefersReducedMotion ? 0 : Math.cos(time * 1.5 + node.baseZ) * 15
        
        const rawX = node.baseX + floatX
        const rawY = node.baseY + floatY
        const rawZ = node.baseZ
        
        // Apply rotation/tilt around the core
        const rx1 = rawX * Math.cos(tiltY) + rawZ * Math.sin(tiltY)
        const rz1 = -rawX * Math.sin(tiltY) + rawZ * Math.cos(tiltY)
        const ry1 = rawY * Math.cos(tiltX) - rz1 * Math.sin(tiltX)
        const rz2 = rawY * Math.sin(tiltX) + rz1 * Math.cos(tiltX)

        const scale = fov / (cameraZ + rz2)
        node.x = rx1
        node.y = ry1
        node.z = rz2
        
        // On mobile, scale everything down proportionally to screen width
        const globalScale = isMobile ? (width / 600) : 1
        // Compress X spread on mobile
        const xSpread = isMobile ? rx1 * 0.6 : rx1
        node.screenX = coreScreenX + xSpread * scale * globalScale
        node.screenY = coreScreenY + ry1 * scale * globalScale
        node.scale = Math.max(0.3, Math.min(2, scale * globalScale))
        
        let targetAlpha = Math.max(0.1, Math.min(1, (rz2 + 600) / 1000))
        if (isMobile && !['cisco-core', 'fortinet-edge', 'paloalto-vpn', 'cis-benchmark', 'nist-800'].includes(node.id)) {
          targetAlpha = 0
        }
        node.alpha = targetAlpha
      })

      const sortedNodes = [...nodes].sort((a, b) => b.z - a.z)
      const centerScale = (fov / cameraZ) * (isMobile ? (width / 900) : 1)

      // 3. Draw connection lines to central core
      nodes.forEach((node) => {
        if (node.alpha <= 0) return
        ctx.save()
        const lineAlpha = (node.alpha * 0.3).toFixed(2)
        ctx.strokeStyle = `${node.color}${Math.round(parseFloat(lineAlpha) * 255).toString(16).padStart(2, '0')}`
        ctx.lineWidth = Math.max(1, 1.5 * node.scale)

        const midX = (coreScreenX + node.screenX) / 2
        const midY = (coreScreenY + node.screenY) / 2 - 40 * node.scale

        ctx.beginPath()
        ctx.moveTo(coreScreenX, coreScreenY)
        ctx.quadraticCurveTo(midX, midY, node.screenX, node.screenY)
        ctx.stroke()
        ctx.restore()
      })

      // 4. Draw Particles
      particles.forEach((packet) => {
        let sourceX, sourceY, sourceScale, targetX, targetY

        if (packet.sourceIndex === -1) {
          sourceX = coreScreenX
          sourceY = coreScreenY
          sourceScale = centerScale
        } else {
          const n = nodes[packet.sourceIndex]
          if (n.alpha <= 0) return
          sourceX = n.screenX
          sourceY = n.screenY
          sourceScale = n.scale
        }

        if (packet.targetIndex === -1) {
          targetX = coreScreenX
          targetY = coreScreenY
        } else {
          const n = nodes[packet.targetIndex]
          if (n.alpha <= 0) return
          targetX = n.screenX
          targetY = n.screenY
        }

        if (!prefersReducedMotion) {
          packet.progress += packet.speed
          if (packet.progress > 1) packet.progress = 0
        }

        const t = packet.progress
        const midX = (targetX + sourceX) / 2
        const midY = (targetY + sourceY) / 2 - 40 * sourceScale

        const px = (1 - t) * (1 - t) * sourceX + 2 * (1 - t) * t * midX + t * t * targetX
        const py = (1 - t) * (1 - t) * sourceY + 2 * (1 - t) * t * midY + t * t * targetY

        ctx.save()
        ctx.fillStyle = packet.color
        ctx.shadowColor = packet.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(px, py, 2.5 * Math.max(0.5, sourceScale), 0, Math.PI * 2)
        ctx.fill()
        
        // Trail
        ctx.shadowBlur = 0
        ctx.globalAlpha = 0.5
        const t2 = Math.max(0, t - 0.05)
        const px2 = (1 - t2) * (1 - t2) * sourceX + 2 * (1 - t2) * t2 * midX + t2 * t2 * targetX
        const py2 = (1 - t2) * (1 - t2) * sourceY + 2 * (1 - t2) * t2 * midY + t2 * t2 * targetY
        ctx.strokeStyle = packet.color
        ctx.lineWidth = 2 * Math.max(0.5, sourceScale)
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px2, py2)
        ctx.stroke()
        
        ctx.restore()
      })

      // 5. Draw 3D Network Nodes
      sortedNodes.forEach((node) => {
        if (node.alpha <= 0) return
        
        ctx.save()
        ctx.translate(node.screenX, node.screenY)
        ctx.globalAlpha = node.alpha

        // Hexagon or circle based on type
        ctx.fillStyle = node.bgColor
        ctx.strokeStyle = node.color
        ctx.lineWidth = 1.5

        if (node.type === 'compliance' || node.type === 'report') {
          // Draw rect
          ctx.beginPath()
          ctx.rect(-16 * node.scale, -12 * node.scale, 32 * node.scale, 24 * node.scale)
          ctx.fill()
          ctx.stroke()
        } else {
          // Draw circle
          ctx.beginPath()
          ctx.arc(0, 0, 14 * node.scale, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          
          // Inner dot
          ctx.fillStyle = node.color
          ctx.beginPath()
          ctx.arc(0, 0, 4 * node.scale, 0, Math.PI * 2)
          ctx.fill()
        }

        // Status indicator
        if (node.status === 'alert') {
          ctx.fillStyle = '#ef4444' // red
          ctx.shadowColor = '#ef4444'
          ctx.shadowBlur = Math.sin(time * 10) * 10 + 10
          ctx.beginPath()
          ctx.arc(10 * node.scale, -10 * node.scale, 4 * node.scale, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        } else if (node.status === 'remediated') {
          ctx.fillStyle = '#10b981' // green
          ctx.beginPath()
          ctx.arc(10 * node.scale, -10 * node.scale, 4 * node.scale, 0, Math.PI * 2)
          ctx.fill()
        }

        // Floating config snippets
        if (node.status === 'alert' && !prefersReducedMotion) {
          ctx.font = `600 ${8 * node.scale}px "JetBrains Mono", monospace`
          ctx.fillStyle = '#ef4444'
          ctx.fillText("! TELNET PERMITTED", 16 * node.scale, -20 * node.scale)
        } else if (node.status === 'remediated' && !prefersReducedMotion) {
          ctx.font = `600 ${8 * node.scale}px "JetBrains Mono", monospace`
          ctx.fillStyle = '#10b981'
          ctx.fillText("✓ SSH v2 ENFORCED", 16 * node.scale, -20 * node.scale)
        }

        // Labels
        ctx.font = `600 ${Math.max(10, 11 * node.scale)}px "Inter", sans-serif`
        ctx.fillStyle = '#f8fafc'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(node.label, 0, 18 * node.scale)

        ctx.font = `500 ${Math.max(8, 9 * node.scale)}px "JetBrains Mono", monospace`
        ctx.fillStyle = node.color
        ctx.fillText(node.sublabel, 0, 32 * node.scale)

        ctx.restore()
      })

      // 6. Central NetSecure AI Security Engine (The Core)
      ctx.save()
      ctx.translate(coreScreenX, coreScreenY)

      const coreRot = prefersReducedMotion ? 0 : time * 0.4
      const coreRadius = 45 * centerScale

      // Glowing aura
      const auraPulse = prefersReducedMotion ? 1 : (Math.sin(time * 3) + 1) / 2
      ctx.fillStyle = `rgba(2, 132, 199, ${0.05 + auraPulse * 0.05})`
      ctx.beginPath()
      ctx.arc(0, 0, coreRadius * 2.5, 0, Math.PI * 2)
      ctx.fill()

      // Outer rotating geometric frame (ring 1)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const ang = coreRot + (i * Math.PI) / 3
        const px = Math.cos(ang) * (coreRadius * 1.6)
        const py = Math.sin(ang) * (coreRadius * 1.6)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()

      // Rotating inner ring (opposite direction)
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const ang = -coreRot * 1.5 + (i * Math.PI) / 4
        const px = Math.cos(ang) * (coreRadius * 1.3)
        const py = Math.sin(ang) * (coreRadius * 1.3)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()

      // Core Shield Base
      ctx.fillStyle = '#0a1628'
      ctx.strokeStyle = '#0ea5e9'
      ctx.lineWidth = 2.5
      ctx.shadowColor = '#0284c7'
      ctx.shadowBlur = 15

      ctx.beginPath()
      ctx.moveTo(0, -coreRadius)
      ctx.lineTo(coreRadius * 0.85, -coreRadius * 0.4)
      ctx.lineTo(coreRadius * 0.7, coreRadius * 0.5)
      ctx.lineTo(0, coreRadius * 1.1)
      ctx.lineTo(-coreRadius * 0.7, coreRadius * 0.5)
      ctx.lineTo(-coreRadius * 0.85, -coreRadius * 0.4)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0 // reset

      // Faceted metallic shine lines
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, -coreRadius)
      ctx.lineTo(0, coreRadius * 1.1)
      ctx.moveTo(-coreRadius * 0.85, -coreRadius * 0.4)
      ctx.lineTo(coreRadius * 0.85, -coreRadius * 0.4)
      ctx.moveTo(-coreRadius * 0.7, coreRadius * 0.5)
      ctx.lineTo(coreRadius * 0.7, coreRadius * 0.5)
      ctx.stroke()

      // Text inside core
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${10 * centerScale}px "Inter", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('NETSECURE', 0, -4 * centerScale)

      ctx.font = `bold ${8 * centerScale}px "JetBrains Mono", monospace`
      ctx.fillStyle = '#38bdf8'
      ctx.fillText('ENGINE', 0, 10 * centerScale)

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
      className="absolute inset-0 bg-[#03060a] overflow-hidden select-none"
    >
      {/* Background Vignette & Grid Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/10 via-[#03060a]/80 to-[#03060a] z-0 pointer-events-none" />

      {/* 3D Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="relative z-0 w-full h-full block"
        style={{ touchAction: 'none' }}
      />

      {/* FLOATING UI PANELS - Hidden on small screens to reduce clutter, visible on lg+ */}
      {/* Top Right: Compliance Stream */}
      <div className="hidden lg:block absolute top-8 right-8 z-10 w-64 p-4 rounded-lg bg-[#070e1a]/80 border border-slate-800/80 shadow-2xl backdrop-blur-md pointer-events-none">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 font-mono flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Compliance
          </span>
          <span className="text-[10px] font-mono text-emerald-400">100%</span>
        </div>
        <div className="mt-3 space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>CIS Benchmark</span>
            <span className="text-emerald-400">PASSED</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>NIST 800-53</span>
            <span className="text-emerald-400">PASSED</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>ISO 27001</span>
            <span className="text-emerald-400">PASSED</span>
          </div>
        </div>
      </div>

      {/* Bottom Right: Deterministic Remediation Tracker */}
      <div className="hidden lg:block absolute bottom-8 right-8 z-10 w-72 p-4 rounded-lg bg-[#070e1a]/80 border border-slate-800/80 shadow-2xl backdrop-blur-md pointer-events-none">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
          <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400 font-mono">
            Remediation Stream
          </span>
          <span className="text-[10px] font-mono text-sky-400">ACTIVE</span>
        </div>
        <div className="mt-3 space-y-2 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-sky-400">→</span>
            <span>Parsing FortiOS v7.2 ruleset...</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sky-400">→</span>
            <span>Identifying policy overlap [ID: #4921]</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span>✓</span>
            <span>Generated deterministic fix for Router-A</span>
          </div>
        </div>
      </div>

      {/* Bottom Center: System Status */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center gap-6 px-4 py-2 rounded-full bg-[#070e1a]/80 border border-slate-800/80 backdrop-blur-md font-mono text-[10px] text-slate-400 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Core Engine: Online</span>
        </div>
        <div className="w-px h-3 bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-sky-400">Nodes: 1,492</span>
        </div>
        <div className="w-px h-3 bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-amber-400">Analysis: Active</span>
        </div>
      </div>
    </div>
  )
}
