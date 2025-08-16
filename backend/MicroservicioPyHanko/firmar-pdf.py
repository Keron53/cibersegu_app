#!/usr/bin/env python3
import os
import sys
import traceback

from pyhanko.sign import signers
from pyhanko.sign.signers.pdf_signer import PdfSigner, PdfSignatureMetadata
from pyhanko.sign.fields import SigFieldSpec
from pyhanko.stamp import QRStampStyle
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.pdf_utils.reader import PdfFileReader  # ⬅️ Necesario para explorar campos de firma

# Intento usar PyPDF2 para obtener tamaños/páginas (mejor compatibilidad).
try:
    from PyPDF2 import PdfReader as PyPdfReader
    HAS_PYPDF2 = True
except Exception:
    HAS_PYPDF2 = False

# --- DETECTA EL PRÓXIMO NOMBRE DE CAMPO DE FIRMA DISPONIBLE ---
def next_signature_field_name(pdf_path):
    try:
        with open(pdf_path, 'rb') as f:
            reader = PdfFileReader(f)
            if '/AcroForm' not in reader.root:
                return "Sig1"

            acroform_ref = reader.root['/AcroForm']
            acroform = acroform_ref.get_object()  # 🔧 Resolver referencia indirecta

            fields = acroform.get('/Fields', [])
            sig_fields = []

            for fld_ref in fields:
                fld = fld_ref.get_object()
                if fld.get('/FT') == '/Sig' and fld.get('/T'):
                    sig_fields.append(fld.get('/T'))

            existing = [name for name in sig_fields if name.startswith("Sig")]
            count = len(existing)
            return f"Sig{count + 1}"  # ej: Sig3
    except Exception as e:
        print(">> WARNING al contar campos de firma:", e)
        traceback.print_exc()
        return "Sig1"


# Obtener número de páginas y tamaño de página (en puntos) si es posible
def get_pdf_info(pdf_path):
    """
    Intenta devolver (page_count, page_width_pt, page_height_pt) para la primera página.
    Si no se puede obtener tamaño, devuelve page_count y Nones.
    """
    page_count = None
    pdf_w = None
    pdf_h = None

    if HAS_PYPDF2:
        try:
            reader = PyPdfReader(pdf_path)
            page_count = len(reader.pages)
            # tamaño de la página solicitada (usaremos la primera como referencia)
            try:
                mediabox = reader.pages[0].mediabox
                # PyPDF2 mediabox coords: lower-left x,y and upper-right x,y
                pdf_w = float(mediabox.right) - float(mediabox.left)
                pdf_h = float(mediabox.top) - float(mediabox.bottom)
            except Exception:
                pdf_w = None
                pdf_h = None
            return page_count, pdf_w, pdf_h
        except Exception as e:
            print(">> WARNING: PyPDF2 no pudo leer PDF:", e)
            traceback.print_exc()

    # Fallback a PdfFileReader (pyhanko util)
    try:
        with open(pdf_path, 'rb') as f:
            r = PdfFileReader(f)
            # Intentar contar páginas de forma robusta:
            #  - si existe un /Pages con /Count, leerlo
            if '/Pages' in r.root:
                pages_ref = r.root['/Pages']
                pages_obj = pages_ref.get_object()
                if pages_obj and pages_obj.get('/Count') is not None:
                    page_count = int(pages_obj.get('/Count'))
            # si no pudimos, intentar intentar caminar por la estructura (poco común):
            if page_count is None:
                try:
                    # algunos readers exponen .pages
                    page_count = len(getattr(r, 'pages', []))
                except Exception:
                    page_count = None
            # no intentamos mediabox aquí con PdfFileReader para no complicar la lógica
    except Exception as e:
        print(">> WARNING: PdfFileReader fallback fallo:", e)
        traceback.print_exc()

    return page_count, pdf_w, pdf_h


def firmar_pdf(cert_path, cert_password, pdf_input, pdf_output,
               page_arg, x1_arg, y1_arg, x2_arg, y2_arg, ca_cert_path):
    print(f">> firmar_pdf: cert={cert_path}")
    print(">> Tamaño .p12:", os.path.getsize(cert_path) if os.path.exists(cert_path) else "n/a", "bytes")
    print(f">> CA PEM: {ca_cert_path} (existe? {os.path.exists(ca_cert_path)})")

    # Validar archivo P12
    if not os.path.exists(cert_path):
        print(f">> ERROR: El archivo certificado no existe: {cert_path}")
        sys.exit(1)
    if os.path.getsize(cert_path) == 0:
        print(f">> ERROR: El archivo certificado está vacío: {cert_path}")
        sys.exit(1)

    # Parsear valores numéricos de entrada (coordenadas o fracciones)
    try:
        # page_arg puede venir como string, convertir
        requested_page_raw = int(float(page_arg))
    except Exception:
        print(f">> ERROR: Parámetro 'page' inválido: {page_arg}")
        sys.exit(1)

    def parse_coord(v):
        try:
            return float(v)
        except Exception:
            return None

    x1 = parse_coord(x1_arg)
    y1 = parse_coord(y1_arg)
    x2 = parse_coord(x2_arg)
    y2 = parse_coord(y2_arg)

    print(">> Datos recibidos (raw): page_arg=", requested_page_raw, " x1=", x1, " y1=", y1, " x2=", x2, " y2=", y2)

    # --- Cargar certificado ---
    try:
        print(">> Intentando cargar certificado PKCS#12...")
        signer = signers.SimpleSigner.load_pkcs12(
            pfx_file=cert_path,
            ca_chain_files=[ca_cert_path] if ca_cert_path else None,
            passphrase=(cert_password.encode() if cert_password is not None else None)
        )
        print(">> SimpleSigner.load_pkcs12: OK")

        if signer is None:
            print(">> ERROR: SimpleSigner.load_pkcs12 devolvió None")
            sys.exit(1)

    except ValueError as e:
        print(f">> ERROR cargando P12 (ValueError): {e}")
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f">> ERROR cargando P12: {e}")
        traceback.print_exc()
        sys.exit(1)

    # --- Obtener certificado para QR ---
    try:
        cert = signer.signing_cert
        subj = getattr(cert.subject, 'native', {})
        cn    = subj.get("common_name", "") or ""
        email = subj.get("email_address", "") or ""
        org   = subj.get("organization_name", "") or ""
        qr_data = f"Name: {cn}\nEmail: {email}\nOrganization: {org}"
        print(">> QR data:", repr(qr_data))
    except Exception as e:
        print(f">> WARNING: No se pudieron extraer datos del certificado: {e}")
        qr_data = "Name: Unknown\nEmail: Unknown\nOrganization: Unknown"
        print(">> QR data (fallback):", repr(qr_data))

    style = QRStampStyle()

    try:
        # Antes de ejecutar pyhanko, validamos la página contra el PDF real
        page_count, pdf_w_pt, pdf_h_pt = get_pdf_info(pdf_input)
        print(f">> PDF info: page_count={page_count}, pdf_w_pt={pdf_w_pt}, pdf_h_pt={pdf_h_pt}")

        if page_count is None:
            print(">> WARNING: No se pudo determinar el número de páginas del PDF. Se procederá con la página indicada sin verificación.")
            page_index = requested_page_raw if requested_page_raw >= 0 else 0
        else:
            # Interpretación robusta:
            # - Si frontend envía 1..N (1-based) y cae en rango -> convertir a 0-based
            # - Si frontend envía 0..N-1 (0-based) y cae en rango -> usarlo
            if 1 <= requested_page_raw <= page_count:
                # Probablemente 1-based: convertimos a 0-based
                page_index = requested_page_raw - 1
                print(f">> Interpretado como 1-based. page_index (0-based) = {page_index}")
            elif 0 <= requested_page_raw < page_count:
                # Ya es 0-based
                page_index = requested_page_raw
                print(f">> Interpretado como 0-based. page_index = {page_index}")
            else:
                # Si viene como page_count+1 (posible off-by-one) lo convertimos; sino, error
                if requested_page_raw == page_count + 1:
                    page_index = requested_page_raw - 1
                    print(f">> Ajuste heurístico: convertido page_index = {page_index}")
                else:
                    print(f">> ERROR: Página fuera de rango. recibido={requested_page_raw}, page_count={page_count}")
                    sys.exit(1)

        # Si coordenadas parecen normalizadas (0..1), convertir a puntos PDF
        # Condición simple: si todos están entre 0 y 1 (inclusive), tratamos como fracciones
        coords_are_fractions = all(v is not None and 0.0 <= v <= 1.0 for v in (x1, y1, x2, y2))
        if coords_are_fractions and pdf_w_pt and pdf_h_pt:
            print(">> Coordenadas recibidas como fracciones (0..1). Se convertirán a puntos PDF.")
            # Interpretamos x1,y1,x2,y2 como fracciones relativas al tamaño de la página (top-left origin)
            # Convertimos a puntos: PDF usa origen bottom-left, convertimos Y.
            # x_pt = frac * pdf_w_pt
            x1_pt = x1 * pdf_w_pt
            x2_pt = x2 * pdf_w_pt
            # Y: frontend top-left => y_frac*pdf_h_pt from top. PDF: bottom-left => y_pt = pdf_h_pt - y_frac*pdf_h_pt
            y1_pt = pdf_h_pt - (y1 * pdf_h_pt)
            y2_pt = pdf_h_pt - (y2 * pdf_h_pt)
            # Pero pyhanko espera box as (llx, lly, urx, ury) where ll = lower-left
            llx = min(x1_pt, x2_pt)
            urx = max(x1_pt, x2_pt)
            lly = min(y1_pt, y2_pt)
            ury = max(y1_pt, y2_pt)
            print(f">> Box en pts calculado desde fracciones: ({llx}, {lly}, {urx}, {ury})")
        else:
            # Si no son fracciones, asumimos que los valores ya están en unidades de puntos
            # (o en la misma unidad que pyHanko espera). Hacemos mínimos sanity checks:
            try:
                llx = float(min(x1, x2))
                urx = float(max(x1, x2))
                # Para Y: si provienen con origen top-left (frontend px),
                # intentamos *invertir* Y si tenemos pdf_h_pt disponible AND y parecen estar en un rango similar a la altura.
                if pdf_h_pt and all(v is not None for v in (y1, y2)):
                    # Heurística: si y valores son mayores que pdf_h_pt/2, probablemente ya estén en puntos bottom-left
                    # Si parecen ser coordenadas top-left (por ejemplo, y aproximadamente menor que pdf_h_pt),
                    # asumimos formato top-left y convertimos.
                    y1f = float(y1)
                    y2f = float(y2)
                    # Caso A: y values likely top-left (smaller numbers near top) => convert
                    # We'll convert using pdf_h_pt if the max(y) <= pdf_h_pt * 1.2 (heurístico)
                    if max(y1f, y2f) <= (pdf_h_pt * 1.2):
                        # y from top -> to bottom-left
                        y1_pt = pdf_h_pt - y1f
                        y2_pt = pdf_h_pt - y2f
                        lly = min(y1_pt, y2_pt)
                        ury = max(y1_pt, y2_pt)
                        print(">> Heurística: invertimos Y (top-left -> bottom-left) usando pdf_h_pt.")
                    else:
                        # asumir ya en coordenadas PDF
                        lly = float(min(y1, y2))
                        ury = float(max(y1, y2))
                        print(">> Heurística: dejamos Y tal cual (probablemente ya en points).")
                else:
                    # no hay pdf_h_pt para convertir, usar valores tal cual
                    lly = float(min(y1, y2)) if (y1 is not None and y2 is not None) else 0.0
                    ury = float(max(y1, y2)) if (y1 is not None and y2 is not None) else 0.0
                    print(">> No se dispone de pdf_h_pt; usando coordenadas Y originales.")
            except Exception:
                print(">> ERROR parseando coordenadas numéricas. Asegúrate que x1,y1,x2,y2 sean numéricos.")
                traceback.print_exc()
                sys.exit(1)

        print(f">> Coordenadas finales (llx,lly,urx,ury): ({llx}, {lly}, {urx}, {ury})")
        print(f">> Usando page_index (0-based) = {page_index} (page_count={page_count})")

        # Abrir archivos y firmar
        with open(pdf_input, "rb") as inf, open(pdf_output, "wb") as outf:
            w = IncrementalPdfFileWriter(inf, strict=False)
            print(">> PDF entrada:", pdf_input, "tamaño:", os.path.getsize(pdf_input), "bytes")

            # Obtener nombre de campo de firma disponible
            field_name = next_signature_field_name(pdf_input)
            print(f">> Campo de firma usado: {field_name}")

            meta = PdfSignatureMetadata(field_name=field_name)
            is_solicitud_firma = field_name != "Sig1"
            print(f">> Es solicitud de firma: {is_solicitud_firma}")

            # Si quieres forzar boxes distintos para solicitudes, mantenemos tu heurística
            if is_solicitud_firma:
                # Si aplicaste conversiones previamente, puedes sobrescribir aquí si lo deseas.
                pass

            pdf_signer = PdfSigner(
                signature_meta=meta,
                signer=signer,
                stamp_style=style,
                new_field_spec=SigFieldSpec(
                    sig_field_name=field_name,
                    on_page=int(page_index),  # page_index debe ser 0-based
                    box=(float(llx), float(lly), float(urx), float(ury))
                )
            )

            pdf_signer.sign_pdf(
                w, output=outf,
                appearance_text_params={"url": qr_data}
            )

        print(">> PDF firmado escrito:", pdf_output, "tamaño:", os.path.getsize(pdf_output), "bytes")
        try:
            with open(pdf_output, "rb") as f:
                print(">> Cabecera firmada:", f.read(8))
        except Exception:
            pass

    except Exception as e:
        print(">> ERROR firmando PDF:", e)
        traceback.print_exc()
        sys.exit(1)


# --- CONVERTIR COORDENADAS PIXELES → PUNTOS (función utilitaria si la quieres) ---
def px_to_pt(x_px, y_px, width_px, height_px, canvas_width, canvas_height, pdf_width_pt, pdf_height_pt):
    x_pt = x_px * pdf_width_pt / canvas_width
    y_pt = pdf_height_pt - (y_px * pdf_height_pt / canvas_height)  # invertir eje Y
    return x_pt, y_pt


if __name__ == "__main__":
    # ahora aceptamos 11 argumentos como antes: cert, password, input, output, page, x1, y1, x2, y2, ca_pem
    if len(sys.argv) != 11:
        print("Uso: python firmar-pdf.py cert.p12 password input.pdf output.pdf page x1 y1 x2 y2 ca_cert.pem")
        print(" - page puede ser 0-based (0..N-1) o 1-based (1..N).")
        print(" - x1,y1,x2,y2 pueden ser fracciones (0..1) relativas a la página o valores en puntos.")
        sys.exit(1)
    _, cert_path, cert_password, pdf_input, pdf_output, page, x1, y1, x2, y2, ca_cert_path = sys.argv
    firmar_pdf(cert_path, cert_password, pdf_input, pdf_output, page, x1, y1, x2, y2, ca_cert_path)
    print(">> Exit OK")
    sys.exit(0)
