const fs = require('fs');
const { plainAddPlaceholder, sign } = require('node-signpdf');
const signer = require('node-signpdf').default;

/**
 * Firma un PDF usando un certificado .p12
 * @param {Buffer} pdfBuffer - El PDF a firmar
 * @param {Buffer} p12Buffer - El certificado .p12
 * @param {string} passphrase - Contraseña del .p12
 * @returns {Buffer} - El PDF firmado
 */
function signPDF(pdfBuffer, p12Buffer, passphrase) {
    // Añade un placeholder de firma
    const pdfWithPlaceholder = plainAddPlaceholder({
        pdfBuffer,
        reason: 'Firmado digitalmente',
        signatureLength: 8192,
    });

    // Firma el PDF
    const signedPdf = signer.sign(pdfWithPlaceholder, p12Buffer, { passphrase });
    return signedPdf;
}

module.exports = { signPDF };
