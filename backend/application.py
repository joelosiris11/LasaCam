#!/usr/bin/env python3
"""
Aplicación WSGI para LasaCam - Compatible con cPanel Python App
Maneja subida y listado de fotos sin dependencias externas.
"""

import os
import json
from pathlib import Path
from datetime import datetime
from urllib.parse import parse_qs

# Configuración
UPLOAD_DIR = Path(__file__).parent / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def parse_multipart(data, boundary):
    """Parsea datos multipart/form-data."""
    parts = data.split(b'--' + boundary.encode())
    fields = {}
    
    for part in parts:
        if b'Content-Disposition: form-data' in part:
            # Extraer nombre del campo
            if b'name="photo"' in part:
                # Extraer nombre del archivo
                filename = None
                if b'filename=' in part:
                    for line in part.split(b'\r\n'):
                        if b'filename=' in line:
                            filename_part = line.decode('utf-8', errors='ignore')
                            if 'filename=' in filename_part:
                                filename = filename_part.split('filename=')[1].strip('"')
                                break
                
                # Extraer datos del archivo (después de línea en blanco)
                file_start = part.find(b'\r\n\r\n') + 4
                file_end = part.rfind(b'\r\n')
                if file_end > file_start:
                    file_data = part[file_start:file_end]
                    fields['photo'] = {
                        'filename': filename,
                        'data': file_data
                    }
    
    return fields


def handle_upload(environ):
    """Maneja la subida de una foto."""
    try:
        # Leer el contenido
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        if content_length == 0:
            return {'error': 'No se recibió ningún archivo'}, 400
        
        if content_length > MAX_FILE_SIZE:
            return {'error': f'Archivo muy grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB'}, 400
        
        # Leer el body
        wsgi_input = environ['wsgi.input']
        post_data = wsgi_input.read(content_length)
        
        # Parsear multipart
        content_type = environ.get('CONTENT_TYPE', '')
        if 'boundary=' not in content_type:
            return {'error': 'Content-Type debe ser multipart/form-data'}, 400
        
        boundary = content_type.split('boundary=')[1]
        fields = parse_multipart(post_data, boundary)
        
        if 'photo' not in fields:
            return {'error': 'No se encontró el archivo "photo"'}, 400
        
        photo = fields['photo']
        filename = photo['filename']
        file_data = photo['data']
        
        if not filename:
            return {'error': 'No se seleccionó ningún archivo'}, 400
        
        # Validar extensión
        file_ext = Path(filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            return {'error': f'Extensión no permitida. Use: {", ".join(ALLOWED_EXTENSIONS)}'}, 400
        
        # Validar tamaño
        if len(file_data) > MAX_FILE_SIZE:
            return {'error': f'Archivo muy grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB'}, 400
        
        # Generar nombre único
        timestamp = int(datetime.now().timestamp() * 1000)
        unique_filename = f'lasacam-{timestamp}-{os.urandom(4).hex()}{file_ext}'
        file_path = UPLOAD_DIR / unique_filename
        
        # Guardar archivo
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        # Construir URL
        host = environ.get('HTTP_HOST', 'localhost')
        protocol = 'https' if environ.get('HTTPS') == 'on' else 'http'
        file_url = f"{protocol}://{host}/uploads/{unique_filename}"
        
        return {
            'message': 'Foto subida con éxito',
            'filename': unique_filename,
            'url': file_url
        }, 200
    
    except Exception as e:
        return {'error': f'Error al subir foto: {str(e)}'}, 500


def handle_list_photos(environ):
    """Lista todas las fotos subidas."""
    try:
        photos = []
        
        if UPLOAD_DIR.exists():
            # Obtener el host
            host = environ.get('HTTP_HOST', 'localhost')
            protocol = 'https' if environ.get('HTTPS') == 'on' else 'http'
            
            # Listar archivos ordenados por fecha (más recientes primero)
            files = list(UPLOAD_DIR.glob('*'))
            files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
            
            for file_path in files:
                if file_path.is_file() and file_path.suffix.lower() in ALLOWED_EXTENSIONS:
                    photos.append({
                        'filename': file_path.name,
                        'url': f"{protocol}://{host}/uploads/{file_path.name}"
                    })
        
        return photos, 200
    
    except Exception as e:
        return {'error': f'Error al listar fotos: {str(e)}'}, 500


def serve_upload_file(environ, path):
    """Sirve un archivo de la carpeta uploads."""
    try:
        filename = path.replace('/uploads/', '')
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists() or not file_path.is_file():
            return None, 404
        
        # Determinar content-type
        ext = file_path.suffix.lower()
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        }
        content_type = content_types.get(ext, 'application/octet-stream')
        
        # Leer archivo
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        return file_data, content_type, 200
    
    except Exception as e:
        return None, 500


def application(environ, start_response):
    """
    Función WSGI principal que maneja todas las peticiones.
    """
    method = environ.get('REQUEST_METHOD', '')
    path = environ.get('PATH_INFO', '')
    
    # Headers CORS
    cors_headers = [
        ('Access-Control-Allow-Origin', '*'),
        ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
        ('Access-Control-Allow-Headers', 'Content-Type'),
    ]
    
    # Manejar OPTIONS (CORS preflight)
    if method == 'OPTIONS':
        status = '200 OK'
        headers = cors_headers
        start_response(status, headers)
        return [b'']
    
    # Servir archivos de uploads
    if path.startswith('/uploads/'):
        result = serve_upload_file(environ, path)
        if result[0] is None:
            status = f'{result[1]} Not Found' if result[1] != 500 else '500 Internal Server Error'
            headers = [('Content-Type', 'application/json')] + cors_headers
            start_response(status, headers)
            return [json.dumps({'error': 'Archivo no encontrado'}).encode('utf-8')]
        
        file_data, content_type, status_code = result
        status = f'{status_code} OK'
        headers = [('Content-Type', content_type)] + cors_headers
        start_response(status, headers)
        return [file_data]
    
    # Manejar /api/upload
    if path == '/api/upload' and method == 'POST':
        result, status_code = handle_upload(environ)
        status = f'{status_code} OK' if status_code == 200 else f'{status_code} Error'
        headers = [('Content-Type', 'application/json')] + cors_headers
        start_response(status, headers)
        return [json.dumps(result).encode('utf-8')]
    
    # Manejar /api/photos
    if path == '/api/photos' and method == 'GET':
        result, status_code = handle_list_photos(environ)
        status = f'{status_code} OK' if status_code == 200 else f'{status_code} Error'
        headers = [('Content-Type', 'application/json')] + cors_headers
        start_response(status, headers)
        return [json.dumps(result).encode('utf-8')]
    
    # Ruta no encontrada
    status = '404 Not Found'
    headers = [('Content-Type', 'application/json')] + cors_headers
    start_response(status, headers)
    return [json.dumps({'error': 'Ruta no encontrada'}).encode('utf-8')]

