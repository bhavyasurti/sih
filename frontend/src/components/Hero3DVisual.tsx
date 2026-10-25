import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Sparkles, Play, Pause } from 'lucide-react'

interface Hero3DVisualProps {
  className?: string
  fullScreenBackground?: boolean
}

interface TextParticleData {
  tx: number // target X
  ty: number // target Y
  tz: number // target Z
  px: number // current X
  py: number // current Y
  pz: number // current Z
  vx: number
  vy: number
  vz: number
  originX: number
  originY: number
  originZ: number
  r: number
  g: number
  b: number
  size: number
  phase: number
  isAI: boolean
  isGlint: boolean
}

export function Hero3DVisual({ className = '', fullScreenBackground = false }: Hero3DVisualProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const isPlayingRef = useRef(true)

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let animId: number
    let isDisposed = false

    // 1. Create Glowing Radial Particle Texture with additive glow
    const createParticleTexture = (): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas')
      canvas.width = 128
      canvas.height = 128
      const ctx = canvas.getContext('2d')!

      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)') // Pure bright white core
      gradient.addColorStop(0.18, 'rgba(255, 255, 255, 0.95)')
      gradient.addColorStop(0.42, 'rgba(125, 245, 225, 0.75)') // Cyan glow
      gradient.addColorStop(0.70, 'rgba(16, 185, 129, 0.32)') // Radiant emerald fringe
      gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(64, 64, 64, 0, Math.PI * 2)
      ctx.fill()

      // Add cross star flare glint
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(64, 38)
      ctx.lineTo(64, 90)
      ctx.moveTo(38, 64)
      ctx.lineTo(90, 64)
      ctx.stroke()

      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      return texture
    }

    const particleTexture = createParticleTexture()

    // 2. Scene, Camera, WebGL Renderer
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020506) // Deepest cinematic black
    scene.fog = new THREE.FogExp2(0x020506, 0.026)

    const initialWidth = container.clientWidth || window.innerWidth
    const initialHeight = container.clientHeight || (fullScreenBackground ? window.innerHeight : 600)

    const camera = new THREE.PerspectiveCamera(
      45,
      initialWidth / initialHeight,
      0.1,
      120
    )

    // Responsive initial camera position
    if (initialWidth < 640) {
      camera.position.set(0, 0.4, 13.5)
    } else if (initialWidth < 1024) {
      camera.position.set(0, 0.2, 12.0)
    } else {
      camera.position.set(0, 0, 11.2)
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
      renderer.setSize(initialWidth, initialHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      container.appendChild(renderer.domElement)
    } catch (err) {
      console.error('WebGL Initialization failed:', err)
      return
    }

    // 3. Sample Typography for "NetSecure AI"
    const hasSeenIntro = sessionStorage.getItem('netsecure_intro_seen') === 'true'

    const sampleTextParticles = (viewportWidth: number): TextParticleData[] => {
      const isMobile = viewportWidth < 640
      const isTablet = viewportWidth >= 640 && viewportWidth < 1024

      const offscreen = document.createElement('canvas')
      offscreen.width = 1800
      offscreen.height = 420
      const ctx = offscreen.getContext('2d', { willReadFrequently: true })
      if (!ctx) return []

      const fontSize = isMobile ? 120 : isTablet ? 145 : 170
      ctx.font = `800 ${fontSize}px "Outfit", "Figtree", "Inter", -apple-system, sans-serif`
      ctx.textBaseline = 'middle'

      const netText = 'NetSecure'
      const aiText = ' AI'
      const netWidth = ctx.measureText(netText).width
      const aiWidth = ctx.measureText(aiText).width
      const totalTextWidth = netWidth + aiWidth

      const startX = (offscreen.width - totalTextWidth) / 2
      const centerY = offscreen.height / 2

      ctx.clearRect(0, 0, offscreen.width, offscreen.height)

      // Draw "NetSecure" in Pure Red (Channel R)
      ctx.fillStyle = '#FF0000'
      ctx.fillText(netText, startX, centerY)

      // Draw "AI" in Pure Green (Channel G)
      ctx.fillStyle = '#00FF00'
      ctx.fillText(aiText, startX + netWidth, centerY)

      const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height)
      const data = imgData.data

      const particles: TextParticleData[] = []

      // Dense sampling for solid, luminous letter bodies
      // Integer gridStep ensures integer indexing into Uint8ClampedArray data
      const gridStep = isMobile ? 4 : 3

      // Target world width for crisp typography
      const targetWorldWidth = isMobile ? 4.2 : isTablet ? 6.8 : 8.8
      const worldScale = targetWorldWidth / totalTextWidth
      const offsetY = fullScreenBackground ? (isMobile ? 2.15 : 1.95) : (isMobile ? 0.9 : 0.75)

      for (let y = 0; y < offscreen.height; y += gridStep) {
        for (let x = 0; x < offscreen.width; x += gridStep) {
          const idx = (y * offscreen.width + x) * 4
          const rVal = data[idx]
          const gVal = data[idx + 1]
          const aVal = data[idx + 3]

          if (aVal > 90 && (rVal > 80 || gVal > 80)) {
            const isAI = gVal > 80
            const wx = (x - offscreen.width / 2) * worldScale
            const wy = -(y - offscreen.height / 2) * worldScale + offsetY
            const wz = 0

            // Origin position for opening assembly
            const originX = wx + (Math.random() - 0.5) * 18
            const originY = wy + (Math.random() - 0.5) * 12
            const originZ = wz - 18 + Math.random() * 24

            // If already seen intro, start directly at target; otherwise at dispersed origin
            const startXPos = hasSeenIntro ? wx : originX
            const startYPos = hasSeenIntro ? wy : originY
            const startZPos = hasSeenIntro ? wz : originZ

            let red = 0.95
            let green = 0.99
            let blue = 1.0

            if (isAI) {
              // Vibrant Radiant Emerald Green (#10B981 / #34D399) matching reference image
              const variation = Math.random()
              if (variation > 0.6) {
                red = 0.04; green = 0.98; blue = 0.50 // Pure glowing emerald
              } else if (variation > 0.25) {
                red = 0.12; green = 0.92; blue = 0.60 // Rich mint emerald
              } else {
                red = 0.35; green = 1.0; blue = 0.68 // Luminous bright emerald
              }
            } else {
              // Cool Celestial White and Pale Cyan (#E6FFFA / #A5F3FC)
              const variation = Math.random()
              if (variation > 0.55) {
                red = 0.98; green = 1.0; blue = 1.0 // Pure starlight white
              } else if (variation > 0.25) {
                red = 0.72; green = 0.97; blue = 0.98 // Ice cyan starlight
              } else {
                red = 0.45; green = 0.88; blue = 0.86 // Soft cyan-teal aura
              }
            }

            // Key vertex glints (~3.5% sparkling diamond nodes)
            const isGlint = Math.random() < 0.038
            const size = isGlint ? (0.22 + Math.random() * 0.08) : (0.095 + Math.random() * 0.04)

            particles.push({
              tx: wx,
              ty: wy,
              tz: wz,
              px: startXPos,
              py: startYPos,
              pz: startZPos,
              vx: 0,
              vy: 0,
              vz: 0,
              originX,
              originY,
              originZ,
              r: red,
              g: green,
              b: blue,
              size,
              phase: Math.random() * Math.PI * 2,
              isAI,
              isGlint,
            })
          }
        }
      }

      return particles
    }

    let textParticleList = sampleTextParticles(initialWidth)

    // Build Three.js Geometry for Text Particles
    const textGeo = new THREE.BufferGeometry()
    const textPosArray = new Float32Array(textParticleList.length * 3)
    const textColorArray = new Float32Array(textParticleList.length * 3)
    const textSizeArray = new Float32Array(textParticleList.length)

    for (let i = 0; i < textParticleList.length; i++) {
      const p = textParticleList[i]
      textPosArray[i * 3] = p.px
      textPosArray[i * 3 + 1] = p.py
      textPosArray[i * 3 + 2] = p.pz

      textColorArray[i * 3] = p.r
      textColorArray[i * 3 + 1] = p.g
      textColorArray[i * 3 + 2] = p.b

      textSizeArray[i] = p.size
    }

    textGeo.setAttribute('position', new THREE.BufferAttribute(textPosArray, 3))
    textGeo.setAttribute('color', new THREE.BufferAttribute(textColorArray, 3))
    textGeo.setAttribute('size', new THREE.BufferAttribute(textSizeArray, 1))

    const textMat = new THREE.PointsMaterial({
      size: 0.118,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.98,
      sizeAttenuation: true,
    })

    const textPoints = new THREE.Points(textGeo, textMat)
    scene.add(textPoints)

    // 3b. Sparkling Diamond Cross Flares on Text Peaks (Matching Reference Image)
    const flareOffsets = [
      { x: -3.85, y: 2.55, isAI: false, speed: 2.2, phase: 0 },    // Top peak of N
      { x: -3.1, y: 2.28, isAI: false, speed: 1.8, phase: 1.2 },   // e
      { x: -2.3, y: 2.50, isAI: false, speed: 2.5, phase: 2.4 },   // t
      { x: -1.35, y: 2.55, isAI: false, speed: 1.9, phase: 0.8 },  // S
      { x: -0.6, y: 2.25, isAI: false, speed: 2.1, phase: 3.1 },   // e
      { x: 0.2, y: 2.28, isAI: false, speed: 2.4, phase: 1.9 },    // c
      { x: 1.0, y: 2.22, isAI: false, speed: 1.7, phase: 4.2 },    // u
      { x: 1.8, y: 2.22, isAI: false, speed: 2.6, phase: 2.7 },    // r
      { x: 2.5, y: 2.25, isAI: false, speed: 2.0, phase: 0.5 },    // e
      { x: 3.35, y: 2.56, isAI: true, speed: 3.0, phase: 1.5 },    // Apex of A (Emerald)
      { x: 3.35, y: 2.10, isAI: true, speed: 2.2, phase: 3.8 },    // Crossbar of A
      { x: 4.05, y: 2.56, isAI: true, speed: 2.8, phase: 2.1 },    // Top of I (Emerald)
      { x: 4.05, y: 1.78, isAI: true, speed: 1.9, phase: 0.3 },    // Bottom of I
      { x: 2.9, y: 1.78, isAI: true, speed: 2.3, phase: 4.6 },     // Left foot of A
    ]
    const flareCount = flareOffsets.length
    const flareGeo = new THREE.BufferGeometry()
    const flarePos = new Float32Array(flareCount * 3)
    const flareColors = new Float32Array(flareCount * 3)

    for (let f = 0; f < flareCount; f++) {
      const fo = flareOffsets[f]
      flarePos[f * 3] = fo.x
      flarePos[f * 3 + 1] = fo.y
      flarePos[f * 3 + 2] = 0.15

      if (fo.isAI) {
        flareColors[f * 3] = 0.15
        flareColors[f * 3 + 1] = 1.0
        flareColors[f * 3 + 2] = 0.65
      } else {
        flareColors[f * 3] = 0.95
        flareColors[f * 3 + 1] = 1.0
        flareColors[f * 3 + 2] = 1.0
      }
    }

    flareGeo.setAttribute('position', new THREE.BufferAttribute(flarePos, 3))
    flareGeo.setAttribute('color', new THREE.BufferAttribute(flareColors, 3))

    const flareMat = new THREE.PointsMaterial({
      size: 0.38,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.95,
      sizeAttenuation: true,
    })

    const flarePoints = new THREE.Points(flareGeo, flareMat)
    textPoints.add(flarePoints)

    // 4. Undulating Flowing 3D Wave Meshes (Layer 1: Main Foreground Wave Dune)
    const isMobileViewport = initialWidth < 640
    const waveCols = isMobileViewport ? 90 : 140
    const waveRows = isMobileViewport ? 40 : 58
    const totalWaveParticles = waveCols * waveRows

    const waveGeo = new THREE.BufferGeometry()
    const wavePosArray = new Float32Array(totalWaveParticles * 3)
    const waveColorArray = new Float32Array(totalWaveParticles * 3)
    const waveBaseArray: { x: number; z: number; phase: number }[] = []

    const xRange = isMobileViewport ? 22 : 34
    const zRangeStart = -14
    const zRangeEnd = 6

    let wIdx = 0
    for (let row = 0; row < waveRows; row++) {
      const z = zRangeStart + (row / (waveRows - 1)) * (zRangeEnd - zRangeStart)
      for (let col = 0; col < waveCols; col++) {
        const x = -xRange / 2 + (col / (waveCols - 1)) * xRange
        waveBaseArray.push({
          x,
          z,
          phase: Math.random() * Math.PI * 2,
        })

        wavePosArray[wIdx * 3] = x
        wavePosArray[wIdx * 3 + 1] = -2.8
        wavePosArray[wIdx * 3 + 2] = z

        // Gradient: Deep oceanic teal to radiant emerald
        waveColorArray[wIdx * 3] = 0.05
        waveColorArray[wIdx * 3 + 1] = 0.58
        waveColorArray[wIdx * 3 + 2] = 0.52

        wIdx++
      }
    }

    waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePosArray, 3))
    waveGeo.setAttribute('color', new THREE.BufferAttribute(waveColorArray, 3))

    const waveMat = new THREE.PointsMaterial({
      size: 0.13,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.88,
      sizeAttenuation: true,
    })

    const wavePoints = new THREE.Points(waveGeo, waveMat)
    scene.add(wavePoints)

    // 5. Layer 2: Distant Horizon Mesh & Deep Swells
    const horizonCols = isMobileViewport ? 50 : 80
    const horizonRows = isMobileViewport ? 20 : 30
    const totalHorizonParticles = horizonCols * horizonRows
    const horizonGeo = new THREE.BufferGeometry()
    const horizonPosArray = new Float32Array(totalHorizonParticles * 3)
    const horizonColorArray = new Float32Array(totalHorizonParticles * 3)
    const horizonBaseArray: { x: number; z: number }[] = []

    let hIdx = 0
    for (let r = 0; r < horizonRows; r++) {
      const hz = -28 + (r / (horizonRows - 1)) * 12
      for (let c = 0; c < horizonCols; c++) {
        const hx = -36 / 2 + (c / (horizonCols - 1)) * 36
        horizonBaseArray.push({ x: hx, z: hz })

        horizonPosArray[hIdx * 3] = hx
        horizonPosArray[hIdx * 3 + 1] = 1.0
        horizonPosArray[hIdx * 3 + 2] = hz

        horizonColorArray[hIdx * 3] = 0.04
        horizonColorArray[hIdx * 3 + 1] = 0.42
        horizonColorArray[hIdx * 3 + 2] = 0.45
        hIdx++
      }
    }

    horizonGeo.setAttribute('position', new THREE.BufferAttribute(horizonPosArray, 3))
    horizonGeo.setAttribute('color', new THREE.BufferAttribute(horizonColorArray, 3))

    const horizonMat = new THREE.PointsMaterial({
      size: 0.10,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.45,
      sizeAttenuation: true,
    })

    const horizonPoints = new THREE.Points(horizonGeo, horizonMat)
    scene.add(horizonPoints)

    // 6. Upper Ambient Stardust & Sparkle Field
    const ambientCount = isMobileViewport ? 180 : 360
    const ambientGeo = new THREE.BufferGeometry()
    const ambientPosArray = new Float32Array(ambientCount * 3)
    const ambientColorArray = new Float32Array(ambientCount * 3)
    const ambientVelocity: { x: number; y: number; z: number; phase: number }[] = []

    for (let a = 0; a < ambientCount; a++) {
      const ax = (Math.random() - 0.5) * 32
      const ay = -1.0 + Math.random() * 8.0
      const az = -14 + Math.random() * 18

      ambientPosArray[a * 3] = ax
      ambientPosArray[a * 3 + 1] = ay
      ambientPosArray[a * 3 + 2] = az

      const isGreen = Math.random() > 0.4
      ambientColorArray[a * 3] = isGreen ? 0.14 : 0.80
      ambientColorArray[a * 3 + 1] = isGreen ? 0.95 : 0.99
      ambientColorArray[a * 3 + 2] = isGreen ? 0.62 : 0.96

      ambientVelocity.push({
        x: (Math.random() - 0.5) * 0.003,
        y: 0.002 + Math.random() * 0.005,
        z: (Math.random() - 0.5) * 0.003,
        phase: Math.random() * Math.PI * 2,
      })
    }

    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPosArray, 3))
    ambientGeo.setAttribute('color', new THREE.BufferAttribute(ambientColorArray, 3))

    const ambientMat = new THREE.PointsMaterial({
      size: 0.15,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.70,
      sizeAttenuation: true,
    })

    const ambientPoints = new THREE.Points(ambientGeo, ambientMat)
    scene.add(ambientPoints)

    // 7. Interactive Mouse Tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false }
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const clientX = e.clientX - rect.left
      const clientY = e.clientY - rect.top

      mouse.targetX = (clientX / rect.width) * 2 - 1
      mouse.targetY = -(clientY / rect.height) * 2 + 1
      mouse.active = true
    }

    const onMouseLeave = () => {
      mouse.targetX = 0
      mouse.targetY = 0
      mouse.active = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        const rect = container.getBoundingClientRect()
        const clientX = e.touches[0].clientX - rect.left
        const clientY = e.touches[0].clientY - rect.top
        mouse.targetX = (clientX / rect.width) * 2 - 1
        mouse.targetY = -(clientY / rect.height) * 2 + 1
        mouse.active = true
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mouseleave', onMouseLeave, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    // 8. Opening Progression Logic
    let gatherProgress = hasSeenIntro ? 1.0 : 0.0
    const gatherStartTime = performance.now()
    const gatherDuration = 3200 // 3.2s smooth gathering phase

    const baseCam = {
      x: 0,
      y: initialWidth < 640 ? 0.6 : initialWidth < 1024 ? 0.3 : 0,
      z: initialWidth < 640 ? 13.8 : initialWidth < 1024 ? 12.0 : 11.2,
    }

    // 9. Main 60 FPS Render Loop
    const clock = new THREE.Clock()
    let sweepX = -14

    const animate = () => {
      if (isDisposed) return
      animId = requestAnimationFrame(animate)

      if (!isPlayingRef.current) return

      const delta = clock.getDelta()
      const elapsedTime = clock.getElapsedTime()

      // Calculate Gather Progression for Opening Sequence
      if (gatherProgress < 1.0) {
        const elapsed = performance.now() - gatherStartTime
        const rawProgress = Math.min(elapsed / gatherDuration, 1.0)
        // Smooth easeOutCubic
        gatherProgress = 1 - Math.pow(1 - rawProgress, 3)
      }

      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.05
      mouse.y += (mouse.targetY - mouse.y) * 0.05

      // Subtle scene camera parallax relative to responsive baseCam
      camera.position.x = baseCam.x + mouse.x * 0.45
      camera.position.y = baseCam.y + mouse.y * 0.35
      camera.position.z = baseCam.z
      camera.lookAt(0, fullScreenBackground ? 0.3 : 0, 0)

      // Light sweep progression across text and wave fields
      sweepX += delta * 4.2
      if (sweepX > 16) sweepX = -16

      // Approximate 3D cursor position
      const worldMouseX = mouse.x * 7.5
      const worldMouseY = mouse.y * 4.5

      // A. Animate Text Particles
      const textPositions = textGeo.attributes.position.array as Float32Array
      const textColors = textGeo.attributes.color.array as Float32Array

      for (let i = 0; i < textParticleList.length; i++) {
        const p = textParticleList[i]

        // Coherent wave displacement across text - NO random phase on spatial motion
        // This ensures the typography remains sharp, crisp, and readable throughout!
        const coherentY = Math.sin(elapsedTime * 1.5 + p.tx * 0.8) * 0.03
        const coherentZ = Math.sin(elapsedTime * 1.8 - p.tx * 1.0) * 0.05

        // Scanning light ripple passing through the letters
        const rippleDist = Math.abs(p.tx - sweepX)
        const rippleEffect = Math.exp(-(rippleDist * rippleDist) / 1.6) * 0.28

        const targetX = THREE.MathUtils.lerp(p.originX, p.tx, gatherProgress)
        const targetY = THREE.MathUtils.lerp(p.originY, p.ty + coherentY, gatherProgress)
        const targetZ = THREE.MathUtils.lerp(p.originZ, p.tz + coherentZ + rippleEffect, gatherProgress)

        // Mouse repulsion when gathered
        if (gatherProgress > 0.6 && mouse.active) {
          const dx = p.px - worldMouseX
          const dy = p.py - worldMouseY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const repulsionRadius = 1.8

          if (dist < repulsionRadius && dist > 0.01) {
            const force = (1.0 - dist / repulsionRadius) * 0.14
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }

        if (gatherProgress < 1.0) {
          // Direct smooth interpolation during opening
          p.px = targetX
          p.py = targetY
          p.pz = targetZ
        } else {
          // Spring return physics
          p.vx += (targetX - p.px) * 0.085
          p.vy += (targetY - p.py) * 0.085
          p.vz += (targetZ - p.pz) * 0.085

          p.vx *= 0.84
          p.vy *= 0.84
          p.vz *= 0.84

          p.px += p.vx
          p.py += p.vy
          p.pz += p.vz
        }

        textPositions[i * 3] = p.px
        textPositions[i * 3 + 1] = p.py
        textPositions[i * 3 + 2] = p.pz

        // Sparkle shimmer brightness (phase used only for luminous twinkle)
        const shimmer = 0.88 + 0.35 * Math.sin(elapsedTime * 3.2 + p.phase)
        const glintMultiplier = p.isGlint ? 1.4 : 1.0
        textColors[i * 3] = Math.min((p.r * shimmer + rippleEffect * 0.5) * glintMultiplier, 1.0)
        textColors[i * 3 + 1] = Math.min((p.g * shimmer + rippleEffect * 0.6) * glintMultiplier, 1.0)
        textColors[i * 3 + 2] = Math.min((p.b * shimmer + rippleEffect * 0.5) * glintMultiplier, 1.0)
      }
      textGeo.attributes.position.needsUpdate = true
      textGeo.attributes.color.needsUpdate = true

      // A2. Animate Star Cross Flares on Letter Vertices
      const flareColArray = flareGeo.attributes.color.array as Float32Array
      for (let f = 0; f < flareCount; f++) {
        const fo = flareOffsets[f]
        const pulse = 0.4 + 0.6 * Math.sin(elapsedTime * fo.speed + fo.phase)
        const intensity = pulse * pulse
        if (fo.isAI) {
          flareColArray[f * 3] = 0.15 * intensity
          flareColArray[f * 3 + 1] = 1.0 * intensity
          flareColArray[f * 3 + 2] = 0.60 * intensity
        } else {
          flareColArray[f * 3] = 0.95 * intensity
          flareColArray[f * 3 + 1] = 1.0 * intensity
          flareColArray[f * 3 + 2] = 1.0 * intensity
        }
      }
      flareGeo.attributes.color.needsUpdate = true

      // B. Animate 3D Flowing Wave Surfaces (Foreground Dune)
      const wavePositions = waveGeo.attributes.position.array as Float32Array
      const waveColors = waveGeo.attributes.color.array as Float32Array

      for (let j = 0; j < waveBaseArray.length; j++) {
        const wb = waveBaseArray[j]
        const wx = wb.x
        const wz = wb.z

        // Multi-harmonic undulating wave equation matching reference dunes
        const yBase =
          Math.sin(wx * 0.22 + elapsedTime * 0.75) * Math.cos(wz * 0.26 + elapsedTime * 0.55) * 1.5 +
          Math.sin((wx - wz) * 0.14 - elapsedTime * 0.4) * 0.75 -
          2.7

        // Subtle mouse dip near cursor
        const mDist = Math.sqrt((wx - worldMouseX) ** 2 + (wz - (worldMouseY - 2.5)) ** 2)
        const dip = mDist < 2.5 ? (1 - mDist / 2.5) * 0.35 : 0

        const finalY = yBase - dip

        wavePositions[j * 3] = wx
        wavePositions[j * 3 + 1] = finalY
        wavePositions[j * 3 + 2] = wz

        // Color mapping: Valleys = deep teal, Crests = radiant glowing emerald/cyan
        const heightNorm = THREE.MathUtils.clamp((finalY + 3.8) / 2.6, 0.0, 1.0)

        // Skimming light beam on crests
        const beamDist = Math.abs(wx - sweepX)
        const beamLight = Math.exp(-(beamDist * beamDist) / 4.0) * 0.35

        waveColors[j * 3] = THREE.MathUtils.lerp(0.04, 0.18, heightNorm) + beamLight * 0.2 // R
        waveColors[j * 3 + 1] = THREE.MathUtils.lerp(0.55, 0.98, heightNorm) + beamLight * 0.6 // G
        waveColors[j * 3 + 2] = THREE.MathUtils.lerp(0.52, 0.62, heightNorm) + beamLight * 0.5 // B
      }
      waveGeo.attributes.position.needsUpdate = true
      waveGeo.attributes.color.needsUpdate = true

      // C. Animate Distant Horizon Waves
      const horizonPositions = horizonGeo.attributes.position.array as Float32Array
      for (let h = 0; h < horizonBaseArray.length; h++) {
        const hb = horizonBaseArray[h]
        const hy =
          Math.sin(hb.x * 0.16 + elapsedTime * 0.45) * Math.cos(hb.z * 0.18 + elapsedTime * 0.35) * 0.9 +
          Math.sin(hb.x * 0.08 - elapsedTime * 0.25) * 0.5 +
          0.8
        horizonPositions[h * 3 + 1] = hy
      }
      horizonGeo.attributes.position.needsUpdate = true

      // D. Animate Upper Ambient Stardust
      const ambPositions = ambientGeo.attributes.position.array as Float32Array
      for (let k = 0; k < ambientCount; k++) {
        const vel = ambientVelocity[k]
        ambPositions[k * 3] += Math.sin(elapsedTime * 0.4 + vel.phase) * 0.003
        ambPositions[k * 3 + 1] += vel.y
        ambPositions[k * 3 + 2] += Math.cos(elapsedTime * 0.35 + vel.phase) * 0.002

        // Wrap around top boundary
        if (ambPositions[k * 3 + 1] > 6.5) {
          ambPositions[k * 3 + 1] = -1.5
          ambPositions[k * 3] = (Math.random() - 0.5) * 32
        }
      }
      ambientGeo.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    // 10. Resize Handling & Responsive Typography Recalculation
    const handleResize = () => {
      if (!container || !renderer) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || (fullScreenBackground ? window.innerHeight : 600)

      camera.aspect = w / h

      if (w < 640) {
        baseCam.y = 0.6
        baseCam.z = 13.8
        camera.position.set(0, 0.6, 13.8)
        const mobileScale = Math.min(w / 700, 0.48)
        textPoints.scale.set(mobileScale, mobileScale, mobileScale)
        textPoints.position.set(0, 2.35, 0)
      } else if (w < 1024) {
        baseCam.y = 0.3
        baseCam.z = 12.0
        camera.position.set(0, 0.3, 12.0)
        const tabletScale = 0.8
        textPoints.scale.set(tabletScale, tabletScale, tabletScale)
        textPoints.position.set(0, 0.2, 0)
      } else {
        baseCam.y = 0
        baseCam.z = 11.2
        camera.position.set(0, 0, 11.2)
        textPoints.scale.set(1.0, 1.0, 1.0)
        textPoints.position.set(0, 0, 0)
      }

      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    }

    // Call initially to enforce exact mobile/desktop scale
    handleResize()

    const ro = new ResizeObserver(handleResize)
    ro.observe(container)

    // 11. Pause when out of view (Performance Optimization)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isPlayingRef.current = entry.isIntersecting
        })
      },
      { threshold: 0.05 }
    )
    observer.observe(container)

    // 12. Cleanup
    return () => {
      isDisposed = true
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('touchmove', onTouchMove)
      ro.disconnect()
      observer.disconnect()

      scene.remove(textPoints)
      scene.remove(wavePoints)
      scene.remove(horizonPoints)
      scene.remove(ambientPoints)

      textGeo.dispose()
      textMat.dispose()
      flareGeo.dispose()
      flareMat.dispose()
      waveGeo.dispose()
      waveMat.dispose()
      horizonGeo.dispose()
      horizonMat.dispose()
      ambientGeo.dispose()
      ambientMat.dispose()
      particleTexture.dispose()

      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [fullScreenBackground])

  return (
    <div
      ref={mountRef}
      className={`${
        fullScreenBackground
          ? 'absolute inset-0 h-full w-full overflow-hidden select-none pointer-events-auto z-0'
          : 'w-full relative overflow-hidden select-none rounded-3xl bg-[#020506] border border-[#14383D] shadow-2xl min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] h-full flex flex-col justify-between'
      } ${className}`}
      aria-label="Interactive NetSecure AI particle simulation"
    >
      {/* Interactive Controls Pill (Shown only in standalone card mode, kept clean in fullScreenBackground) */}
      {!fullScreenBackground && (
        <>
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none text-xs font-mono">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#051114]/85 border border-[#1E4950] text-[#99F6E4] backdrop-blur-md shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
              <span className="tracking-wider uppercase text-[10px] font-bold">
                PARTICLE INTELLIGENCE CORE
              </span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-xl bg-[#051114]/85 border border-[#1E4950] text-[#8AA3A8] hover:text-white transition-colors"
                title={isPlaying ? 'Pause Particle Waves' : 'Play Particle Waves'}
                aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[10px] font-mono text-[#8AA3A8]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#051114]/85 border border-[#1E4950] backdrop-blur-md">
              <span className="text-[#10B981] font-bold">7,200+ Nodes</span>
              <span className="text-[#1E4950]">|</span>
              <span className="text-white">Continuous Wave Harmonics</span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#051114]/85 border border-[#1E4950] text-[#8AA3A8] backdrop-blur-md">
              <Sparkles size={11} className="text-[#34D399]" />
              <span>Interactive Pointer Responsive</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
