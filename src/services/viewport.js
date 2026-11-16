export function installViewportGuards() {
  const preventZoom = (event) => {
    if (event.cancelable) event.preventDefault()
  }
  const preventPinch = (event) => {
    if (event.touches.length > 1) preventZoom(event)
  }
  const preventWheelZoom = (event) => {
    if (event.ctrlKey) preventZoom(event)
  }
  const listeners = [
    ['gesturestart', preventZoom],
    ['gesturechange', preventZoom],
    ['gestureend', preventZoom],
    ['touchmove', preventPinch],
    ['wheel', preventWheelZoom],
  ]
  for (const [type, handler] of listeners) document.addEventListener(type, handler, { passive: false })
  return () => {
    for (const [type, handler] of listeners) document.removeEventListener(type, handler)
  }
}
