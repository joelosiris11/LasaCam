import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadIcon, ArrowLeftIcon, TrashIcon } from './icons';
import AURORA_THEME from '../styles/theme';
import lasalogo from '../assets/buttons/lasalogo.png';
import bstiker from '../assets/buttons/bstiker.png';
import { AVAILABLE_STICKERS } from '../utils/stickers';
import type { Sticker, PlacedSticker } from '../types';

interface StickerEditorProps {
  photoData: string;
  onSave: (canvasData: string) => void;
  onBackClick: () => void;
}

interface TouchState {
  touches: React.Touch[];
  initialDistance?: number;
  initialScale?: number;
  isResizing?: boolean;
  initialMousePos?: { x: number; y: number };
}

export const StickerEditor: React.FC<StickerEditorProps> = ({ photoData, onSave, onBackClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stickerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const placedStickersRef = useRef(placedStickers);
  const resizeDragRef = useRef<{
    isResizing: boolean;
    initialMousePos: { x: number; y: number } | null;
    initialScale: number;
  }>({ isResizing: false, initialMousePos: null, initialScale: 1 });

  // Sync ref
  placedStickersRef.current = placedStickers;

  const [selectedStickerIndex, setSelectedStickerIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({ touches: [] });

  // Estilos separados
  const styles = {
    backButton: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    },
  };

  const addSticker = (sticker: Sticker) => {
    const newSticker: PlacedSticker = {
      id: Math.random().toString(36),
      stickerId: sticker.id,
      x: 100,
      y: 100,
      scale: 1,
      rotation: 0,
    };
    setPlacedStickers([...placedStickers, newSticker]);
    setSelectedStickerIndex(placedStickers.length);
    setShowModal(false);
  };

  const updateSticker = (index: number, updates: Partial<PlacedSticker>) => {
    const updated = [...placedStickers];
    updated[index] = { ...updated[index], ...updates };
    setPlacedStickers(updated);
  };

  const removeSticker = (index: number) => {
    setPlacedStickers(placedStickers.filter((_, i) => i !== index));
    setSelectedStickerIndex(null);
  };

  // Calcular distancia entre dos puntos
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    // Ignore if the touch started on the resize handle
    const target = e.target as HTMLElement | null;
    if (target && target.closest('[data-resize-handle="true"]')) return;
    if (resizeDragRef.current.isResizing) return;
    e.stopPropagation();
    setSelectedStickerIndex(index);

    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setTouchState({
        touches: Array.from(e.touches),
        initialDistance: distance,
        initialScale: placedStickers[index].scale,
      });
    } else if (e.touches.length === 1) {
      setTouchState({
        touches: Array.from(e.touches),
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    // Ignore moves originating from the resize handle
    const target = e.target as HTMLElement | null;
    if (target && target.closest('[data-resize-handle="true"]')) return;
    if (resizeDragRef.current.isResizing) return;
    e.stopPropagation();

    if (e.touches.length === 2 && touchState.initialDistance !== undefined) {
      // Gesto de pinch para zoom
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = (currentDistance / touchState.initialDistance) * (touchState.initialScale || 1);
      updateSticker(index, { scale: Math.max(0.3, Math.min(3, scale)) });
    } else if (e.touches.length === 1 && touchState.touches.length === 1) {
      // Gesto de drag para mover
      if (!containerRef.current) return;

      const stickerElement = stickerRefs.current.get(placedStickers[index].id);
      if (!stickerElement) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      const stickerWidth = stickerElement.offsetWidth;
      const stickerHeight = stickerElement.offsetHeight;

      const deltaX = e.touches[0].clientX - touchState.touches[0].clientX;
      const deltaY = e.touches[0].clientY - touchState.touches[0].clientY;

      // Definir margen superior seguro para el logo (reducido para no quitar tanto espacio)
      const logoSafeMargin = Math.max(70, containerHeight * 0.08);

      updateSticker(index, {
        x: Math.max(0, Math.min(placedStickers[index].x + deltaX, containerWidth - stickerWidth)),
        y: Math.max(logoSafeMargin, Math.min(placedStickers[index].y + deltaY, containerHeight - stickerHeight)),
      });

      setTouchState({
        touches: Array.from(e.touches),
      });
    }
  };

  const handleTouchEnd = () => {
    setTouchState({ touches: [], isResizing: false });
  };

  // Handlers para resize con mouse
  const handleResizeStart = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedStickerIndex(index);
    setTouchState({
      touches: [],
      isResizing: true,
      initialMousePos: { x: e.clientX, y: e.clientY },
      initialScale: placedStickers[index].scale,
    });
  };

  const handleResizeMove = (e: React.MouseEvent, index: number) => {
    if (!touchState.isResizing || !touchState.initialMousePos) return;
    e.stopPropagation();

    const deltaX = e.clientX - touchState.initialMousePos.x;
    const deltaY = e.clientY - touchState.initialMousePos.y;
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const direction = deltaX + deltaY > 0 ? 1 : -1;

    const scaleChange = (delta * direction) / 100;
    const newScale = Math.max(0.3, Math.min(3, (touchState.initialScale || 1) + scaleChange));

    updateSticker(index, { scale: newScale });
  };

  const handleResizeEnd = () => {
    if (resizeDragRef.current.isResizing) {
      resizeDragRef.current = { isResizing: false, initialMousePos: null, initialScale: 1 };
    }
    setTouchState({ touches: [] });
  };

  const handleResizeTouchStart = (e: React.TouchEvent, index: number) => {
    // Do not call preventDefault here; React attaches passive listeners for touch events
    e.stopPropagation();
    setSelectedStickerIndex(index);

    const touch = e.touches[0];
    const currentSticker = placedStickers[index];

    if (currentSticker) {
      resizeDragRef.current = {
        isResizing: true,
        initialMousePos: { x: touch.clientX, y: touch.clientY },
        initialScale: currentSticker.scale,
      };
    }
  };

  const handleResizeTouchMove = (e: React.TouchEvent, index: number) => {
    // Do not call preventDefault here; rely on CSS touch-action: 'none' on the handle
    e.stopPropagation();

    if (e.touches.length !== 1) return;

    const { isResizing, initialMousePos, initialScale } = resizeDragRef.current;
    if (!isResizing || !initialMousePos) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - initialMousePos.x;
    const deltaY = touch.clientY - initialMousePos.y;

    // Project movement onto the 45° diagonal of the handle
    const movementProj = (deltaX + deltaY) / Math.SQRT2;
    const scaleChange = movementProj / 150;

    const newScale = Math.max(0.3, Math.min(3, initialScale + scaleChange));

    updateSticker(index, { scale: newScale });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (canvasRef.current && containerRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = async () => {
            canvasRef.current!.width = img.width;
            canvasRef.current!.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Dibujar logo en la parte superior
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            await new Promise<void>((resolve) => {
              logoImg.onload = () => resolve();
              logoImg.onerror = () => resolve(); // Continuar aunque falle
              logoImg.src = lasalogo;
            });

            const containerRect = containerRef.current!.getBoundingClientRect();
            let containerWidth = containerRect.width;

            if (containerWidth === 0 || containerWidth < 100) {
              const containerHeight = containerRect.height;
              containerWidth = (containerHeight * 9) / 16;
            }

            const scale = img.width / containerWidth;

            // Dibujar logo
            if (logoImg.complete && logoImg.naturalWidth > 0) {
              // Calcular tamaño del logo relativo al canvas
              // En pantalla es clamp(100px, 25vw, 140px). Usamos una proporción similar.
              const logoWidth = img.width * 0.35; // 35% del ancho de la foto
              const logoAspectRatio = logoImg.height / logoImg.width;
              const logoHeight = logoWidth * logoAspectRatio;

              const logoX = (img.width - logoWidth) / 2; // Centrado
              const logoY = img.height * 0.05; // 5% de margen superior

              ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
            }

            if (placedStickers.length === 0) {
              const canvasData = canvasRef.current!.toDataURL('image/jpeg', 0.95);
              onSave(canvasData);
              return;
            }

            let loadedCount = 0;
            const totalStickers = placedStickers.length;

            placedStickers.forEach((sticker) => {
              const stickerDef = AVAILABLE_STICKERS.find(s => s.id === sticker.stickerId);
              if (stickerDef) {
                const stickerImg = new Image();
                stickerImg.crossOrigin = 'anonymous';

                stickerImg.onload = () => {
                  ctx.save();

                  // Calcular el tamaño base que tenía en pantalla (match CSS clamp(60px, 12vw, 100px))
                  const viewportWidth = window.innerWidth;
                  const baseSize = Math.max(60, Math.min(100, viewportWidth * 0.12));

                  // Tamaño visual actual en el contenedor (píxeles de pantalla)
                  const visualWidth = baseSize * sticker.scale;
                  const aspectRatio = stickerImg.height / stickerImg.width;
                  const visualHeight = visualWidth * aspectRatio;

                  // Convertir coordenadas visuales a coordenadas de canvas
                  // sticker.x/y son relativos al contenedor visual
                  const realX = sticker.x * scale;
                  const realY = sticker.y * scale;

                  // Calcular dimensiones finales en el canvas
                  const finalWidth = visualWidth * scale;
                  const finalHeight = visualHeight * scale;

                  // Calcular centro para rotación
                  const centerX = realX + finalWidth / 2;
                  const centerY = realY + finalHeight / 2;

                  ctx.translate(centerX, centerY);
                  ctx.rotate((sticker.rotation * Math.PI) / 180);

                  ctx.drawImage(
                    stickerImg,
                    -finalWidth / 2,
                    -finalHeight / 2,
                    finalWidth,
                    finalHeight
                  );

                  ctx.restore();

                  loadedCount++;
                  if (loadedCount === totalStickers) {
                    const canvasData = canvasRef.current!.toDataURL('image/jpeg', 0.95);
                    onSave(canvasData);
                  }
                };

                stickerImg.onerror = () => {
                  loadedCount++;
                  if (loadedCount === totalStickers) {
                    const canvasData = canvasRef.current!.toDataURL('image/jpeg', 0.95);
                    onSave(canvasData);
                  }
                };

                stickerImg.src = stickerDef.icon;
              } else {
                loadedCount++;
              }
            });
          };

          img.onerror = () => {
            console.error('Error loading image');
            setSaving(false);
          };

          img.src = photoData;
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      style={{
        background: AURORA_THEME.colors.beige,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header con botón de volver */}
      <motion.div
        style={{
          position: 'absolute',
          top: 'clamp(12px, 3vw, 24px)',
          left: 'clamp(12px, 3vw, 24px)',
          right: 'clamp(12px, 3vw, 24px)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center', // Centrar contenido
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Botón de volver - Posicionado absolutamente a la izquierda */}
        <motion.button
          onClick={onBackClick}
          style={{
            ...styles.backButton,
            position: 'absolute',
            left: 0,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeftIcon size={36} color={AURORA_THEME.colors.blueDark} strokeWidth={3} />
        </motion.button>

        {/* Logo centrado y más grande */}
        <img
          src={lasalogo}
          alt="La Aurora"
          style={{
            width: 'clamp(100px, 25vw, 140px)', // Logo más grande
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}
        />
      </motion.div>

      {/* Contenedor de foto con stickers */}
      <motion.div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          backgroundColor: AURORA_THEME.colors.black,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          aspectRatio: '9/16',
          maxHeight: 'calc(100vh - 80px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div
          style={{
            position: 'relative',
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={photoData}
            alt="Captured"
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />

          {/* Stickers colocados */}
          <AnimatePresence>
            {placedStickers.map((sticker, index) => {
              const stickerDef = AVAILABLE_STICKERS.find(s => s.id === sticker.stickerId);
              if (!stickerDef) return null;

              return (
                <motion.div
                  key={sticker.id}
                  ref={(el) => {
                    if (el) stickerRefs.current.set(sticker.id, el);
                    else stickerRefs.current.delete(sticker.id);
                  }}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={(e) => handleTouchMove(e, index)}
                  onTouchEnd={handleTouchEnd}
                  onMouseMove={(e) => touchState.isResizing ? handleResizeMove(e, index) : undefined}
                  onMouseUp={handleResizeEnd}
                  onMouseLeave={handleResizeEnd}
                  onClick={() => setSelectedStickerIndex(index)}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                    transition: {
                      type: 'spring',
                      damping: 12,
                      stiffness: 200,
                      duration: 0.6
                    }
                  }}
                  exit={{ opacity: 0, scale: 0, rotate: 180 }}
                  style={{
                    position: 'absolute',
                    left: `${sticker.x}px`,
                    top: `${sticker.y}px`,
                    cursor: resizeDragRef.current.isResizing ? 'nwse-resize' : 'grab',
                    transform: `scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
                    border: selectedStickerIndex === index ? `3px solid ${AURORA_THEME.colors.gold}` : 'none',
                    borderRadius: AURORA_THEME.borderRadius.medium,
                    padding: selectedStickerIndex === index ? '4px' : '0px',
                    backgroundColor: selectedStickerIndex === index ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    touchAction: 'none',
                    boxShadow: selectedStickerIndex === index ? AURORA_THEME.elevations.level4 : 'none',
                  }}
                >
                  <img
                    src={stickerDef.icon}
                    alt={stickerDef.name}
                    style={{
                      width: 'clamp(60px, 12vw, 100px)',
                      height: 'clamp(60px, 12vw, 100px)',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                    draggable={false}
                  />

                  {/* Controles - esquinas superior izquierda (eliminar) e inferior derecha (resize) */}
                  {selectedStickerIndex === index && (
                    <>
                      {/* Botón eliminar - esquina superior izquierda */}
                      <motion.div
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSticker(index);
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '-8px',
                          width: '28px',
                          height: '28px',
                          background: AURORA_THEME.colors.blueDark,
                          border: `2px solid ${AURORA_THEME.colors.white}`,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          boxShadow: AURORA_THEME.elevations.level4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                        }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <TrashIcon size={14} color={AURORA_THEME.colors.white} strokeWidth={2.5} />
                      </motion.div>

                      {/* Botón resize - esquina inferior derecha */}
                      <motion.div
                        data-resize-handle="true"
                        onMouseDown={(e) => handleResizeStart(e, index)}
                        onTouchStart={(e) => handleResizeTouchStart(e, index)}
                        onTouchMove={(e) => handleResizeTouchMove(e, index)}
                        onTouchEnd={handleResizeEnd}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        style={{
                          position: 'absolute',
                          bottom: '-8px',
                          right: '-8px',
                          width: '28px',
                          height: '28px',
                          background: AURORA_THEME.colors.gold,
                          border: `2px solid ${AURORA_THEME.colors.white}`,
                          borderRadius: '50%',
                          cursor: 'nwse-resize',
                          boxShadow: AURORA_THEME.elevations.level4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                          touchAction: 'none',
                        }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div style={{
                          width: '0',
                          height: '0',
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderTop: '4px solid transparent',
                          borderBottom: `6px solid ${AURORA_THEME.colors.white}`,
                          transform: 'rotate(-45deg)',
                        }} />
                      </motion.div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Barra inferior con botones */}
      <div
        style={{
          position: 'fixed',
          bottom: 'clamp(40px, 8vw, 60px)',
          left: 0,
          right: 0,
          height: 'clamp(120px, 28vw, 160px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        {/* Botón de guardar - esquina inferior derecha */}
        <motion.div
          style={{
            position: 'absolute',
            right: 'clamp(12px, 3vw, 24px)',
            bottom: 'clamp(20px, 5vw, 32px)',
            pointerEvents: 'auto',
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: 'clamp(60px, 15vw, 72px)',
              height: 'clamp(60px, 15vw, 72px)',
              borderRadius: AURORA_THEME.borderRadius.round,
              background: saving
                ? AURORA_THEME.colors.beigeDark
                : `linear-gradient(135deg, ${AURORA_THEME.colors.blueDark} 0%, ${AURORA_THEME.colors.blueDarkMedium} 100%)`,
              border: `3px solid ${AURORA_THEME.colors.white}`,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              boxShadow: saving ? AURORA_THEME.elevations.level3 : AURORA_THEME.elevations.level6,
              opacity: saving ? 0.7 : 1,
            }}
            whileHover={!saving ? { scale: 1.1 } : undefined}
            whileTap={!saving ? { scale: 0.95 } : undefined}
          >
            <DownloadIcon size={28} color={AURORA_THEME.colors.white} strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        {/* Botón central para agregar stickers */}
        <motion.div
          style={{
            pointerEvents: 'auto',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <motion.button
            onClick={() => setShowModal(true)}
            style={{
              width: 'clamp(95px, 23vw, 120px)',
              height: 'clamp(95px, 23vw, 120px)',
              borderRadius: AURORA_THEME.borderRadius.round,
              background: `linear-gradient(135deg, ${AURORA_THEME.colors.gold} 0%, ${AURORA_THEME.colors.goldLight} 100%)`,
              border: `4px solid ${AURORA_THEME.colors.white}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              boxShadow: `0 8px 24px rgba(212, 175, 55, 0.4), ${AURORA_THEME.elevations.level8}`,
              position: 'relative',
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95, rotate: -5 }}
            animate={{
              boxShadow: [
                '0 8px 24px rgba(212, 175, 55, 0.4)',
                '0 8px 32px rgba(212, 175, 55, 0.6)',
                '0 8px 24px rgba(212, 175, 55, 0.4)',
              ],
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
          >
            {/* Anillos de animación */}
            <motion.div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: AURORA_THEME.borderRadius.round,
                border: `3px solid ${AURORA_THEME.colors.gold}`,
                opacity: 0.6,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
            <motion.div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: AURORA_THEME.borderRadius.round,
                border: `3px solid ${AURORA_THEME.colors.gold}`,
                opacity: 0.4,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
                delay: 0.5,
              }}
            />

            <img
              src={bstiker}
              alt="Añadir Stickers"
              style={{
                width: 'clamp(48px, 12vw, 62px)',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            />
          </motion.button>
        </motion.div>
      </div>

      {/* Modal de stickers */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              zIndex: 100,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              style={{
                background: AURORA_THEME.colors.beige,
                borderTop: `2px solid ${AURORA_THEME.colors.beigeDark}`,
                borderRadius: `${AURORA_THEME.borderRadius.xlarge} ${AURORA_THEME.borderRadius.xlarge} 0 0`,
                padding: 'clamp(16px, 4vw, 24px)',
                width: '100%',
                maxHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: AURORA_THEME.elevations.level16,
              }}
              initial={{ y: 500 }}
              animate={{ y: 0 }}
              exit={{ y: 500 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'clamp(16px, 4vw, 24px)',
              }}>
                <h3 style={{
                  color: AURORA_THEME.colors.blueDark,
                  fontSize: AURORA_THEME.typography.h3.fontSize,
                  fontWeight: 700,
                  margin: 0,
                  fontFamily: '"DynaPuff", cursive',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 2vw, 12px)',
                }}>
                  <img
                    src={bstiker}
                    alt="Stickers"
                    style={{
                      width: 'clamp(24px, 6vw, 32px)',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                  AÑADIR STICKERS
                </h3>
                <motion.button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'transparent',
                    border: `2px solid ${AURORA_THEME.colors.blueDark}`,
                    borderRadius: AURORA_THEME.borderRadius.round,
                    width: 'clamp(32px, 8vw, 40px)',
                    height: 'clamp(32px, 8vw, 40px)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: AURORA_THEME.colors.blueDark,
                    fontSize: 'clamp(20px, 5vw, 24px)',
                    padding: 0,
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ×
                </motion.button>
              </div>

              {/* Grid de stickers con scroll */}
              <motion.div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(70px, 15vw, 100px), 1fr))',
                  gap: 'clamp(12px, 3vw, 16px)',
                  overflowY: 'auto',
                  paddingRight: 'clamp(4px, 1vw, 8px)',
                  maxHeight: 'calc(70vh - 100px)',
                }}
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.05 },
                  },
                }}
                initial="hidden"
                animate="visible"
              >
                {AVAILABLE_STICKERS.map((sticker) => (
                  <motion.button
                    key={sticker.id}
                    onClick={() => addSticker(sticker)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      background: AURORA_THEME.colors.white,
                      border: `2px solid ${AURORA_THEME.colors.blueDark}`,
                      borderRadius: AURORA_THEME.borderRadius.large,
                      padding: 'clamp(12px, 3vw, 16px)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 'clamp(80px, 18vw, 120px)',
                      aspectRatio: '1',
                      boxShadow: AURORA_THEME.elevations.level2,
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <img
                      src={sticker.icon}
                      alt={sticker.name}
                      style={{
                        width: 'clamp(50px, 12vw, 80px)',
                        height: 'clamp(50px, 12vw, 80px)',
                        objectFit: 'contain',
                      }}
                    />
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </motion.div>
  );
};
