# LasaCam - Photo Editor with Stickers

Una aplicación web móvil para capturar fotos con cámara, agregar stickers personalizados y descargarlas. Inspirada en la experiencia de usuario de iPhone con interfaz vertical completa (9:16 aspect ratio).

## 📋 Descripción General

LasaCam permite:
- ✅ Solicitar permiso de cámara
- ✅ Capturar fotos en tiempo real (vertical 9:16)
- ✅ Cambiar entre cámara frontal y trasera
- ✅ Agregar stickers de una galería (15+ PNG)
- ✅ Manipular stickers con gestos táctiles:
  - Arrastra libre sin restricciones
  - Pinch zoom para escalar (0.3x - 3x)
  - Rotación manual
  - Eliminar individuales
- ✅ Guardar foto final con stickers incorporados
- ✅ Descargar automáticamente en JPEG
- ✅ Interfaz 100% responsive (9:16 aspect ratio)

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── PermissionRequest.tsx      # Pantalla inicial (permisos)
│   ├── CameraCapture.tsx          # Captura de foto (fullscreen vertical)
│   ├── StickerEditor.tsx          # Editor principal (logic crítico)
│   ├── StickerGallery.tsx         # Galería de stickers (modal)
│   ├── SuccessScreen.tsx          # Resultado final (download)
│   └── index.ts                   # Exports
├── hooks/                         # Custom React hooks
├── types/
│   └── index.ts                   # TypeScript interfaces
├── utils/
│   └── stickers.ts                # AVAILABLE_STICKERS array
├── styles/
│   ├── theme.ts                   # Aurora Tabacalera colors
│   └── index.ts                   # CSS utilities
├── assets/
│   └── stiker/                    # 15 PNG sticker files
├── App.tsx                        # Orquestación de flujo
├── App.css                        # Estilos responsive
├── index.css                      # CSS global
└── main.tsx                       # Entry point
```

## 🔧 Stack Tecnológico

- **React 19** + TypeScript
- **Vite** (rolldown-vite)
- **Framer Motion** 3.10+ (animaciones)
- **React Icons** (UI only)
- **Canvas API** (renderizar stickers)
- **MediaDevices API** (cámara)
- **Touch Events** (gestos)

## 📱 Flujo de Usuario

### 1. PermissionRequest
- Pantalla blanca limpia
- Solicita permiso de cámara
- Animaciones suaves

### 2. CameraCapture
- Video fullscreen vertical (9:16)
- Botón capturar foto (centro inferior)
- Botón cambiar cámara (esquina superior)
- Spinner loading

### 3. StickerEditor (CORE)
- Foto vertical en centro
- Stickers arrastrables
- Modal galería con grid
- Botón + para agregar
- Botón descargar para guardar
- Panel control para eliminar

### 4. SuccessScreen
- Preview de foto final
- Botón descargar nuevamente
- Botón crear otra

## 🎯 Componentes Clave

### PermissionRequest.tsx
```typescript
- Responsive con clamp() CSS
- Solicita navigator.mediaDevices.getUserMedia()
- Animaciones Framer Motion
```

### CameraCapture.tsx
```typescript
- getUserMedia({ facingMode, width: 1080, height: 1920, aspectRatio: 9/16 })
- Toggle entre cámara frontal/trasera
- Canvas para captura
- Espejo (scaleX) aplicado en captura
```

### StickerEditor.tsx (CRÍTICO)
**State:**
- `placedStickers: PlacedSticker[]`
- `selectedStickerIndex`
- `touchState`

**Funciones:**
- `handleTouchStart()` - Inicia drag/pinch
- `handleTouchMove()` - Mueve sticker o escala
- `handleTouchEnd()` - Reset táctil
- `handleSave()` - **Renderiza stickers en canvas**

**handleSave() Logic:**
1. Crea canvas con dimensiones de foto real
2. Dibuja imagen base con `ctx.drawImage(img, 0, 0)`
3. Para cada sticker:
   - Calcula escala: `scale = img.width / containerWidth`
   - Convierte coordenadas: `realX = sticker.x * scale`
   - Aplica transformaciones:
     ```
     ctx.translate(centerX, centerY)
     ctx.rotate(rotation)
     ctx.scale(sticker.scale, sticker.scale)
     ctx.drawImage(stickerImg, ...)
     ```
4. Exporta a JPEG: `canvas.toDataURL('image/jpeg', 0.95)`

**PlacedSticker Type:**
```typescript
{
  id: string,
  stickerId: string,
  x: number,           // píxeles visuales
  y: number,           // píxeles visuales
  scale: number,       // 0.3 - 3
  rotation: number     // grados
}
```

### SuccessScreen.tsx
- Preview foto final
- Auto-descarga en mount
- Botones navegación

## 🖼️ Stickers

**Location:** `src/assets/stiker/` (15 PNG files)

**Registration:** `src/utils/stickers.ts`
```typescript
const AVAILABLE_STICKERS: Sticker[] = [
  { id: 'st_0', name: 'Aurora', icon: '/src/assets/stiker/st_0000_Layer-1.png' },
  // ... 14 más
]
```

## 🎨 Paleta de Colores

```
Primary:    #FF6B35  (Naranja)
Secondary:  #8B5A8F  (Morado)
Accent:     #00A9E0  (Azul)
Dark:       #1A1A2E  (Oscuro)
Light:      #F0E6FF  (Claro)
```

## 📐 Responsive Design

- **Aspect Ratio:** 9:16 (vertical)
- **Font Sizes:** `clamp(min, preferred, max)`
  - Títulos: `clamp(24px, 6vw, 40px)`
  - Body: `clamp(14px, 3vw, 18px)`
- **Spacing:** `clamp(8px, 2vw, 16px)`
- **Botones:** `clamp(48px, 12vw, 64px)`

## 🚀 Para Correr

```bash
npm install
npm run dev          # http://localhost:5173
npm run build
npm run preview
```

## ⚠️ Problemas y Soluciones

### Stickers no aparecen en canvas
**Causa:** `containerWidth` = 0 o escala incorrecta
**Solución:**
```typescript
let containerWidth = containerRect.width;
if (containerWidth === 0) {
  containerWidth = (containerHeight * 9) / 16; // aspect ratio
}
const scale = img.width / containerWidth;
```

### Foto se ve horizontal
**Causa:** `objectFit: 'cover'` estira la imagen
**Solución:** Usar `objectFit: 'contain'`

### Drag no funciona suavemente
**Causa:** Limites calculados mal
**Solución:** Usar `getBoundingClientRect()` dinámicamente

### Cámara no cambia
**Causa:** Stream anterior no se detiene
**Solución:**
```typescript
streamRef.current.getTracks().forEach(t => t.stop());
```

## 📝 Para Próximos Desarrolladores

1. **NO cambiar aspect ratio 9:16** sin actualizar todos los componentes
2. **Stickers PNG** van en `src/assets/stiker/` y registrados en `AVAILABLE_STICKERS`
3. **Canvas rendering es crítico** - probar con múltiples stickers + rotaciones
4. **Touch coordinates** son del viewport, no del canvas
5. **Escala stickers:** 0.3 a 3 (editable en `handleTouchMove`)
6. **Posiciones guardadas en píxeles visuales**, convertidas en canvas

## 🎭 Animaciones (Framer Motion)

- Container: opacity 0→1
- Icons: 360° rotate
- Buttons: scale 1→1.1 (hover), 0.9 (tap)
- Stickers: scale 0.5→1
- Modal: y 500→0 (from bottom)

## 🔗 Flujo de Datos

```
App.tsx (orquestador)
├── PermissionRequest → handlePermissionGranted() → stage: camera
├── CameraCapture → handlePhotoTaken(photoData) → stage: editor
├── StickerEditor → handleSave(finalImage) → stage: success
└── SuccessScreen → handleReset() → stage: camera
```

## 📄 Interfaces Importantes

```typescript
// PlacedSticker - estado del sticker en pantalla
interface PlacedSticker {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// Sticker - definición del sticker
interface Sticker {
  id: string;
  name: string;
  icon: string; // path PNG
}

// AppState - estado global
interface AppState {
  stage: 'permission' | 'camera' | 'editor' | 'success';
  photoData: string | null;
  placedStickers: PlacedSticker[];
  loading: boolean;
}
```

---

**Versión:** 1.0.0  
**Creado:** Noviembre 2025  
**Licencia:** MIT
