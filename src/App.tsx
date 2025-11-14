import React, { CSSProperties, useRef, useState } from 'react'
import './App.css'
import { IButtonConfig } from './vite-env'

const DEFAULT_STYLE: CSSProperties = {
  width: '80%',
  height: '90%',
  border: 'none',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  margin: 'auto',
  boxShadow: '0 0 #000, 0 0 #000, 0 25px 50px -12px rgba(0, 0, 0, .25)',
}

const App: React.FC<{ btnKey: string }> = ({ btnKey }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [containerStyle, setContainerStyle] = useState<CSSProperties>(DEFAULT_STYLE)
  
  // Use refs to track positions without triggering re-renders
  const startPosRef = useRef({ x: 0, y: 0 })
  const startOffsetRef = useRef({ top: 0, left: 0 })
  const currentStyleRef = useRef<CSSProperties>(DEFAULT_STYLE)

  const curBtnConfig: IButtonConfig = logseq.settings?.buttons?.find((_config: IButtonConfig) => _config.key === btnKey)

  const handleReload = () => {
    console.log('[faiz:] === Reloading')
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startPosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseDownMove = (e: React.MouseEvent) => {
    // Solo permitir mover si el click no fue en un botón
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      return
    }
    e.preventDefault()
    setIsMoving(true)
    startPosRef.current = { x: e.clientX, y: e.clientY }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      startOffsetRef.current = { 
        top: rect.top, 
        left: rect.left 
      }
    }
  }

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      if (isResizing) {
        const deltaX = e.clientX - startPosRef.current.x
        const deltaY = e.clientY - startPosRef.current.y

        const newStyle = {
          ...currentStyleRef.current,
          width: `${Math.max(300, (parseFloat(currentStyleRef.current.width as string) || 800) + deltaX)}px`,
          height: `${Math.max(200, (parseFloat(currentStyleRef.current.height as string) || 600) + deltaY)}px`,
          left: 'auto',
          right: 'auto',
          top: 'auto',
          bottom: 'auto',
        }
        
        currentStyleRef.current = newStyle
        setContainerStyle(newStyle)
        startPosRef.current = { x: e.clientX, y: e.clientY }
      }

      if (isMoving) {
        const deltaX = e.clientX - startPosRef.current.x
        const deltaY = e.clientY - startPosRef.current.y

        const newStyle = {
          ...currentStyleRef.current,
          top: `${startOffsetRef.current.top + deltaY}px`,
          left: `${startOffsetRef.current.left + deltaX}px`,
          right: 'auto',
          bottom: 'auto',
          margin: 0,
        }
        
        currentStyleRef.current = newStyle
        containerRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`
      }
    }

    const handleMouseUp = () => {
      if (isMoving && containerRef.current) {
        // Persist the final position
        const style = currentStyleRef.current
        setContainerStyle(style)
        containerRef.current.style.transform = 'none'
      }
      setIsResizing(false)
      setIsMoving(false)
    }

    if (isResizing || isMoving) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, isMoving])

  const finalStyle: CSSProperties = curBtnConfig?.style 
    ? { ...DEFAULT_STYLE, ...curBtnConfig.style }
    : containerStyle

  return (
    <>
      <div className="mask" onClick={() => logseq.hideMainUI()}></div>
      <div ref={containerRef} style={{ ...finalStyle, display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
        {/* Navigation Bar - Draggable */}
        <div 
          style={navBarStyle}
          onMouseDown={handleMouseDownMove}
          title="Drag to move window"
        >
          <button 
            style={buttonStyle}
            onClick={(e) => {
              e.stopPropagation()
              handleReload()
            }}
            title="Reload"
          >
            ↻
          </button>
          <div style={{ flex: 1 }} />
        </div>

        {/* IFrame Container */}
        <div style={iframeContainerStyle}>
          <iframe 
            ref={iframeRef}
            className="iframe" 
            src={curBtnConfig.href}
            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: isMoving ? 'none' : 'auto' }}
          />
        </div>

        {/* Resize Handle */}
        <div 
          style={resizeHandleStyle}
          onMouseDown={handleMouseDownResize}
          title="Drag to resize window"
        />
      </div>
    </>
  )
}

const navBarStyle: CSSProperties = {
  display: 'flex',
  gap: '4px',
  padding: '6px',
  backgroundColor: '#333',
  borderBottom: '1px solid #222',
  alignItems: 'center',
  flexShrink: 0,
  cursor: 'grab',
}

const buttonStyle: CSSProperties = {
  padding: '3px 6px',
  backgroundColor: '#555',
  border: '1px solid #444',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500,
  transition: 'all 0.2s',
  minWidth: '24px',
  color: '#fff',
}

const iframeContainerStyle: CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  position: 'relative',
}

const resizeHandleStyle: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: '20px',
  height: '20px',
  backgroundColor: '#1890ff',
  cursor: 'se-resize',
  opacity: 0.5,
  transition: 'opacity 0.2s',
}

export default App
