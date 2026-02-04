"""
LasaCam Firebase Functions - Manejo de subida y listado de fotos con Firebase Storage
"""

import os
import io
import json
import secrets
import zipfile
from datetime import datetime
from pathlib import Path

from firebase_functions import https_fn
from firebase_functions.options import set_global_options, CorsOptions
from firebase_admin import initialize_app, storage

# Inicializar Firebase Admin
initialize_app()

# Configuración
set_global_options(max_instances=10)
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
STORAGE_BUCKET = 'lasacam.firebasestorage.app'  # Nombre del bucket (sin gs://)

# Configuración CORS
cors_options = CorsOptions(cors_origins="*", cors_methods=["GET", "POST", "OPTIONS"])


def _get_file_extension(filename):
    """Obtiene la extensión del archivo."""
    return Path(filename).suffix.lower()


def _generate_unique_filename(original_filename):
    """Genera un nombre único para el archivo."""
    ext = _get_file_extension(original_filename)
    timestamp = int(datetime.now().timestamp() * 1000)
    random_hex = secrets.token_hex(4)
    return f'lasacam-{timestamp}-{random_hex}{ext}'


def _parse_multipart_form(request):
    """Parsea formulario multipart/form-data."""
    content_type = request.headers.get('Content-Type', '')
    
    if not content_type.startswith('multipart/form-data'):
        return None, None, 'Content-Type debe ser multipart/form-data'
    
    # Extraer boundary
    if 'boundary=' not in content_type:
        return None, None, 'Falta boundary en Content-Type'
    
    boundary = content_type.split('boundary=')[1].encode()
    body = request.get_data()
    
    # Dividir por boundary
    parts = body.split(b'--' + boundary)
    
    for part in parts:
        if b'Content-Disposition: form-data' not in part:
            continue
        
        if b'name="photo"' not in part:
            continue
        
        # Extraer filename
        filename = None
        if b'filename=' in part:
            for line in part.split(b'\r\n'):
                if b'filename=' in line:
                    filename_str = line.decode('utf-8', errors='ignore')
                    if 'filename=' in filename_str:
                        filename = filename_str.split('filename=')[1].strip('"\'')
                        break
        
        if not filename:
            continue
        
        # Extraer datos del archivo
        file_start = part.find(b'\r\n\r\n')
        if file_start == -1:
            continue
        
        file_start += 4
        file_end = part.rfind(b'\r\n')
        
        if file_end > file_start:
            file_data = part[file_start:file_end]
            return filename, file_data, None
    
    return None, None, 'No se encontró el archivo "photo" en la petición'


@https_fn.on_request(cors=cors_options)
def uploadPhoto(req: https_fn.Request) -> https_fn.Response:
    """
    Maneja la subida de fotos a Firebase Storage.
    Equivalente a POST /api/upload del backend Python original.
    """
    
    # Solo permitir POST
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Método no permitido'}),
            status=405,
            headers={'Content-Type': 'application/json'}
        )
    
    try:
        # Parsear multipart form
        filename, file_data, error = _parse_multipart_form(req)
        
        if error:
            return https_fn.Response(
                json.dumps({'error': error}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        if not filename or not file_data:
            return https_fn.Response(
                json.dumps({'error': 'No se encontró el archivo en la petición'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Validar extensión
        file_ext = _get_file_extension(filename)
        if file_ext not in ALLOWED_EXTENSIONS:
            return https_fn.Response(
                json.dumps({'error': f'Extensión no permitida. Use: {", ".join(ALLOWED_EXTENSIONS)}'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Validar tamaño
        file_size = len(file_data)
        if file_size == 0:
            return https_fn.Response(
                json.dumps({'error': 'El archivo está vacío'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        if file_size > MAX_FILE_SIZE:
            return https_fn.Response(
                json.dumps({'error': f'Archivo muy grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Generar nombre único
        unique_filename = _generate_unique_filename(filename)
        
        # Subir a Firebase Storage
        bucket = storage.bucket(STORAGE_BUCKET)
        blob = bucket.blob(f'uploads/{unique_filename}')
        
        # Determinar content-type
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        }
        content_type = content_types.get(file_ext, 'application/octet-stream')
        
        # Subir archivo
        blob.upload_from_string(
            file_data,
            content_type=content_type
        )
        
        # Hacer el archivo público
        blob.make_public()
        
        # Obtener URL pública
        public_url = blob.public_url
        
        # Response en el mismo formato que el backend original
        response_data = {
            'message': 'Foto subida con éxito',
            'filename': unique_filename,
            'url': public_url
        }
        
        return https_fn.Response(
            json.dumps(response_data),
            status=200,
            headers={'Content-Type': 'application/json'}
        )
    
    except Exception as e:
        return https_fn.Response(
            json.dumps({'error': f'Error al listar fotos: {str(e)}'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )


@https_fn.on_request(cors=cors_options)
def downloadMultipleImages(req: https_fn.Request) -> https_fn.Response:
    """
    Descarga una o múltiples imágenes.
    - Si se envía 1 imagen: descarga directa de la imagen
    - Si se envían 2+: descarga como ZIP
    
    Payload esperado:
    {
        "imageNames": ["lasacam-1234567890-abc123.jpg"] // 1 o más
    }
    """
    
    # Solo permitir POST
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Método no permitido'}),
            status=405,
            headers={'Content-Type': 'application/json'}
        )
    
    try:
        # Parsear body JSON
        try:
            data = req.get_json(silent=True)
            if not data:
                return https_fn.Response(
                    json.dumps({'error': 'Body JSON requerido'}),
                    status=400,
                    headers={'Content-Type': 'application/json'}
                )
        except Exception:
            return https_fn.Response(
                json.dumps({'error': 'JSON inválido'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Validar que imageNames esté presente y sea una lista
        image_names = data.get('imageNames', [])
        if not isinstance(image_names, list) or len(image_names) == 0:
            return https_fn.Response(
                json.dumps({'error': 'imageNames debe ser una lista no vacía'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Obtener bucket
        bucket = storage.bucket(STORAGE_BUCKET)
        
        # Si es solo 1 imagen, descargarla directamente
        if len(image_names) == 1:
            image_name = image_names[0]
            blob = bucket.blob(f'uploads/{image_name}')
            
            # Verificar que existe
            if not blob.exists():
                return https_fn.Response(
                    json.dumps({'error': f'La imagen {image_name} no existe'}),
                    status=404,
                    headers={'Content-Type': 'application/json'}
                )
            
            # Descargar imagen
            image_data = blob.download_as_bytes()
            
            # Determinar content type basado en extensión
            file_ext = _get_file_extension(image_name)
            content_type_map = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            }
            content_type = content_type_map.get(file_ext, 'application/octet-stream')
            
            # Retornar imagen directamente
            return https_fn.Response(
                image_data,
                status=200,
                headers={
                    'Content-Type': content_type,
                    'Content-Disposition': f'inline; filename="{image_name}"',
                    'Cache-Control': 'public, max-age=3600'
                }
            )
        
        # Si son múltiples, crear ZIP
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for image_name in image_names:
                try:
                    # Construir path completo en storage
                    blob = bucket.blob(f'uploads/{image_name}')
                    
                    # Verificar que el archivo existe
                    if not blob.exists():
                        print(f'Advertencia: {image_name} no existe, se omite')
                        continue
                    
                    # Descargar imagen como bytes
                    image_data = blob.download_as_bytes()
                    
                    # Agregar al ZIP
                    zip_file.writestr(image_name, image_data)
                    
                except Exception as e:
                    print(f'Error procesando {image_name}: {str(e)}')
                    continue
        
        # Mover puntero al inicio del buffer
        zip_buffer.seek(0)
        
        # Generar nombre del archivo ZIP
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        zip_filename = f'lasacam_fotos_{timestamp}.zip'
        
        # Retornar ZIP
        return https_fn.Response(
            zip_buffer.getvalue(),
            status=200,
            headers={
                'Content-Type': 'application/zip',
                'Content-Disposition': f'attachment; filename="{zip_filename}"'
            }
        )
    
    except Exception as e:
        return https_fn.Response(
            json.dumps({'error': f'Error al procesar descarga: {str(e)}'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )


@https_fn.on_request(cors=cors_options)
def listPhotos(req: https_fn.Request) -> https_fn.Response:
    """
    Lista todas las fotos subidas en Firebase Storage.
    Equivalente a GET /api/photos del backend Python original.
    """
    
    # Solo permitir GET
    if req.method != 'GET':
        return https_fn.Response(
            json.dumps({'error': 'Método no permitido'}),
            status=405,
            headers={'Content-Type': 'application/json'}
        )
    
    try:
        # Obtener bucket
        bucket = storage.bucket(STORAGE_BUCKET)
        
        # Listar todos los archivos en el directorio uploads/
        blobs = bucket.list_blobs(prefix='uploads/')
        
        photos = []
        
        for blob in blobs:
            # Filtrar solo archivos válidos (no directorios)
            if blob.name == 'uploads/':
                continue
            
            filename = blob.name.replace('uploads/', '')
            file_ext = _get_file_extension(filename)
            
            # Solo incluir archivos con extensiones permitidas
            if file_ext in ALLOWED_EXTENSIONS:
                # Hacer público si no lo está (por si acaso)
                if not blob.public_url:
                    blob.make_public()
                
                photos.append({
                    'filename': filename,
                    'url': blob.public_url
                })
        
        # Ordenar por nombre (que incluye timestamp) - más recientes primero
        photos.sort(key=lambda x: x['filename'], reverse=True)
        
        return https_fn.Response(
            json.dumps(photos),
            status=200,
            headers={'Content-Type': 'application/json'}
        )
    
    except Exception as e:
        return https_fn.Response(
            json.dumps({'error': f'Error al listar fotos: {str(e)}'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )


# --- Procigar Functions ---

PROCIGAR_BUCKET = 'procigarfotos'

@https_fn.on_request(cors=cors_options)
def uploadProcigarPhoto(req: https_fn.Request) -> https_fn.Response:
    """
    Maneja la subida de fotos al bucket de Procigar.
    POST /api/procigar/upload
    """
    
    # Solo permitir POST
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Método no permitido'}),
            status=405,
            headers={'Content-Type': 'application/json'}
        )
    
    try:
        # Parsear multipart form
        filename, file_data, error = _parse_multipart_form(req)
        
        if error:
            return https_fn.Response(
                json.dumps({'error': error}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        if not filename or not file_data:
            return https_fn.Response(
                json.dumps({'error': 'No se encontró el archivo en la petición'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Validar extensión
        file_ext = _get_file_extension(filename)
        if file_ext not in ALLOWED_EXTENSIONS:
            return https_fn.Response(
                json.dumps({'error': f'Extensión no permitida. Use: {", ".join(ALLOWED_EXTENSIONS)}'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Validar tamaño
        file_size = len(file_data)
        if file_size == 0:
            return https_fn.Response(
                json.dumps({'error': 'El archivo está vacío'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        if file_size > MAX_FILE_SIZE:
            return https_fn.Response(
                json.dumps({'error': f'Archivo muy grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Generar nombre único
        unique_filename = _generate_unique_filename(filename)
        
        # Subir a Firebase Storage (Bucket Procigar)
        bucket = storage.bucket(PROCIGAR_BUCKET)
        blob = bucket.blob(f'uploads/{unique_filename}')
        
        # Determinar content-type
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        }
        content_type = content_types.get(file_ext, 'application/octet-stream')
        
        # Subir archivo
        blob.upload_from_string(
            file_data,
            content_type=content_type
        )
        
        # Hacer el archivo público
        blob.make_public()
        
        # Obtener URL pública
        public_url = blob.public_url
        
        # Response
        response_data = {
            'message': 'Foto subida con éxito a Procigar',
            'filename': unique_filename,
            'url': public_url
        }
        
        return https_fn.Response(
            json.dumps(response_data),
            status=200,
            headers={'Content-Type': 'application/json'}
        )
    
    except Exception as e:
        return https_fn.Response(
            json.dumps({'error': f'Error al subir foto: {str(e)}'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )


@https_fn.on_request(cors=cors_options)
def listProcigarPhotos(req: https_fn.Request) -> https_fn.Response:
    """
    Lista todas las fotos del bucket de Procigar.
    GET /api/procigar/photos
    """
    
    # Solo permitir GET
    if req.method != 'GET':
        return https_fn.Response(
            json.dumps({'error': 'Método no permitido'}),
            status=405,
            headers={'Content-Type': 'application/json'}
        )
    
    try:
        # Obtener bucket Procigar
        bucket = storage.bucket(PROCIGAR_BUCKET)
        
        # Listar todos los archivos en el directorio uploads/
        blobs = bucket.list_blobs(prefix='uploads/')
        
        photos = []
        
        for blob in blobs:
            # Filtrar solo archivos válidos (no directorios)
            if blob.name == 'uploads/':
                continue
            
            filename = blob.name.replace('uploads/', '')
            file_ext = _get_file_extension(filename)
            
            # Solo incluir archivos con extensiones permitidas
            if file_ext in ALLOWED_EXTENSIONS:
                # Hacer público si no lo está
                if not blob.public_url:
                    blob.make_public()
                
                photos.append({
                    'filename': filename,
                    'url': blob.public_url
                })
        
        # Ordenar por nombre (más recientes primero)
        photos.sort(key=lambda x: x['filename'], reverse=True)
        
        return https_fn.Response(
            json.dumps(photos),
            status=200,
            headers={'Content-Type': 'application/json'}
        )
    
    except Exception as e:
        return https_fn.Response(
            json.dumps({'error': f'Error al listar fotos: {str(e)}'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )


@https_fn.on_request(cors=cors_options)
def downloadProcigarImages(req: https_fn.Request) -> https_fn.Response:
    """
    Descarga una o múltiples imágenes del bucket Procigar.
    - Si se envía 1 imagen: descarga directa de la imagen
    - Si se envían 2+: descarga como ZIP
    
    POST /api/procigar/download
    Payload esperado:
    {
        "imageNames": ["lasacam-1234567890-abc123.jpg"] // 1 o más
    }
    """
    
    # Solo permitir POST
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Método no permitido'}),
            status=405,
            headers={'Content-Type': 'application/json'}
        )
    
    try:
        # Parsear body JSON
        try:
            data = req.get_json(silent=True)
            if not data:
                return https_fn.Response(
                    json.dumps({'error': 'Body JSON requerido'}),
                    status=400,
                    headers={'Content-Type': 'application/json'}
                )
        except Exception:
            return https_fn.Response(
                json.dumps({'error': 'JSON inválido'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Validar que imageNames esté presente y sea una lista
        image_names = data.get('imageNames', [])
        if not isinstance(image_names, list) or len(image_names) == 0:
            return https_fn.Response(
                json.dumps({'error': 'imageNames debe ser una lista no vacía'}),
                status=400,
                headers={'Content-Type': 'application/json'}
            )
        
        # Obtener bucket Procigar
        bucket = storage.bucket(PROCIGAR_BUCKET)
        
        # Si es solo 1 imagen, descargarla directamente
        if len(image_names) == 1:
            image_name = image_names[0]
            blob = bucket.blob(f'uploads/{image_name}')
            
            # Verificar que existe
            if not blob.exists():
                return https_fn.Response(
                    json.dumps({'error': f'La imagen {image_name} no existe'}),
                    status=404,
                    headers={'Content-Type': 'application/json'}
                )
            
            # Descargar imagen
            image_data = blob.download_as_bytes()
            
            # Determinar content type basado en extensión
            file_ext = _get_file_extension(image_name)
            content_type_map = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            }
            content_type = content_type_map.get(file_ext, 'application/octet-stream')
            
            # Retornar imagen directamente
            return https_fn.Response(
                image_data,
                status=200,
                headers={
                    'Content-Type': content_type,
                    'Content-Disposition': f'inline; filename="{image_name}"',
                    'Cache-Control': 'public, max-age=3600'
                }
            )
        
        # Si son múltiples, crear ZIP
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for image_name in image_names:
                try:
                    # Construir path completo en storage
                    blob = bucket.blob(f'uploads/{image_name}')
                    
                    # Verificar que el archivo existe
                    if not blob.exists():
                        print(f'Advertencia: {image_name} no existe, se omite')
                        continue
                    
                    # Descargar imagen como bytes
                    image_data = blob.download_as_bytes()
                    
                    # Agregar al ZIP
                    zip_file.writestr(image_name, image_data)
                    
                except Exception as e:
                    print(f'Error procesando {image_name}: {str(e)}')
                    continue
        
        # Mover puntero al inicio del buffer
        zip_buffer.seek(0)
        
        # Generar nombre del archivo ZIP
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        zip_filename = f'procigar_fotos_{timestamp}.zip'
        
        # Retornar ZIP
        return https_fn.Response(
            zip_buffer.getvalue(),
            status=200,
            headers={
                'Content-Type': 'application/zip',
                'Content-Disposition': f'attachment; filename="{zip_filename}"'
            }
        )
    
    except Exception as e:
        return https_fn.Response(
            json.dumps({'error': f'Error al procesar descarga: {str(e)}'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )