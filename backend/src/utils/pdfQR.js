const { PDFDocument } = require('pdf-lib');
const { execSync } = require('child_process');
const fs = require('fs');
const tmp = require('tmp');

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
  // Reparar el PDF con qpdf para asegurar compatibilidad con node-signpdf
  return repairPdfWithQpdf(buffer);
}

function repairPdfWithQpdf(pdfBuffer) {
  const input = tmp.tmpNameSync({ postfix: '.pdf' });
  const output = tmp.tmpNameSync({ postfix: '.pdf' });
  fs.writeFileSync(input, pdfBuffer);
  execSync(`qpdf --linearize "${input}" "${output}"`);
  const repairedBuffer = fs.readFileSync(output);
  fs.unlinkSync(input);
  fs.unlinkSync(output);
  return repairedBuffer;
}

module.exports = { addQRToPDF }; 