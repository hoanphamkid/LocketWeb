import { useEffect, useRef, useState } from 'react'

export default function CameraRecordingProgress({ progress }) {
  const svg = useRef(null)
  const [frame, setFrame] = useState(null)
  const value = Math.max(0, Math.min(100, progress))

  useEffect(() => {
    const preview = svg.current.parentElement
    const measure = () => {
      const { width, height } = preview.getBoundingClientRect()
      const radius = Number.parseFloat(getComputedStyle(preview).borderTopLeftRadius) || 0
      setFrame({ width, height, radius })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(preview)
    return () => observer.disconnect()
  }, [])

  const inset = 4
  const width = frame?.width || 1
  const height = frame?.height || 1
  const radius = Math.max(0, Math.min(frame?.radius || 0, width / 2, height / 2) - inset)
  const right = width - inset
  const bottom = height - inset
  // Start at the top center and follow the camera's actual rounded perimeter.
  const path = frame ? `M ${width / 2} ${inset} H ${right - radius}
    A ${radius} ${radius} 0 0 1 ${right} ${inset + radius} V ${bottom - radius}
    A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom} H ${inset + radius}
    A ${radius} ${radius} 0 0 1 ${inset} ${bottom - radius} V ${inset + radius}
    A ${radius} ${radius} 0 0 1 ${inset + radius} ${inset} Z` : ''

  return <svg ref={svg} className="camera-recording-ring" viewBox={`0 0 ${width} ${height}`}
    role="progressbar" aria-label="Tiến trình quay video" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
    {frame && <>
      <path className="camera-recording-track" d={path} fill="none" strokeWidth="5" />
      <path className="camera-recording-progress" d={path} pathLength="100" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray="100" strokeDashoffset={100 - value} />
    </>}
  </svg>
}
