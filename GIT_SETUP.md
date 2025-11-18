# Comandos para subir el proyecto a Git

## 1. Aceptar licencia de Xcode (si aún no lo has hecho)
```bash
sudo xcodebuild -license
```

## 2. Inicializar repositorio Git
```bash
cd /Users/osi/LasaCam
git init
```

## 3. Configurar Git (si es la primera vez)
```bash
git config user.name "Tu Nombre"
git config user.email "tu@email.com"
```

## 4. Agregar todos los archivos
```bash
git add .
```

## 5. Hacer el commit inicial
```bash
git commit -m "Initial commit: LasaCam - App de fotos con stickers"
```

## 6. Crear repositorio en GitHub/GitLab (opcional)
- Ve a GitHub.com o GitLab.com
- Crea un nuevo repositorio
- No inicialices con README, .gitignore o licencia

## 7. Conectar con el repositorio remoto
```bash
git remote add origin https://github.com/TU_USUARIO/LasaCam.git
# O si usas SSH:
# git remote add origin git@github.com:TU_USUARIO/LasaCam.git
```

## 8. Subir el código
```bash
git branch -M main
git push -u origin main
```

