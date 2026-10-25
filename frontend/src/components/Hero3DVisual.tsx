import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Shield, CheckCircle2, Activity, RefreshCw, Cpu, Layers } from 'lucide-react'

export interface VendorNodeData {
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

export const VENDOR_NODES: VendorNodeData[] = [
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
    pos: [-3.0, 1.3, 0.9],
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
    pos: [-2.5, -1.7, 1.3],
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
    pos: [2.9, 1.5, 1.1],
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
    color: 0x3db663, // emerald green
    hexColor: '#3DB663',
    pos: [3.0, -1.3, 0.6],
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
    pos: [-1.1, -2.2, -1.1],
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
    pos: [1.1, 2.3, -0.9],
  },
]

export function Hero3DVisual() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [hoveredNode, setHoveredNode] = useState<VendorNodeData | null>(null)
  const hoveredNodeRef = useRef<VendorNodeData | null>(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [webGlSupported, setWebGlSupported] = useState(true)
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)

  const stages = [
    { label: 'Multi-Vendor Ingestion', status: 'Online · 6 Parsers Active' },
    { label: 'Deterministic CIS Evaluation', status: 'Level 1 & Level 2 Benchmarks' },
    { label: 'NIST SP 800-53 Mapping', status: 'Access Control & System Integrity' },
    { label: 'AI Root-Cause Explanation', status: 'Gemini Technical Synthesizer' },
    { label: 'Verified Remediation Staging', status: 'Closed-Loop CLI Dry Run' },
  ]

  // Telemetry stages cycler
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % stages.length)
    }, 3800)
    return () => clearInterval(timer)
  }, [stages.length])

  // Three.js 3D WebGL Network Security Topology
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Verify WebGL availability
    const testCanvas = document.createElement('canvas')
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')
    if (!gl) {
      setWebGlSupported(false)
      return
    }

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const initialW = container.clientWidth || 700
    const initialH = container.clientHeight || 520

    const camera = new THREE.PerspectiveCamera(45, initialW / initialH, 0.1, 100)
    camera.position.set(0, 0, 12.5)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
      renderer.setSize(initialW, initialH)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.25
      renderer.domElement.style.display = 'block'
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      container.appendChild(renderer.domElement)
    } catch (e) {
      console.warn('WebGL initialization failed, falling back', e)
      setWebGlSupported(false)
      return
    }

    // High-visibility lighting system
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.9)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0x3db663, 3.4)
    dirLight1.position.set(6, 8, 7)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0x0284c7, 2.8)
    dirLight2.position.set(-7, -5, 6)
    scene.add(dirLight2)

    const pointLight = new THREE.PointLight(0x3db663, 2.0, 10)
    pointLight.position.set(0, 0, 0)
    scene.add(pointLight)

    // Master Scene Topology Pivot (Rotatable by user drag or touch)
    const masterPivot = new THREE.Group()
    scene.add(masterPivot)

    // A. CENTRAL COMPLIANCE NUCLEUS
    const coreGroup = new THREE.Group()
    masterPivot.add(coreGroup)

    // 1. Inner faceted compliance core (Icosahedron)
    const coreIcosaGeo = new THREE.IcosahedronGeometry(1.2, 1)
    const coreIcosaMat = new THREE.MeshStandardMaterial({
      color: 0x0a282d,
      emissive: 0x124047,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.7,
    })
    const coreMesh = new THREE.Mesh(coreIcosaGeo, coreIcosaMat)
    coreGroup.add(coreMesh)

    // 2. Outer crystalline diamond wireframe shield (Emerald)
    const wireGeo = new THREE.IcosahedronGeometry(1.48, 1)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x3db663,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    })
    const wireMesh = new THREE.Mesh(wireGeo, wireMat)
    coreGroup.add(wireMesh)

    // 3. Pulsing inner heartbeat nucleus (Glowing Emerald Sphere)
    const heartGeo = new THREE.SphereGeometry(0.52, 24, 24)
    const heartMat = new THREE.MeshBasicMaterial({
      color: 0x3db663,
      transparent: true,
      opacity: 0.85,
    })
    const heartMesh = new THREE.Mesh(heartGeo, heartMat)
    coreGroup.add(heartMesh)

    // B. ORBITAL SCAN RINGS (CIS, NIST & Perimeter)
    const createRing = (radius: number, tube: number, color: number, rx: number, ry: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 100)
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.85,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = rx
      ring.rotation.y = ry
      return ring
    }

    const ring1 = createRing(2.05, 0.024, 0x3db663, Math.PI / 3, Math.PI / 6) // CIS Emerald
    const ring2 = createRing(2.45, 0.020, 0x0284c7, -Math.PI / 4, Math.PI / 4) // NIST Cyan
    const ring3 = createRing(2.85, 0.018, 0xf59e0b, Math.PI / 2.2, 0) // Perimeter Amber
    coreGroup.add(ring1)
    coreGroup.add(ring2)
    coreGroup.add(ring3)

    // C. DUAL EXPANDING RADAR SWEEP WAVES
    const createRadarWave = (delayOffset: number) => {
      const radarGeo = new THREE.RingGeometry(0.2, 0.36, 64)
      const radarMat = new THREE.MeshBasicMaterial({
        color: 0x3db663,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
      const mesh = new THREE.Mesh(radarGeo, radarMat)
      mesh.rotation.x = Math.PI / 2
      masterPivot.add(mesh)
      return { mesh, progress: delayOffset }
    }

    const radarWave1 = createRadarWave(0.1)
    const radarWave2 = createRadarWave(2.8)

    // Sweeping Radar Beam Line
    const radarBeamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(3.8, 0, 0),
    ])
    const radarBeamMat = new THREE.LineBasicMaterial({
      color: 0x3db663,
      transparent: true,
      opacity: 0.7,
      linewidth: 2,
    })
    const radarBeam = new THREE.Line(radarBeamGeo, radarBeamMat)
    radarBeam.rotation.x = Math.PI / 2
    masterPivot.add(radarBeam)

    // D. MULTI-VENDOR SATELLITE NODES & CONNECTIONS
    const nodeMeshes: { group: THREE.Group; mesh: THREE.Mesh; data: VendorNodeData; glow: THREE.Mesh }[] = []
    const connectionLines: { line: THREE.Line; curve: THREE.QuadraticBezierCurve3 }[] = []
    const nodeRaycastObjects: THREE.Object3D[] = []

    VENDOR_NODES.forEach((n) => {
      const nodeGroup = new THREE.Group()
      nodeGroup.position.set(...n.pos)

      // Solid sphere node with emissive glow
      const sphereGeo = new THREE.SphereGeometry(0.38, 32, 32)
      const sphereMat = new THREE.MeshStandardMaterial({
        color: n.color,
        emissive: n.color,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.6,
      })
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
      sphereMesh.userData = { nodeData: n }
      nodeGroup.add(sphereMesh)

      // Outer wireframe halo ring
      const glowGeo = new THREE.SphereGeometry(0.52, 16, 16)
      const glowMat = new THREE.MeshBasicMaterial({
        color: n.color,
        transparent: true,
        opacity: 0.5,
        wireframe: true,
      })
      const glowMesh = new THREE.Mesh(glowGeo, glowMat)
      nodeGroup.add(glowMesh)

      masterPivot.add(nodeGroup)
      nodeMeshes.push({ group: nodeGroup, mesh: sphereMesh, data: n, glow: glowMesh })
      nodeRaycastObjects.push(sphereMesh)

      // Quadratic Bezier curve to Central Core
      const start = new THREE.Vector3(...n.pos)
      const mid = new THREE.Vector3(
        n.pos[0] * 0.45,
        n.pos[1] * 0.45 + (n.pos[2] > 0 ? 0.6 : -0.6),
        n.pos[2] * 0.45
      )
      const end = new THREE.Vector3(0, 0, 0)
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)

      const points = curve.getPoints(50)
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
      const lineMat = new THREE.LineBasicMaterial({
        color: n.color,
        transparent: true,
        opacity: 0.55,
      })
      const line = new THREE.Line(lineGeo, lineMat)
      masterPivot.add(line)
      connectionLines.push({ line, curve })
    })

    // E. PACKET PARTICLES STREAMING ALONG CURVES (36 PARTICLES)
    const packetCount = 36
    const packetGeo = new THREE.SphereGeometry(0.08, 12, 12)
    const packets: { mesh: THREE.Mesh; curveIndex: number; progress: number; speed: number }[] = []

    for (let i = 0; i < packetCount; i++) {
      const curveIndex = i % connectionLines.length
      const vendorColor = VENDOR_NODES[curveIndex].color
      const pMat = new THREE.MeshBasicMaterial({
        color: vendorColor,
        transparent: true,
        opacity: 0.95,
      })
      const pMesh = new THREE.Mesh(packetGeo, pMat)
      masterPivot.add(pMesh)
      packets.push({
        mesh: pMesh,
        curveIndex,
        progress: (i / packetCount) * 1.0,
        speed: 0.0035 + (i % 4) * 0.0012,
      })
    }

    // F. RESPONSIVE FRAMING (Ensures no clipping on narrow mobile screens)
    const updateResponsiveFraming = (width: number, height: number) => {
      if (width === 0 || height === 0) return
      const aspect = width / height
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)

      if (aspect < 1.0) {
        // Mobile portrait: scale pivot down and move camera back slightly
        // so all 6 nodes (x: ±3.0) stay cleanly in view with margin
        const scaleFactor = Math.min(1.0, Math.max(0.68, aspect * 1.15))
        masterPivot.scale.set(scaleFactor, scaleFactor, scaleFactor)
        camera.position.z = (12.5 / scaleFactor) * 0.92
      } else {
        masterPivot.scale.set(1.0, 1.0, 1.0)
        camera.position.z = 12.5
      }
    }
    updateResponsiveFraming(initialW, initialH)

    // G. RAYCASTING, PARALLAX & TOUCH / MOUSE INTERACTION
    const raycaster = new THREE.Raycaster()
    const mouseNorm = new THREE.Vector2(-999, -999)
    const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 }
    const drag = { isDragging: false, startX: 0, startY: 0, rotX: 0, rotY: 0, targetRotX: 0, targetRotY: 0 }

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      if (drag.isDragging) {
        const deltaX = e.clientX - drag.startX
        const deltaY = e.clientY - drag.startY
        drag.targetRotY += deltaX * 0.008
        drag.targetRotX += deltaY * 0.008
        drag.startX = e.clientX
        drag.startY = e.clientY
      } else {
        mouseNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        mouseNorm.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      }

      parallax.targetX = (e.clientX - rect.left - rect.width / 2) * 0.0018
      parallax.targetY = (e.clientY - rect.top - rect.height / 2) * 0.0018
    }

    const onPointerDown = (e: MouseEvent) => {
      drag.isDragging = true
      drag.startX = e.clientX
      drag.startY = e.clientY
      container.style.cursor = 'grabbing'
    }

    const onPointerUp = () => {
      drag.isDragging = false
      container.style.cursor = 'grab'
    }

    const onPointerLeave = () => {
      drag.isDragging = false
      mouseNorm.x = -999
      mouseNorm.y = -999
      parallax.targetX = 0
      parallax.targetY = 0
      if (hoveredNodeRef.current !== null && !selectedVendorId) {
        hoveredNodeRef.current = null
        setHoveredNode(null)
      }
      container.style.cursor = 'grab'
    }

    // Touch event support for mobile & tablet viewports
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        drag.isDragging = true
        drag.startX = e.touches[0].clientX
        drag.startY = e.touches[0].clientY

        // Touch raycast check to tap a node directly on mobile
        const rect = container.getBoundingClientRect()
        const touchX = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1
        const touchY = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(new THREE.Vector2(touchX, touchY), camera)
        const intersects = raycaster.intersectObjects(nodeRaycastObjects)
        if (intersects.length > 0) {
          const hit = intersects[0].object
          const data = hit.userData?.nodeData as VendorNodeData
          if (data) {
            hoveredNodeRef.current = data
            setHoveredNode(data)
            setSelectedVendorId(data.id)
          }
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (drag.isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - drag.startX
        const deltaY = e.touches[0].clientY - drag.startY
        drag.targetRotY += deltaX * 0.01
        drag.targetRotX += deltaY * 0.01
        drag.startX = e.touches[0].clientX
        drag.startY = e.touches[0].clientY
      }
    }

    const onTouchEnd = () => {
      drag.isDragging = false
    }

    container.addEventListener('mousemove', onPointerMove, { passive: true })
    container.addEventListener('mousedown', onPointerDown)
    window.addEventListener('mouseup', onPointerUp)
    container.addEventListener('mouseleave', onPointerLeave, { passive: true })
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: true })
    container.addEventListener('touchend', onTouchEnd, { passive: true })

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        updateResponsiveFraming(width, height)
      }
    })
    resizeObserver.observe(container)

    // H. CONTINUOUS 60FPS ANIMATION LOOP
    let animFrame: number
    let time = 0

    const animate = () => {
      time += 0.016

      // Parallax smooth interpolation
      parallax.x += (parallax.targetX - parallax.x) * 0.06
      parallax.y += (parallax.targetY - parallax.y) * 0.06
      camera.position.x = parallax.x * 2.5
      camera.position.y = -parallax.y * 2.5
      camera.lookAt(0, 0, 0)

      // Interactive drag rotation interpolation
      drag.rotX += (drag.targetRotX - drag.rotX) * 0.08
      drag.rotY += (drag.targetRotY - drag.rotY) * 0.08
      masterPivot.rotation.x = drag.rotX
      masterPivot.rotation.y = drag.rotY

      // Rotate Central Core
      coreGroup.rotation.y = time * 0.35
      coreGroup.rotation.x = Math.sin(time * 0.25) * 0.12

      // Heartbeat pulse
      const pulse = 1.0 + Math.sin(time * 3.5) * 0.14
      heartMesh.scale.set(pulse, pulse, pulse)

      // Rotate Rings in opposing 3D angles
      ring1.rotation.z = time * 0.65
      ring2.rotation.z = -time * 0.52
      ring3.rotation.z = time * 0.42

      // Animate Dual Radar Waves
      ;[radarWave1, radarWave2].forEach((w) => {
        w.progress += 0.038
        if (w.progress > 5.5) w.progress = 0.2
        w.mesh.scale.set(w.progress, w.progress, w.progress)
        const mat = w.mesh.material as THREE.MeshBasicMaterial
        mat.opacity = Math.max(0, 0.85 - w.progress / 5.8)
      })

      // Rotate Radar Beam
      radarBeam.rotation.z = -time * 1.2

      // Satellite Nodes Float & Spin
      nodeMeshes.forEach((n, idx) => {
        const hoverOffset = Math.sin(time * 1.8 + idx * 1.1) * 0.14
        n.group.position.y = n.data.pos[1] + hoverOffset
        n.glow.rotation.y = time * 0.85
      })

      // Flowing data packets along Bezier curves
      packets.forEach((p) => {
        p.progress += p.speed
        if (p.progress > 1) p.progress = 0

        const conn = connectionLines[p.curveIndex]
        if (conn) {
          const point = conn.curve.getPoint(p.progress)
          p.mesh.position.copy(point)
          const scale = 0.75 + Math.sin(p.progress * Math.PI) * 0.55
          p.mesh.scale.set(scale, scale, scale)
        }
      })

      // Raycast test (Uses ref to prevent React re-render thrashing at 60 FPS)
      if (!drag.isDragging) {
        raycaster.setFromCamera(mouseNorm, camera)
        const intersects = raycaster.intersectObjects(nodeRaycastObjects)

        if (intersects.length > 0) {
          const hit = intersects[0].object
          const data = hit.userData?.nodeData as VendorNodeData
          if (data && hoveredNodeRef.current?.id !== data.id) {
            hoveredNodeRef.current = data
            setHoveredNode(data)
            container.style.cursor = 'pointer'
          }
        } else if (hoveredNodeRef.current !== null && !selectedVendorId) {
          hoveredNodeRef.current = null
          setHoveredNode(null)
          container.style.cursor = 'grab'
        }
      }

      renderer.render(scene, camera)
      animFrame = requestAnimationFrame(animate)
    }

    animate()

    // CLEANUP
    return () => {
      cancelAnimationFrame(animFrame)
      resizeObserver.disconnect()
      container.removeEventListener('mousemove', onPointerMove)
      container.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('mouseup', onPointerUp)
      container.removeEventListener('mouseleave', onPointerLeave)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)

      // Dispose Three.js objects
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
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
  }, [selectedVendorId])

  // Handle mobile / button vendor click
  const handleSelectVendor = (vendor: VendorNodeData) => {
    if (selectedVendorId === vendor.id) {
      setSelectedVendorId(null)
      setHoveredNode(null)
      hoveredNodeRef.current = null
    } else {
      setSelectedVendorId(vendor.id)
      setHoveredNode(vendor)
      hoveredNodeRef.current = vendor
    }
  }

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] md:h-[520px] lg:h-[580px] select-none overflow-hidden rounded-3xl bg-white/50 backdrop-blur-md border border-[#D7DCE5] shadow-[0_20px_50px_rgba(10,40,45,0.08)] flex flex-col justify-between">
      {/* 1. THREE.JS 3D WEBGL CONTAINER (Continuously Animated 60FPS) */}
      {webGlSupported ? (
        <div
          ref={mountRef}
          className="hero-canvas-3d absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing"
          aria-label="Interactive 3D Multi-Vendor Network Security Topology"
        />
      ) : (
        /* WebGL Fallback Visualization */
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0A282D] text-white">
          <div className="relative w-48 h-48 flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#3DB663]/40 animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute inset-4 rounded-full border border-[#0284C7]/60 animate-ping opacity-30" style={{ animationDuration: '4s' }} />
            <div className="w-20 h-20 rounded-2xl bg-[#0F343A] border border-[#1E4950] flex items-center justify-center shadow-lg shadow-[#3DB663]/20">
              <Shield size={36} className="text-[#3DB663]" />
            </div>
          </div>
          <div className="font-display font-bold text-base text-white text-center">
            Multi-Vendor Topology Matrix
          </div>
          <p className="text-xs font-mono text-[#A3B8BC] text-center max-w-xs mt-1">
            6 Vendor Ast Parsers Active (WebGL Fallback Mode)
          </p>
        </div>
      )}

      {/* 2. FLOATING STATUS BADGES & TELEMETRY OVERLAYS */}
      {/* Top Left: Live Security Engine State */}
      <div className="relative top-3 left-3 sm:top-5 sm:left-5 z-10 pointer-events-none w-fit">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#D7DCE5] shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DB663] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3DB663]" />
          </span>
          <span className="text-xs font-mono font-semibold text-[#0A282D]">
            Multi-Vendor Topology
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#EDF8F1] text-[#1E6E37] font-bold border border-[#BFE7CB]">
            6/6 Active
          </span>
        </div>
      </div>

      {/* Top Right: Real-Time Cycle Indicator (Hidden on smallest mobile) */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10 pointer-events-none hidden sm:block">
        <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D7DCE5] shadow-xs text-right">
          <div className="text-[9px] sm:text-[10px] uppercase font-mono font-bold text-[#7E8F95] tracking-wider">
            Deterministic Pipeline
          </div>
          <div className="text-xs font-sans font-bold text-[#0A282D] flex items-center gap-1.5 justify-end">
            <span className="text-[#3DB663]">●</span>
            {stages[activeStageIndex].label}
          </div>
          <div className="text-[9px] sm:text-[10px] text-[#4A5B60] font-mono mt-0.5">
            {stages[activeStageIndex].status}
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC HOVER / TOUCH TOOLTIP FOR 3D NODE */}
      {hoveredNode && (
        <div className="absolute top-14 sm:top-18 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-20 pointer-events-auto animate-scaleUp">
          <div className="px-4 py-3 rounded-2xl bg-[#0A282D]/95 text-white backdrop-blur-md border border-[#3DB663]/40 shadow-2xl flex items-center justify-between sm:justify-start gap-3 sm:gap-4 max-w-md mx-auto">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: hoveredNode.hexColor, boxShadow: `0 0 10px ${hoveredNode.hexColor}` }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-sans font-bold tracking-tight text-white truncate">
                  {hoveredNode.name}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-[#3DB663] font-bold">
                  {hoveredNode.vendor}
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono text-[#A3B8BC] mt-0.5 truncate">
                {hoveredNode.os} · {hoveredNode.role}
              </div>
            </div>
            <div className="pl-3 border-l border-white/15 text-right font-mono flex-shrink-0">
              <div className="text-sm sm:text-base font-bold text-[#3DB663]">
                {hoveredNode.score}%
              </div>
              <div className="text-[9px] uppercase tracking-wider text-[#A3B8BC]">
                {hoveredNode.rulesPassed}/{hoveredNode.rulesTotal} Rules
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MOBILE-FRIENDLY QUICK VENDOR SELECTOR & TELEMETRY FOOTER */}
      <div className="relative z-10 m-2 sm:m-4 space-y-2 pointer-events-auto">
        {/* Quick Vendor Pill Strip (Satisfies: no interaction requires hover alone) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-none">
          <span className="text-[10px] font-mono font-bold text-[#7E8F95] uppercase flex-shrink-0 mr-1 hidden md:inline">
            Nodes:
          </span>
          {VENDOR_NODES.map((node) => {
            const isSelected = (hoveredNode?.id === node.id)
            return (
              <button
                key={node.id}
                onClick={() => handleSelectVendor(node)}
                className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all border ${
                  isSelected
                    ? 'bg-[#0A282D] text-white border-[#3DB663] shadow-xs'
                    : 'bg-white/90 text-[#4A5B60] border-[#D7DCE5] hover:bg-white'
                }`}
                aria-label={`Inspect ${node.vendor} ${node.name}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: node.hexColor }}
                />
                <span>{node.vendor}</span>
                <span className="text-[9px] opacity-75">{node.score}%</span>
              </button>
            )
          })}
        </div>

        {/* Bottom Baseline Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D7DCE5] shadow-xs text-[11px] font-mono text-[#4A5B60]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-[#0A282D]">
              <Shield size={13} className="text-[#3DB663]" />
              CIS & NIST SP 800-53
            </span>
            <span className="hidden sm:inline text-[#D7DCE5]">|</span>
            <span className="hidden sm:flex items-center gap-1">
              <CheckCircle2 size={12} className="text-[#3DB663]" />
              Deterministic Regex Core
            </span>
          </div>

          <div className="text-[10px] text-[#7E8F95] hidden xs:block">
            Drag to tilt 3D · Tap nodes to inspect
          </div>
        </div>
      </div>
    </div>
  )
}
