import React from 'react'

function QRCodeGenerator({ data, size = 200 }) {
  // Función para generar código QR usando una librería externa
  // Por ahora usamos un placeholder, pero se puede integrar con qrcode.js o similar
  
  const generateQRCode = (data) => {
    // Aquí se generaría el código QR real
    // Por ahora retornamos un placeholder
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
        <span className="text-gray-500 dark:text-gray-400 text-sm">Sin datos</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
      <img 
        src={generateQRCode(data)} 
        alt="Código QR de Firma Digital"
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