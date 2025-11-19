# Configuración de cPanel Python App para LasaCam

## 📋 Cómo llenar el formulario de cPanel

### 1. **Python version:**
   - **IMPORTANTE:** Cambia de `2.7.18` a **Python 3.x** (ej: `3.9`, `3.10`, `3.11`)
   - Haz clic en el dropdown y selecciona la versión más reciente de Python 3 disponible

### 2. **Application root:**
   - **Ruta física donde están tus archivos**
   - Ejemplo: `/home/tu_usuario/public_html/lasacam`
   - O simplemente: `/home/tu_usuario/public_html` si todo está en la raíz
   - **Nota:** Esta es la ruta física en el servidor, no la URL

### 3. **Application URL:**
   - Ya tienes `t-ecogroup.net` seleccionado
   - Puedes dejarlo así o crear un subdominio como `lasacam.t-ecogroup.net`
   - Si usas subdominio, primero créalo en cPanel → "Subdomains"

### 4. **Application startup file:**
   - **Escribe:** `application.py`
   - Este es el archivo WSGI que maneja todas las peticiones

### 5. **Application Entry point:**
   - **Escribe:** `application`
   - Este es el nombre de la función WSGI en `application.py`

### 6. **Environment variables (Opcional):**
   - Puedes agregar variables si las necesitas
   - Por ahora no es necesario

## 📁 Estructura de archivos en el servidor

Asegúrate de tener esta estructura en tu `Application root`:

```
/home/tu_usuario/public_html/  (o donde hayas configurado)
├── application.py              (archivo WSGI principal)
├── index.html                 (desde dist/)
├── assets/                    (desde dist/)
└── uploads/                    (carpeta para fotos - se crea automáticamente)
```

## 🚀 Pasos después de crear la aplicación

1. **Sube los archivos al servidor:**
   - `application.py` → en el Application root
   - Contenido de `dist/` → en el Application root
   - Crea carpeta `uploads/` con permisos 755

2. **Configura permisos:**
   ```bash
   chmod 755 application.py
   chmod 755 uploads
   ```

3. **Reinicia la aplicación:**
   - En cPanel → "Python App" → Selecciona tu app → "Restart"

4. **Verifica que funcione:**
   - Abre: `https://tu-dominio.com/api/photos`
   - Debería devolver: `[]` (array vacío si no hay fotos)

## 🔧 Solución de Problemas

### Error: "No module named 'application'"
- Verifica que `application.py` esté en el Application root
- Verifica que el nombre del archivo sea exactamente `application.py`

### Error: "Application Entry point not found"
- Verifica que en "Application Entry point" hayas puesto exactamente: `application`
- Debe coincidir con el nombre de la función en `application.py`

### Error 500 - Internal Server Error
- Revisa los logs en cPanel → "Errors"
- Verifica que la carpeta `uploads/` exista y tenga permisos 755
- Verifica que Python 3 esté seleccionado (no Python 2.7)

### Las fotos no se guardan
- Verifica que la carpeta `uploads/` exista
- Verifica permisos: `chmod 755 uploads`
- Verifica que el path en `application.py` sea correcto

## ✅ Checklist

- [ ] Python 3.x seleccionado (no 2.7)
- [ ] Application root apunta a la carpeta correcta
- [ ] Application startup file: `application.py`
- [ ] Application Entry point: `application`
- [ ] `application.py` está en el Application root
- [ ] Carpeta `uploads/` existe con permisos 755
- [ ] Frontend compilado está en el Application root
- [ ] Aplicación reiniciada en cPanel

## 🎯 Prueba Final

1. Abre: `https://tu-dominio.com/api/photos`
   - Debe devolver: `[]`

2. Prueba subir una foto desde la app
   - Debe funcionar correctamente

3. Verifica la galería
   - Debe mostrar las fotos subidas

