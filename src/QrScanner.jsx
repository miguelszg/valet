import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Camera, CameraOff, RefreshCw } from 'lucide-react'

// Escáner de QR con la cámara real. Llama onScan(texto) cuando lee un código.
// Requiere HTTPS (o localhost) para que el navegador permita la cámara.
export default function QrScanner({ onScan }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const onScanRef = useRef(onScan)
  const [on, setOn] = useState(true)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => { onScanRef.current = onScan }, [onScan])

  useEffect(() => {
    if (!on) return
    let stream = null
    let raf = 0
    let stopped = false
    let last = { text: '', at: 0 }
    let lastTick = 0

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const v = videoRef.current
      if (!v || v.readyState < 2 || now - lastTick < 120) return // ~8 lecturas por segundo
      lastTick = now
      const scale = Math.min(1, 640 / v.videoWidth)
      const w = Math.round(v.videoWidth * scale)
      const h = Math.round(v.videoHeight * scale)
      const c = canvasRef.current
      c.width = w; c.height = h
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(v, 0, 0, w, h)
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'attemptBoth' })
      if (code?.data && (code.data !== last.text || now - last.at > 2500)) {
        last = { text: code.data, at: now }
        if (navigator.vibrate) navigator.vibrate(60)
        onScanRef.current(code.data)
      }
    }

    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Este navegador o conexión no permite usar la cámara. Abre la app con HTTPS.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false,
        })
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return }
        const v = videoRef.current
        v.srcObject = stream
        await v.play()
        setReady(true); setError('')
        raf = requestAnimationFrame(tick)
      } catch (e) {
        setError(
          e.name === 'NotAllowedError' ? 'Permiso de cámara denegado. Actívalo en los ajustes del navegador.'
          : e.name === 'NotFoundError' ? 'No se encontró ninguna cámara en este dispositivo.'
          : 'No se pudo abrir la cámara.',
        )
      }
    })()

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      setReady(false)
    }
  }, [on])

  return (
    <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-cesba/50 bg-black">
      <video ref={videoRef} muted playsInline className={`absolute inset-0 h-full w-full object-cover ${ready ? '' : 'hidden'}`} />
      <canvas ref={canvasRef} className="hidden" />

      {!on && <p className="text-xs font-bold text-white/60">Cámara apagada</p>}
      {on && !ready && !error && <p className="animate-pulse text-xs font-bold text-white/60">Abriendo cámara…</p>}
      {error && <p className="px-6 text-center text-xs font-bold text-red-300">{error}</p>}

      {ready && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-cesba/80 shadow-[0_0_0_999px_rgba(0,0,0,.35)]" />
      )}

      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        className="absolute bottom-3 z-10 flex items-center gap-1.5 rounded-lg border border-white/20 bg-navy/80 px-3 py-1.5 text-xs font-bold text-white"
      >
        {error ? <RefreshCw className="size-4 text-cesba" /> : on ? <CameraOff className="size-4 text-cesba" /> : <Camera className="size-4 text-cesba" />}
        {error ? 'Reintentar' : on ? 'Apagar cámara' : 'Encender cámara'}
      </button>
    </div>
  )
}
