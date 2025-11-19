#!/usr/bin/env python3
"""
Servidor Python simple para LasaCam
Maneja subida y listado de fotos sin dependencias externas.

Uso:
    python server.py

El servidor escuchará en el puerto especificado por la variable de entorno PORT
o en el puerto 5000 por defecto.
"""

import os
import sys
import json
import cgi
import cgitb
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path
from datetime import datetime

# Configuración
UPLOAD_DIR = Path(__file__).parent / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
PORT = int(os.environ.get('PORT', 5000))


class LasaCamHandler(BaseHTTPRequestHandler):
    """Handler personalizado para manejar las peticiones de LasaCam."""

    def _set_cors_headers(self):
        """Establece los headers CORS necesarios."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _send_json_response(self, data, status_code=200):
        """Envía una respuesta JSON."""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def _send_error(self, message, status_code=400):
        """Envía un error en formato JSON."""
        self._send_json_response({'error': message}, status_code)

    def do_OPTIONS(self):
        """Maneja peticiones OPTIONS para CORS."""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Maneja peticiones GET."""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Servir archivos de uploads
        if path.startswith('/uploads/'):
            self._serve_upload_file(path)
        # Listar fotos
        elif path == '/api/photos':
            self._handle_list_photos()
        else:
            self._send_error('Ruta no encontrada', 404)

    def do_POST(self):
        """Maneja peticiones POST."""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path == '/api/upload':
            self._handle_upload()
        else:
            self._send_error('Ruta no encontrada', 404)

    def _serve_upload_file(self, path):
        """Sirve un archivo de la carpeta uploads."""
        try:
            # Extraer el nombre del archivo de la ruta
            filename = path.replace('/uploads/', '')
            file_path = UPLOAD_DIR / filename

            if not file_path.exists() or not file_path.is_file():
                self._send_error('Archivo no encontrado', 404)
                return

            # Determinar content-type basado en extensión
            ext = file_path.suffix.lower()
            content_types = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            }
            content_type = content_types.get(ext, 'application/octet-stream')

            # Leer y enviar el archivo
            with open(file_path, 'rb') as f:
                file_data = f.read()

            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(file_data)))
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(file_data)

        except Exception as e:
            self._send_error(f'Error al servir archivo: {str(e)}', 500)

    def _handle_upload(self):
        """Maneja la subida de una foto."""
        try:
            # Verificar content-type
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self._send_error('Content-Type debe ser multipart/form-data', 400)
                return

            # Leer el contenido
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_error('No se recibió ningún archivo', 400)
                return

            if content_length > MAX_FILE_SIZE:
                self._send_error(f'Archivo muy grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB', 400)
                return

            # Parsear el formulario multipart
            post_data = self.rfile.read(content_length)
            
            # Crear un objeto FieldStorage para parsear multipart
            # Necesitamos crear un archivo temporal o usar StringIO
            import io
            from email import message_from_bytes
            from email.message import EmailMessage
            
            # Crear un mensaje email para parsear multipart
            msg = EmailMessage()
            msg['Content-Type'] = content_type
            msg.set_payload(post_data)
            
            # Parsear manualmente el multipart
            boundary = content_type.split('boundary=')[1]
            parts = post_data.split(b'--' + boundary.encode())
            
            file_data = None
            filename = None
            
            for part in parts:
                if b'Content-Disposition: form-data' in part:
                    # Buscar el nombre del campo
                    if b'name="photo"' in part:
                        # Extraer el nombre del archivo
                        if b'filename=' in part:
                            filename_line = [l for l in part.split(b'\r\n') if b'filename=' in l][0]
                            filename = filename_line.decode('utf-8', errors='ignore').split('filename=')[1].strip('"')
                        
                        # Extraer los datos del archivo (después de la línea en blanco)
                        file_start = part.find(b'\r\n\r\n') + 4
                        file_end = part.rfind(b'\r\n')
                        if file_end > file_start:
                            file_data = part[file_start:file_end]
            
            if not file_data or not filename:
                self._send_error('No se encontró el archivo "photo" en la petición', 400)
                return

            # Validar extensión
            file_ext = Path(filename).suffix.lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                self._send_error(f'Extensión no permitida. Use: {", ".join(ALLOWED_EXTENSIONS)}', 400)
                return

            # Validar tamaño
            if len(file_data) > MAX_FILE_SIZE:
                self._send_error(f'Archivo muy grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB', 400)
                return

            # Generar nombre único
            timestamp = int(datetime.now().timestamp() * 1000)
            unique_filename = f'lasacam-{timestamp}-{os.urandom(4).hex()}{file_ext}'
            file_path = UPLOAD_DIR / unique_filename

            # Guardar archivo
            with open(file_path, 'wb') as f:
                f.write(file_data)

            # Construir URL
            host = self.headers.get('Host', 'localhost')
            protocol = 'https' if self.headers.get('X-Forwarded-Proto') == 'https' else 'http'
            file_url = f"{protocol}://{host}/uploads/{unique_filename}"

            self._send_json_response({
                'message': 'Foto subida con éxito',
                'filename': unique_filename,
                'url': file_url
            }, 200)

        except Exception as e:
            import traceback
            error_msg = f'Error al subir foto: {str(e)}'
            print(f"Error: {error_msg}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            self._send_error(error_msg, 500)

    def _handle_list_photos(self):
        """Lista todas las fotos subidas."""
        try:
            photos = []

            if UPLOAD_DIR.exists():
                # Obtener el host
                host = self.headers.get('Host', 'localhost')
                protocol = 'https' if self.headers.get('X-Forwarded-Proto') == 'https' else 'http'

                # Listar archivos ordenados por fecha (más recientes primero)
                files = list(UPLOAD_DIR.glob('*'))
                files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

                for file_path in files:
                    if file_path.is_file() and file_path.suffix.lower() in ALLOWED_EXTENSIONS:
                        photos.append({
                            'filename': file_path.name,
                            'url': f"{protocol}://{host}/uploads/{file_path.name}"
                        })

            self._send_json_response(photos, 200)

        except Exception as e:
            import traceback
            error_msg = f'Error al listar fotos: {str(e)}'
            print(f"Error: {error_msg}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            self._send_error(error_msg, 500)

    def log_message(self, format, *args):
        """Override para personalizar los logs."""
        # Solo loguear errores importantes
        if '404' not in str(args):
            super().log_message(format, *args)


def main():
    """Función principal que inicia el servidor."""
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, LasaCamHandler)
    
    print(f"Servidor LasaCam iniciado en http://localhost:{PORT}")
    print(f"Directorio de uploads: {UPLOAD_DIR.absolute()}")
    print("Presiona Ctrl+C para detener el servidor")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDeteniendo servidor...")
        httpd.shutdown()
        print("Servidor detenido.")


if __name__ == '__main__':
    main()

