import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Shield, CheckCircle2, AlertTriangle, ArrowRight, Activity, Terminal, Lock } from 'lucide-react'

interface VendorNodeData {
  id: string
  name: string
  vendor: string
  os: string
  role: string
  status: 'compliant' | 'warning' | 'critical'
  score: number
  rulesPassed: number
  rulesTotal: number
  color: number
  hexColor: string
  pos: [number, number, number]
}

const VENDOR_NODES: VendorNodeData[] = [
  {
    id: 'cisco-core',
    name: 'Core-RTR-01',
    vendor: 'Cisco',
    os: 'IOS-XE 17.9',
    role: 'BGP/OSPF Spine',
    status: 'compliant',
    score: 96,
    rulesPassed: 27,
    rulesTotal: 28,
    color: 0x0284c7, // cyan-blue
    hexColor: '#0284C7',
    pos: [-4.2, 1.8, 1.2],
  },
  {
    id: 'fortinet-edge',
    name: 'Edge-NGFW-01',
    vendor: 'Fortinet',
    os: 'FortiOS 7.4',
    role: 'Perimeter Inspection',
    status: 'warning',
    score: 84,
    rulesPassed: 24,
    rulesTotal: 28,
    color: 0xe11d48, // crimson
    hexColor: '#E11D48',
    pos: [-3.4, -2.2, 2.0],
  },
  {
    id: 'paloalto-vpn',
    name: 'Gateway-PAN-01',
    vendor: 'Palo Alto',
    os: 'PAN-OS 11.1',
    role: 'Zero-Trust Gateway',
    status: 'compliant',
    score: 92,
    rulesPassed: 26,
    rulesTotal: 28,
    color: 0xf97316, // orange
    hexColor: '#F97316',
    pos: [3.8, 2.0, 1.5],
  },
  {
    id: 'juniper-core',
    name: 'Spine-JUNOS-01',
    vendor: 'Juniper',
    os: 'Junos OS 23.2',
    role: 'EVPN-VXLAN Fabric',
    status: 'compliant',
    score: 98,
    rulesPassed: 28,
    rulesTotal: 28,
    color: 0x3db663, // potadot green
    hexColor: '#3DB663',
    pos: [4.4, -1.6, 0.8],
  },
  {
    id: 'aruba-access',
    name: 'Access-CX-01',
    vendor: 'Aruba',
    os: 'AOS-CX 10.12',
    role: '802.1X Edge Port',
    status: 'compliant',
    score: 90,
    rulesPassed: 25,
    rulesTotal: 28,
    color: 0xd97706, // amber
    hexColor: '#D97706',
    pos: [-1.4, -3.2, -1.8],
  },
  {
    id: 'checkpoint-dc',
    name: 'DC-FW-01',
    vendor: 'Check Point',
    os: 'Gaia R81.20',
    role: 'Data Center Segmentation',
    status: 'compliant',
    score: 94,
    rulesPassed: 26,
    rulesTotal: 28,
    color: 0x8b5cf6, // purple
    hexColor: '#8B5CF6',
    pos: [1.6, 3.4, -1.5],
  },
]

export function Hero3DVisual() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const dotsCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hoveredNode, setHoveredNode] = useState<VendorNodeData | null>(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [webglSupported, setWebglSupported] = useState(true)

  const stages = [
    { label: 'Multi-Vendor Ingestion', status: 'Online · 6 Parsers Active' },
    { label: 'Deterministic CIS Evaluation', status: 'Level 1 & Level 2 Benchmarks' },
    { label: 'NIST SP 800-53 Mapping', status: 'Access Control & System Integrity' },
    { label: 'AI Root-Cause Explanation', status: 'Gemini Technical Synthesizer' },
    { label: 'Verified Remediation Staging', status: 'Closed-Loop CLI Dry Run' },
  ]

  // Cycle telemetry stages periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % stages.length)
    }, 3800)
    return () => clearInterval(timer)
  }, [stages.length])

  // Reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])

  // Dot Canvas background (inspired by Potadot #heroDots)
  useEffect(() => {
    const canvas = dotsCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600)

    const handleResize = () => {
      if (!canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }
    window.addEventListener('resize', handleResize)

    const mouse = { x: -1000, y: -1000, active: false }
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.active = true
    }
    const onMouseLeave = () => {
      mouse.active = false
    }

    canvas.parentElement?.addEventListener('mousemove', onMouseMove)
    canvas.parentElement?.addEventListener('mouseleave', onMouseLeave)

    const spacing = 36
    const dots: { x: number; y: number; ox: number; oy: number; vx: number; vy: number }[] = []

    for (let x = spacing / 2; x < width; x += spacing) {
      for (let y = spacing / 2; y < height; y += spacing) {
        dots.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 })
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]

        if (mouse.active) {
          const dx = mouse.x - d.x
          const dy = mouse.y - d.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 90
          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 12
            d.vx -= (dx / dist) * force * 0.1
            d.vy -= (dy / dist) * force * 0.1
          }
        }

        // Spring back to origin
        d.vx += (d.ox - d.x) * 0.08
        d.vy += (d.oy - d.y) * 0.08
        d.vx *= 0.85
        d.vy *= 0.85
        d.x += d.vx
        d.y += d.vy

        // Draw dot
        const distFromOrig = Math.sqrt((d.x - d.ox) ** 2 + (d.y - d.oy) ** 2)
        const alpha = Math.min(0.28 + distFromOrig * 0.08, 0.75)
        ctx.fillStyle = distFromOrig > 1.5 ? 'rgba(61, 182, 99, ' + alpha + ')' : 'rgba(10, 40, 45, 0.12)'
        ctx.beginPath()
        ctx.arc(d.x, d.y, distFromOrig > 1.5 ? 2.2 : 1.4, 0, Math.PI * 2)
        ctx.fill()
      }

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.parentElement?.removeEventListener('mousemove', onMouseMove)
      canvas.parentElement?.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(animId)
    }
  }, [])

  // Three.js 3D Interactive Topology
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 14)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.1
      container.appendChild(renderer.domElement)
    } catch {
      setWebglSupported(false)
      return
    }

    // Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0x3db663, 2.4)
    dirLight1.position.set(5, 8, 5)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0x0284c7, 1.8)
    dirLight2.position.set(-6, -4, 4)
    scene.add(dirLight2)

    // CENTRAL SECURITY INTELLIGENCE ELEMENT
    const coreGroup = new THREE.Group()
    scene.add(coreGroup)

    // Inner glowing faceted nucleus
    const coreIcosaGeo = new THREE.IcosahedronGeometry(1.25, 1)
    const coreIcosaMat = new THREE.MeshStandardMaterial({
      color: 0x0a282d,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: false,
    })
    const coreMesh = new THREE.Mesh(coreIcosaGeo, coreIcosaMat)
    coreGroup.add(coreMesh)

    // Outer crystalline wireframe shield
    const wireGeo = new THREE.IcosahedronGeometry(1.48, 1)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x3db663,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    })
    const wireMesh = new THREE.Mesh(wireGeo, wireMat)
    coreGroup.add(wireMesh)

    // Orbital Scan Rings (Representing CIS, NIST & Rule Boundaries)
    const createRing = (radius: number, tube: number, color: number, rx: number, ry: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 80)
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.9,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = rx
      ring.rotation.y = ry
      return ring
    }

    const ring1 = createRing(2.1, 0.022, 0x3db663, Math.PI / 3, Math.PI / 6)
    const ring2 = createRing(2.5, 0.018, 0x0284c7, -Math.PI / 4, Math.PI / 4)
    const ring3 = createRing(2.9, 0.014, 0xf97316, Math.PI / 2.2, 0)
    coreGroup.add(ring1)
    coreGroup.add(ring2)
    coreGroup.add(ring3)

    // Radar Scanning Wave (Expanding disc/ring)
    const radarGeo = new THREE.RingGeometry(0.2, 0.28, 64)
    const radarMat = new THREE.MeshBasicMaterial({
      color: 0x3db663,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    })
    const radarWave = new THREE.Mesh(radarGeo, radarMat)
    radarWave.rotation.x = Math.PI / 2
    scene.add(radarWave)

    // VENDOR SATELLITE NODES & CONNECTIONS
    const nodeMeshes: { mesh: THREE.Mesh; data: VendorNodeData; glow: THREE.Mesh }[] = []
    const connectionLines: { line: THREE.Line; curve: THREE.QuadraticBezierCurve3 }[] = []
    const nodeRaycastObjects: THREE.Object3D[] = []

    VENDOR_NODES.forEach((n) => {
      const nodeGroup = new THREE.Group()
      nodeGroup.position.set(...n.pos)

      // Solid sphere
      const sphereGeo = new THREE.SphereGeometry(0.38, 32, 32)
      const sphereMat = new THREE.MeshStandardMaterial({
        color: n.color,
        roughness: 0.25,
        metalness: 0.8,
        emissive: n.color,
        emissiveIntensity: 0.35,
      })
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
      sphereMesh.userData = { nodeData: n }
      nodeGroup.add(sphereMesh)

      // Outer glow shell
      const glowGeo = new THREE.SphereGeometry(0.52, 24, 24)
      const glowMat = new THREE.MeshBasicMaterial({
        color: n.color,
        transparent: true,
        opacity: 0.25,
        wireframe: true,
      })
      const glowMesh = new THREE.Mesh(glowGeo, glowMat)
      nodeGroup.add(glowMesh)

      scene.add(nodeGroup)
      nodeMeshes.push({ mesh: sphereMesh, data: n, glow: glowMesh })
      nodeRaycastObjects.push(sphereMesh)

      // Connection Curve to Core
      const start = new THREE.Vector3(...n.pos)
      const mid = new THREE.Vector3(n.pos[0] * 0.45, n.pos[1] * 0.45 + (n.pos[2] > 0 ? 0.6 : -0.6), n.pos[2] * 0.45)
      const end = new THREE.Vector3(0, 0, 0)
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)

      const points = curve.getPoints(40)
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
      const lineMat = new THREE.LineBasicMaterial({
        color: n.color,
        transparent: true,
        opacity: 0.35,
      })
      const line = new THREE.Line(lineGeo, lineMat)
      scene.add(line)
      connectionLines.push({ line, curve })
    })

    // PACKET PARTICLES FLOWING ALONG CURVES
    const packetCount = 28
    const packetGeo = new THREE.SphereGeometry(0.065, 12, 12)
    const packets: { mesh: THREE.Mesh; curveIndex: number; progress: number; speed: number }[] = []

    for (let i = 0; i < packetCount; i++) {
      const curveIndex = i % connectionLines.length
      const vendorColor = VENDOR_NODES[curveIndex].color
      const pMat = new THREE.MeshBasicMaterial({
        color: vendorColor,
        transparent: true,
        opacity: 0.9,
      })
      const pMesh = new THREE.Mesh(packetGeo, pMat)
      scene.add(pMesh)
      packets.push({
        mesh: pMesh,
        curveIndex,
        progress: (i / packetCount) * 1.0,
        speed: 0.003 + Math.random() * 0.004,
      })
    }

    // RAYCASTING & MOUSE INTERACTION
    const raycaster = new THREE.Raycaster()
    const mouseNorm = new THREE.Vector2(-999, -999)
    const mousePos = { x: 0, y: 0, targetX: 0, targetY: 0 }

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseNorm.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      mousePos.targetX = (e.clientX - rect.left - rect.width / 2) * 0.0018
      mousePos.targetY = (e.clientY - rect.top - rect.height / 2) * 0.0018
    }

    const onPointerLeave = () => {
      mouseNorm.x = -999
      mouseNorm.y = -999
      mousePos.targetX = 0
      mousePos.targetY = 0
      setHoveredNode(null)
    }

    container.addEventListener('mousemove', onPointerMove)
    container.addEventListener('mouseleave', onPointerLeave)

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // ANIMATION LOOP
    let animFrame: number
    let radarScale = 0.5
    let time = 0

    const animate = () => {
      time += 0.015

      // Smooth camera parallax
      mousePos.x += (mousePos.targetX - mousePos.x) * 0.05
      mousePos.y += (mousePos.targetY - mousePos.y) * 0.05
      camera.position.x = mousePos.x * 2.8
      camera.position.y = -mousePos.y * 2.8
      camera.lookAt(0, 0, 0)

      if (!prefersReducedMotion) {
        // Rotate Central Core
        coreGroup.rotation.y = time * 0.35
        coreGroup.rotation.x = Math.sin(time * 0.25) * 0.15

        ring1.rotation.z = time * 0.6
        ring2.rotation.z = -time * 0.5
        ring3.rotation.z = time * 0.4

        // Expand Radar Pulse
        radarScale += 0.035
        if (radarScale > 6.2) radarScale = 0.5
        radarWave.scale.set(radarScale, radarScale, radarScale)
        ;(radarWave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - radarScale / 7)

        // Float Vendor Satellite Nodes
        nodeMeshes.forEach((n, idx) => {
          const hoverOffset = Math.sin(time * 1.5 + idx) * 0.12
          n.mesh.parent!.position.y = n.data.pos[1] + hoverOffset
          n.glow.rotation.y = time * 0.8
        })

        // Flow packets
        packets.forEach((p) => {
          p.progress += p.speed
          if (p.progress > 1) p.progress = 0

          const conn = connectionLines[p.curveIndex]
          if (conn) {
            const point = conn.curve.getPoint(p.progress)
            p.mesh.position.copy(point)
            const scale = 0.7 + Math.sin(p.progress * Math.PI) * 0.5
            p.mesh.scale.set(scale, scale, scale)
          }
        })
      }

      // Raycast test
      raycaster.setFromCamera(mouseNorm, camera)
      const intersects = raycaster.intersectObjects(nodeRaycastObjects)

      if (intersects.length > 0) {
        const hit = intersects[0].object
        const data = hit.userData?.nodeData as VendorNodeData
        if (data && hoveredNode?.id !== data.id) {
          setHoveredNode(data)
          document.body.style.cursor = 'pointer'
        }
      } else if (hoveredNode !== null) {
        setHoveredNode(null)
        document.body.style.cursor = 'default'
      }

      renderer.render(scene, camera)
      animFrame = requestAnimationFrame(animate)
    }

    animate()

    // CLEANUP
    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousemove', onPointerMove)
      container.removeEventListener('mouseleave', onPointerLeave)
      document.body.style.cursor = 'default'

      // Dispose Three.js objects
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      renderer.dispose()
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [prefersReducedMotion])

  return (
    <div className="relative w-full h-[460px] md:h-[520px] lg:h-[560px] select-none overflow-hidden rounded-3xl bg-gradient-to-b from-[#F2F3F7]/50 via-[#E8EAF0]/40 to-[#F2F3F7]/80 border border-[#D7DCE5]/80 shadow-[0_20px_50px_rgba(10,40,45,0.06)]">
      {/* 1. INTERACTIVE DOT-FIELD CANVAS (POTADOT SIGNATURE) */}
      <canvas
        ref={dotsCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-auto"
        aria-hidden="true"
      />

      {/* 2. THREE.JS 3D WEBGL CONTAINER */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing"
      />

      {/* 3. FLOATING STATUS BADGES & TELEMETRY OVERLAYS */}
      {/* Top Left: Live Security Engine State */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#D7DCE5] shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DB663] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3DB663]" />
          </span>
          <span className="text-xs font-mono font-semibold text-[#0A282D]">
            Multi-Vendor Topology Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EDF8F1] text-[#1E6E37] font-bold border border-[#BFE7CB]">
            6/6 Synchronized
          </span>
        </div>
      </div>

      {/* Top Right: Real-Time Cycle Indicator */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 pointer-events-none hidden sm:block">
        <div className="px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-[#D7DCE5] shadow-xs text-right">
          <div className="text-[10px] uppercase font-mono font-bold text-[#7E8F95] tracking-wider">
            Deterministic Pipeline
          </div>
          <div className="text-xs font-sans font-bold text-[#0A282D] flex items-center gap-1.5 justify-end">
            <span className="text-[#3DB663]">●</span>
            {stages[activeStageIndex].label}
          </div>
          <div className="text-[10px] text-[#4A5B60] font-mono mt-0.5">
            {stages[activeStageIndex].status}
          </div>
        </div>
      </div>

      {/* Dynamic Hover Tooltip for 3D Node */}
      {hoveredNode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-fadeIn transition-all">
          <div className="px-4 py-3 rounded-2xl bg-[#0A282D]/95 text-white backdrop-blur-md border border-[#3DB663]/40 shadow-xl flex items-center gap-4">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: hoveredNode.hexColor, boxShadow: `0 0 10px ${hoveredNode.hexColor}` }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-sans font-bold tracking-tight text-white">
                  {hoveredNode.name}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-[#3DB663] font-bold">
                  {hoveredNode.vendor}
                </span>
              </div>
              <div className="text-[11px] font-mono text-[#A3B8BC] mt-0.5">
                {hoveredNode.os} · {hoveredNode.role}
              </div>
            </div>
            <div className="pl-3 border-l border-white/15 text-right font-mono">
              <div className="text-base font-bold text-[#3DB663]">
                {hoveredNode.score}%
              </div>
              <div className="text-[9px] uppercase tracking-wider text-[#A3B8BC]">
                {hoveredNode.rulesPassed}/{hoveredNode.rulesTotal} Rules
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar: Interactive Quick Telemetry Bar */}
      <div className="absolute bottom-4 inset-x-4 md:bottom-6 md:inset-x-6 z-10 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D7DCE5] shadow-xs pointer-events-auto">
        <div className="flex items-center gap-4 text-xs font-mono text-[#4A5B60]">
          <span className="flex items-center gap-1.5 font-semibold text-[#0A282D]">
            <Shield size={14} className="text-[#3DB663]" />
            CIS & NIST SP 800-53
          </span>
          <span className="hidden md:inline text-[#D7DCE5]">|</span>
          <span className="hidden md:flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-[#3DB663]" />
            Zero Physical Device Modification
          </span>
          <span className="hidden lg:inline text-[#D7DCE5]">|</span>
          <span className="hidden lg:flex items-center gap-1.5">
            <Activity size={13} className="text-[#0284C7]" />
            Deterministic Python Regex Core
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#7E8F95] hidden sm:inline">
            Interactive 3D: Drag to tilt, hover nodes
          </span>
        </div>
      </div>
    </div>
  )
}
