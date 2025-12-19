import React, { useRef, useEffect, memo } from 'react'

const CanvasWheel = memo(({ names, colors, rotation, width = 800, height = 800, centerImage = null, centerImageSize = 'M' }) => {
    const canvasRef = useRef(null)
    const centerImageLoadedRef = useRef(null)
    const rotationRef = useRef(rotation)
    const animationFrameRef = useRef(null)
    const staticWheelCanvasRef = useRef(null) // Offscreen canvas for static wheel
    const needsRedrawRef = useRef(true) // Track if static wheel needs to be redrawn

    // Update rotation ref without triggering re-render
    useEffect(() => {
        rotationRef.current = rotation
    }, [rotation])

    // Setup canvas and static wheel (only when names/colors change, NOT rotation)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Use optimized context settings for smooth animation
        const ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true, // Better performance for animations
            willReadFrequently: false,
            powerPreference: 'high-performance' // Use dedicated GPU if available
        })

        // Create offscreen canvas for static wheel (wheel without rotation)
        const staticCanvas = document.createElement('canvas')
        staticWheelCanvasRef.current = staticCanvas
        const staticCtx = staticCanvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false,
            powerPreference: 'high-performance'
        })

        // Reduce DPR for many entries to improve performance
        const baseDpr = window.devicePixelRatio || 1
        const dpr = names.length > 2000 ? Math.min(baseDpr, 1.5) : baseDpr

        let canvasWidth = width
        let canvasHeight = height
        let centerX = width / 2
        let centerY = height / 2
        let radius = Math.min(centerX, centerY) - 20

        // Setup canvas size
        const setupCanvas = () => {
            const displayWidth = canvas.clientWidth || width
            const displayHeight = canvas.clientHeight || height

            canvasWidth = displayWidth
            canvasHeight = displayHeight
            centerX = displayWidth / 2
            centerY = displayHeight / 2
            radius = Math.min(centerX, centerY) - 20

            // Set actual size in memory (scaled to account for extra pixel density)
            // Setting width/height resets the context, so we need to reapply settings
            canvas.width = displayWidth * dpr
            canvas.height = displayHeight * dpr
            staticCanvas.width = displayWidth * dpr
            staticCanvas.height = displayHeight * dpr

            // Normalize coordinate system to use css pixels
            ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
            ctx.scale(dpr, dpr)
            staticCtx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
            staticCtx.scale(dpr, dpr)
            
            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = names.length > 1000 ? 'medium' : 'high'
            staticCtx.imageSmoothingEnabled = true
            staticCtx.imageSmoothingQuality = names.length > 1000 ? 'medium' : 'high'

            needsRedrawRef.current = true
        }

        // Throttle resize for better performance with many entries
        let resizeTimeout = null
        const handleResize = () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout)
            }
            
            const throttleDelay = names.length > 5000 ? 100 : names.length > 2000 ? 50 : 0
            
            resizeTimeout = setTimeout(() => {
                setupCanvas()
                drawStaticWheel()
                drawWheel()
            }, throttleDelay)
        }

        const resizeObserver = new ResizeObserver(() => {
            handleResize()
        })
        resizeObserver.observe(canvas)

        // Draw static wheel (without rotation) to offscreen canvas
        const drawStaticWheel = () => {
            if (!staticWheelCanvasRef.current) return

            // Clear static canvas - use CSS pixel dimensions (context is already scaled)
            staticCtx.clearRect(0, 0, canvasWidth, canvasHeight)

            const numSegments = names.length
            const sliceAngle = (2 * Math.PI) / numSegments

            const isManyEntries = names.length > 2000
            const isVeryManyEntries = names.length > 5000
            
            if (isVeryManyEntries) {
                staticCtx.imageSmoothingEnabled = false
            }

            // Draw Shadow (behind the wheel) - Skip for many entries for performance
            if (names.length < 2000) {
                staticCtx.save()
                staticCtx.shadowColor = 'rgba(0, 0, 0, 0.3)'
                staticCtx.shadowBlur = 15
                staticCtx.shadowOffsetY = 10
                staticCtx.beginPath()
                staticCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
                staticCtx.fillStyle = 'rgba(0,0,0,0)'
                staticCtx.fill()
                staticCtx.restore()
            }

            const shouldShowText = names.length < 500
            const shouldDrawGradient = names.length < 300
            const shouldDrawStrokes = names.length < 500
            const minSliceAngleForText = names.length > 500 ? 0.01 : 0.001

            // Use Path2D for better performance with many segments
            const segmentPaths = []
            
            // Batch create paths first
            for (let index = 0; index < names.length; index++) {
                const startAngle = index * sliceAngle - Math.PI / 2
                const endAngle = startAngle + sliceAngle
                
                const path = new Path2D()
                path.moveTo(centerX, centerY)
                path.arc(centerX, centerY, radius, startAngle, endAngle)
                path.closePath()
                segmentPaths.push({ path, index, startAngle, endAngle })
            }

            // Draw all segments
            segmentPaths.forEach(({ path, index }) => {
                staticCtx.fillStyle = colors[index % colors.length]
                staticCtx.fill(path)

                // Add gradient (skip for large lists)
                if (shouldDrawGradient && !isManyEntries) {
                    const gradient = staticCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
                    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0)')
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)')
                    staticCtx.fillStyle = gradient
                    staticCtx.fill(path)
                }

                // Draw strokes
                if (shouldDrawStrokes) {
                    const strokeWidth = names.length > 500 ? 0.5 : 1
                    staticCtx.lineWidth = strokeWidth
                    staticCtx.strokeStyle = names.length > 500 ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)'
                    staticCtx.stroke(path)
                }
            })

            // Draw text (only if needed)
            if (shouldShowText && sliceAngle >= minSliceAngleForText) {
                segmentPaths.forEach(({ index, startAngle }) => {
                    const name = names[index]
                    const midAngle = startAngle + sliceAngle / 2
                    
                    staticCtx.save()
                    staticCtx.translate(centerX, centerY)
                    staticCtx.rotate(midAngle)

                    staticCtx.textAlign = 'right'
                    staticCtx.textBaseline = 'middle'

                    const bgColor = colors[index % colors.length]
                    staticCtx.fillStyle = (bgColor === '#efb71d' || bgColor === '#24a643') ? '#000000' : '#FFFFFF'

                    const textRadius = radius - 20
                    const arcLength = textRadius * sliceAngle
                    const isMobile = window.innerWidth < 768
                    let computedSize = arcLength / (isMobile ? 4.5 : 6)
                    const minSize = isMobile ? 8 : 10
                    const maxSize = isMobile ? 42 : 40
                    let fontSize = Math.max(minSize, Math.min(maxSize, computedSize))

                    staticCtx.font = `500 ${fontSize}px "Montserrat", sans-serif`
                    staticCtx.shadowColor = 'rgba(0,0,0,0.2)'
                    staticCtx.shadowBlur = 2
                    staticCtx.shadowOffsetX = 1
                    staticCtx.shadowOffsetY = 1

                    let displayName = name
                    if (names.length > 500 && name.length > 10) {
                        displayName = name.substring(0, 10) + '...'
                    }

                    staticCtx.fillText(displayName, radius - 25, 0)
                    staticCtx.restore()
                })
            }

            // Draw Center Hub (static, no image rotation)
            const isMobile = window.innerWidth < 768
            const hubRadius = isMobile ? 35 : 70

            staticCtx.beginPath()
            staticCtx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI)
            staticCtx.fillStyle = 'white'
            staticCtx.shadowColor = 'rgba(0,0,0,0.2)'
            staticCtx.shadowBlur = 5
            staticCtx.fill()

            needsRedrawRef.current = false
        }

        // Draw wheel with rotation (composite static wheel + rotation)
        const drawWheel = () => {
            // Ensure we have valid dimensions
            if (canvasWidth <= 0 || canvasHeight <= 0) {
                return
            }
            
            // Clear canvas
            ctx.clearRect(0, 0, canvasWidth, canvasHeight)

            // Draw static wheel with rotation
            // The rotation value represents clockwise rotation in degrees
            // Canvas rotate() rotates the coordinate system counter-clockwise for positive angles
            // This makes objects drawn appear to rotate clockwise, which matches the calculation
            // The calculation assumes: "When wheel rotates clockwise by R, what was at angle A is now at (A - R)"
            // After rotating coordinate system counter-clockwise by R, a point originally at angle A appears at (A - R)
            ctx.save()
            ctx.translate(centerX, centerY)
            ctx.rotate((rotationRef.current * Math.PI) / 180)
            ctx.translate(-centerX, -centerY)
            
            // Draw the static wheel from offscreen canvas
            // The static canvas has internal dimensions (canvasWidth * dpr, canvasHeight * dpr)
            // The main canvas context is scaled by dpr, so we draw at CSS pixel dimensions
            // Draw the full static canvas using its actual internal dimensions as source
            if (staticWheelCanvasRef.current && staticWheelCanvasRef.current.width > 0 && staticWheelCanvasRef.current.height > 0) {
                // Source: full static canvas (canvasWidth * dpr x canvasHeight * dpr)
                // Destination: CSS pixel dimensions (canvasWidth x canvasHeight) - context handles DPR scaling
                ctx.drawImage(
                    staticWheelCanvasRef.current,
                    0, 0, staticWheelCanvasRef.current.width, staticWheelCanvasRef.current.height, // Source: full canvas
                    0, 0, canvasWidth, canvasHeight // Destination: CSS pixels (context is scaled)
                )
            } else {
                // If static canvas not ready, draw directly (fallback)
                needsRedrawRef.current = true
                drawStaticWheel()
                if (staticWheelCanvasRef.current && staticWheelCanvasRef.current.width > 0) {
                    ctx.drawImage(staticWheelCanvasRef.current, 0, 0, canvasWidth, canvasHeight)
                }
            }
            
            // Draw center image with rotation (if provided)
            if (centerImageLoadedRef.current && 
                centerImageLoadedRef.current.complete && 
                centerImageLoadedRef.current.naturalWidth > 0) {
                try {
                    const isMobile = window.innerWidth < 768
                    const hubRadius = isMobile ? 35 : 70
                    
                    let imageRadius
                    if (centerImageSize === 'S') {
                        imageRadius = hubRadius * 0.7
                    } else if (centerImageSize === 'L') {
                        imageRadius = hubRadius * 1.3
                    } else {
                        imageRadius = hubRadius * 1.0
                    }
                    
                    ctx.save()
                    ctx.beginPath()
                    ctx.arc(centerX, centerY, imageRadius, 0, 2 * Math.PI)
                    ctx.clip()
                    ctx.drawImage(
                        centerImageLoadedRef.current, 
                        centerX - imageRadius, 
                        centerY - imageRadius, 
                        imageRadius * 2, 
                        imageRadius * 2
                    )
                    ctx.restore()
                } catch (error) {
                    console.error('Error drawing center image:', error)
                }
            }

            ctx.restore()
        }

        // Animation loop - continuously redraw with current rotation
        // Always draw to ensure visibility - the performance optimization is in the static wheel caching
        const animate = () => {
            drawWheel()
            animationFrameRef.current = requestAnimationFrame(animate)
        }

        // Load center image when it changes
        if (centerImage) {
            if (!centerImageLoadedRef.current || centerImageLoadedRef.current.src !== centerImage) {
                const img = new Image()
                img.crossOrigin = 'anonymous'
                img.onload = () => {
                    centerImageLoadedRef.current = img
                    drawStaticWheel()
                    drawWheel()
                }
                img.onerror = (error) => {
                    console.error('Failed to load center image:', centerImage, error)
                    centerImageLoadedRef.current = null
                }
                if (typeof centerImage === 'string') {
                    img.src = centerImage
                }
            }
        } else {
            centerImageLoadedRef.current = null
        }

        // Initial setup - use requestAnimationFrame to ensure canvas is ready
        const initialize = () => {
            const displayWidth = canvas.clientWidth || width
            const displayHeight = canvas.clientHeight || height
            
            if (displayWidth > 0 && displayHeight > 0) {
                setupCanvas()
                drawStaticWheel()
                // Draw immediately to ensure visibility
                drawWheel()
                // Start animation loop
                animationFrameRef.current = requestAnimationFrame(animate)
            } else {
                // Canvas not ready yet, try again next frame
                animationFrameRef.current = requestAnimationFrame(initialize)
            }
        }
        
        // Start initialization
        animationFrameRef.current = requestAnimationFrame(initialize)

        return () => {
            resizeObserver.disconnect()
            if (resizeTimeout) {
                clearTimeout(resizeTimeout)
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
        }
    }, [names, colors, width, height, centerImage, centerImageSize]) // Removed rotation from dependencies

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: '100%',
                height: '100%',
                touchAction: 'none'
            }}
        />
    )
})

CanvasWheel.displayName = 'CanvasWheel'

export default CanvasWheel
