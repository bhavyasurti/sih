import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Shield, ShieldAlert, ShieldCheck, Activity, Wifi, Server, RefreshCw } from 'lucide-react'

interface SecurityTopology3DProps {
  complianceScore: number | null
  riskLevel: string
  auditCount: number
  vendorBreakdown?: {
    cisco: { count: number; score: number | null }
    fortinet: { count: number; score: number | null }
    paloalto: { count: number; score: number | null }
    juniper?: { count: number; score: number | null }
    aruba?: { count: number; score: number | null }
    checkpoint?: { count: number; score: number | null }
  }
}

interface NodeData {
  id: string
  label: string
  vendor: string
  os: string
  score: number | null
  status: 'healthy' | 'warning' | 'critical'
  pos: [number, number, number]
  color: number
  hexColor: string
}

export function SecurityTopology3D({
  complianceScore,
  riskLevel,
  auditCount,
  vendorBreakdown,
}: SecurityTopology3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])

  const getStatusFromScore = (score: number | null | undefined): 'healthy' | 'warning' | 'critical' => {
    if (score === null || score === undefined) return 'healthy'
    if (score >= 80) return 'healthy'
    if (score >= 50) return 'warning'
    return 'critical'
  }

  const nodes: NodeData[] = [
    {
      id: 'cisco',
      label: 'Cisco IOS-XE Core',
      vendor: 'Cisco',
      os: 'IOS-XE 17.9',
      score: vendorBreakdown?.cisco.score ?? 94,
      status: getStatusFromScore(vendorBreakdown?.cisco.score ?? 94),
      pos: [-3.5, 1.4, 0.8],
      color: 0x0284c7,
      hexColor: '#0284C7',
    },
    {
      id: 'fortinet',
      label: 'FortiOS Edge NGFW',
      vendor: 'Fortinet',
      os: 'FortiOS 7.4',
      score: vendorBreakdown?.fortinet.score ?? 78,
      status: getStatusFromScore(vendorBreakdown?.fortinet.score ?? 78),
      pos: [-2.6, -1.8, 1.5],
      color: 0xe11d48,
      hexColor: '#E11D48',
    },
    {
      id: 'paloalto',
      label: 'PAN-OS Gateway',
      vendor: 'Palo Alto',
      os: 'PAN-OS 11.1',
      score: vendorBreakdown?.paloalto.score ?? 91,
      status: getStatusFromScore(vendorBreakdown?.paloalto.score ?? 91),
      pos: [3.2, 1.6, 1.1],
      color: 0xf97316,
      hexColor: '#F97316',
    },
    {
      id: 'juniper',
      label: 'Junos Spine Switch',
      vendor: 'Juniper',
      os: 'Junos OS 23.2',
      score: vendorBreakdown?.juniper?.score ?? 96,
      status: getStatusFromScore(vendorBreakdown?.juniper?.score ?? 96),
      pos: [3.6, -1.4, 0.6],
      color: 0x3db663,
      hexColor: '#3DB663',
    },
    {
      id: 'aruba',
      label: 'Aruba CX Access',
      vendor: 'Aruba',
      os: 'AOS-CX 10.12',
      score: vendorBreakdown?.aruba?.score ?? 88,
      status: getStatusFromScore(vendorBreakdown?.aruba?.score ?? 88),
      pos: [-1.2, -2.6, -1.4],
      color: 0xd97706,
      hexColor: '#D97706',
    },
    {
      id: 'checkpoint',
      label: 'Check Point Gaia DC',
      vendor: 'Check Point',
      os: 'Gaia R81.20',
      score: vendorBreakdown?.checkpoint?.score ?? 92,
      status: getStatusFromScore(vendorBreakdown?.checkpoint?.score ?? 92),
      pos: [1.2, 2.7, -1.2],
      color: 0x8b5cf6,
      hexColor: '#8B5CF6',
    },
  ]

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 11)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      container.appendChild(renderer.domElement)
    } catch {
      return
    }

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.3)
    scene.add(ambient)

    const dir1 = new THREE.DirectionalLight(0x3db663, 2.2)
    dir1.position.set(5, 6, 4)
    scene.add(dir1)

    const dir2 = new THREE.DirectionalLight(0x0284c7, 1.6)
    dir2.position.set(-5, -4, 3)
    scene.add(dir2)

    // Master Pivot Group for responsive scaling
    const pivot = new THREE.Group()
    scene.add(pivot)

    // Central Fleet Core
    const coreGroup = new THREE.Group()
    pivot.add(coreGroup)

    const coreMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.0, 1),
      new THREE.MeshStandardMaterial({
        color: 0x0a282d,
        metalness: 0.85,
        roughness: 0.2,
      })
    )
    coreGroup.add(coreMesh)

    const wireCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.22, 1),
      new THREE.MeshBasicMaterial({
        color: complianceScore !== null && complianceScore < 70 ? 0xe11d48 : 0x3db663,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      })
    )
    coreGroup.add(wireCore)

    // Orbit Ring
    const orbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.02, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x3db663, transparent: true, opacity: 0.4 })
    )
    orbitRing.rotation.x = Math.PI / 3
    coreGroup.add(orbitRing)

    // Node meshes
    const nodeRaycastObjects: THREE.Object3D[] = []
    const connectionLines: { line: THREE.Line; curve: THREE.QuadraticBezierCurve3 }[] = []

    nodes.forEach((n) => {
      const nodeGroup = new THREE.Group()
      nodeGroup.position.set(...n.pos)

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 24, 24),
        new THREE.MeshStandardMaterial({
          color: n.color,
          roughness: 0.2,
          metalness: 0.8,
          emissive: n.color,
          emissiveIntensity: 0.3,
        })
      )
      sphere.userData = { nodeData: n }
      nodeGroup.add(sphere)
      pivot.add(nodeGroup)
      nodeRaycastObjects.push(sphere)

      // Curve to core
      const start = new THREE.Vector3(...n.pos)
      const mid = new THREE.Vector3(n.pos[0] * 0.45, n.pos[1] * 0.45 + 0.4, n.pos[2] * 0.45)
      const end = new THREE.Vector3(0, 0, 0)
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)

      const points = curve.getPoints(30)
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: n.color, transparent: true, opacity: 0.35 })
      )
      pivot.add(line)
      connectionLines.push({ line, curve })
    })

    // Mouse interaction
    const raycaster = new THREE.Raycaster()
    const mouseNorm = new THREE.Vector2(-999, -999)
    const mousePos = { x: 0, y: 0, targetX: 0, targetY: 0 }

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseNorm.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      mousePos.targetX = (e.clientX - rect.left - rect.width / 2) * 0.0015
      mousePos.targetY = (e.clientY - rect.top - rect.height / 2) * 0.0015
    }

    const onPointerLeave = () => {
      mouseNorm.x = -999
      mouseNorm.y = -999
      setHoveredNode(null)
    }

    container.addEventListener('mousemove', onPointerMove, { passive: true })
    container.addEventListener('mouseleave', onPointerLeave, { passive: true })

    const updateSize = (w: number, h: number) => {
      if (w === 0 || h === 0) return
      const aspect = w / h
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)

      if (aspect < 1.0) {
        const factor = Math.min(1.0, Math.max(0.65, aspect * 1.1))
        pivot.scale.set(factor, factor, factor)
        camera.position.z = 12.0 / factor * 0.95
      } else {
        pivot.scale.set(1, 1, 1)
        camera.position.z = 12.0
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        updateSize(width, height)
      }
    })
    resizeObserver.observe(container)

    let animId: number
    let time = 0

    const animate = () => {
      time += 0.012

      mousePos.x += (mousePos.targetX - mousePos.x) * 0.05
      mousePos.y += (mousePos.targetY - mousePos.y) * 0.05
      camera.position.x = mousePos.x * 2.5
      camera.position.y = -mousePos.y * 2.5
      camera.lookAt(0, 0, 0)

      if (!prefersReducedMotion) {
        coreGroup.rotation.y = time * 0.3
        orbitRing.rotation.z = time * 0.5
      }

      raycaster.setFromCamera(mouseNorm, camera)
      const intersects = raycaster.intersectObjects(nodeRaycastObjects)

      if (intersects.length > 0) {
        const hit = intersects[0].object
        const data = hit.userData?.nodeData as NodeData
        if (data && hoveredNode?.id !== data.id) {
          setHoveredNode(data)
        }
      } else if (hoveredNode !== null) {
        setHoveredNode(null)
      }

      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      resizeObserver.disconnect()
      container.removeEventListener('mousemove', onPointerMove)
      container.removeEventListener('mouseleave', onPointerLeave)

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
  }, [prefersReducedMotion, complianceScore])

  return (
    <div className="relative w-full h-[360px] sm:h-[400px] rounded-3xl bg-white border border-[#D7DCE5] overflow-hidden shadow-xs">
      {/* 3D WebGL Scene */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Header Overlays */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#D7DCE5] shadow-xs text-xs font-mono">
          <span className="h-2 w-2 rounded-full bg-[#3DB663] animate-ping" />
          <span className="font-bold text-[#0A282D]">Fleet Topology Posture</span>
          <span className="text-[#7E8F95]">· {auditCount} Audits</span>
        </div>
      </div>

      {/* Dynamic Hover Tooltip */}
      {hoveredNode && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-fadeIn">
          <div className="px-3.5 py-2 rounded-xl bg-[#0A282D] text-white shadow-lg border border-[#3DB663]/40 flex items-center gap-3 font-mono text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: hoveredNode.hexColor }}
            />
            <div>
              <div className="font-bold text-white font-sans">{hoveredNode.label}</div>
              <div className="text-[10px] text-[#A3B8BC]">{hoveredNode.os}</div>
            </div>
            <div className="pl-2 border-l border-white/20 text-[#3DB663] font-bold">
              {hoveredNode.score !== null ? `${hoveredNode.score}%` : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between p-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#D7DCE5] text-xs font-mono text-[#7E8F95] pointer-events-none">
        <span>6 Multi-Vendor Satellite Nodes</span>
        <span className="text-[#0A282D] font-bold">Hover node to inspect compliance score</span>
      </div>
    </div>
  )
}
