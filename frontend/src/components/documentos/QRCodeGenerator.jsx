import React, { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

function QRCodeGenerator({ data, size = 200 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (data && canvasRef.current) {
      // Generar QR localmente usando la librería qrcode
      QRCode.toCanvas(canvasRef.current, JSON.stringify(data), {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('Error generando QR:', error)
        }
      })
    }
  }, [data, size])

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
        <span className="text-gray-500 dark:text-gray-400 text-sm">Sin datos</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
      <canvas 
        ref={canvasRef}
        className="w-full h-auto max-w-full"
        style={{ maxWidth: `${size}px`, maxHeight: `${size}px` }}
      />
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Escanear para validar
        </p>
      </div>
    </div>
  )
}

export default QRCodeGenerator 