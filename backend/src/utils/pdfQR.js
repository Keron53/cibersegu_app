const { PDFDocument } = require('pdf-lib');

async function addQRToPDF(pdfBuffer, qrBase64, x = 50, y = 50, width = 100, height = 100) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const base64 = qrBase64.replace(/^data:image\/png;base64,/, '');
  const pngImage = await pdfDoc.embedPng(Buffer.from(base64, 'base64'));
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  firstPage.drawImage(pngImage, { x, y, width, height });
  // Convierte el Uint8Array a Buffer antes de devolver
  const uint8Array = await pdfDoc.save();
  const buffer = Buffer.from(uint8Array);
  return buffer;
}

module.exports = { addQRToPDF }; 