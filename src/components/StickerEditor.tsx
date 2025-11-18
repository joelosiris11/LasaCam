import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiDownload, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
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
}

export const StickerEditor: React.FC<StickerEditorProps> = ({ photoData, onSave, onBackClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [selectedStickerIndex, setSelectedStickerIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({ touches: [] });

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
    e.stopPropagation();

    if (e.touches.length === 2 && touchState.initialDistance !== undefined) {
      // Gesto de pinch para zoom
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = (currentDistance / touchState.initialDistance) * (touchState.initialScale || 1);
      updateSticker(index, { scale: Math.max(0.3, Math.min(3, scale)) });
    } else if (e.touches.length === 1 && touchState.touches.length === 1) {
      // Gesto de drag para mover
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      const stickerSize = Math.min(containerWidth, containerHeight) * 0.15;
      
      const deltaX = e.touches[0].clientX - touchState.touches[0].clientX;
      const deltaY = e.touches[0].clientY - touchState.touches[0].clientY;

      updateSticker(index, {
        x: Math.max(0, Math.min(placedStickers[index].x + deltaX, containerWidth - stickerSize)),
        y: Math.max(0, Math.min(placedStickers[index].y + deltaY, containerHeight - stickerSize)),
      });

      setTouchState({
        touches: Array.from(e.touches),
      });
    }
  };

  const handleTouchEnd = () => {
    setTouchState({ touches: [] });
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

            if (placedStickers.length === 0) {
              const canvasData = canvasRef.current!.toDataURL('image/jpeg', 0.95);
              onSave(canvasData);
              return;
            }

            const containerRect = containerRef.current!.getBoundingClientRect();
            let containerWidth = containerRect.width;
            
            if (containerWidth === 0 || containerWidth < 100) {
              const containerHeight = containerRect.height;
              containerWidth = (containerHeight * 9) / 16;
            }
            
            const scale = img.width / containerWidth;

            let loadedCount = 0;
            const totalStickers = placedStickers.length;

            placedStickers.forEach((sticker) => {
              const stickerDef = AVAILABLE_STICKERS.find(s => s.id === sticker.stickerId);
              if (stickerDef) {
                const stickerImg = new Image();
                stickerImg.crossOrigin = 'anonymous';
                
                stickerImg.onload = () => {
                  ctx.save();
                  
                  const realX = sticker.x * scale;
                  const realY = sticker.y * scale;
                  const realStickerWidth = stickerImg.width * sticker.scale;
                  const realStickerHeight = stickerImg.height * sticker.scale;
                  
                  const centerX = realX + (realStickerWidth) / 2;
                  const centerY = realY + (realStickerHeight) / 2;
                  
                  ctx.translate(centerX, centerY);
                  ctx.rotate((sticker.rotation * Math.PI) / 180);
                  ctx.scale(sticker.scale, sticker.scale);
                  ctx.drawImage(stickerImg, -stickerImg.width / 2, -stickerImg.height / 2);
                  
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
      {/* Header */}
      <motion.div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)',
          background: AURORA_THEME.colors.beige,
          borderBottom: `1px solid ${AURORA_THEME.colors.beigeDark}`,
          zIndex: 10,
          boxShadow: AURORA_THEME.elevations.level2,
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.button
          onClick={onBackClick}
          style={{
            background: 'transparent',
            border: `2px solid ${AURORA_THEME.colors.blueDark}`,
            borderRadius: AURORA_THEME.borderRadius.round,
            color: AURORA_THEME.colors.blueDark,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'clamp(40px, 10vw, 48px)',
            height: 'clamp(40px, 10vw, 48px)',
            boxShadow: AURORA_THEME.elevations.level1,
          }}
          whileHover={{ scale: 1.1, boxShadow: AURORA_THEME.elevations.level3 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiArrowLeft size="clamp(20px, 5vw, 24px)" />
        </motion.button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 2vw, 12px)',
        }}>
          <img
            src={lasalogo}
            alt="La Aurora"
            style={{
              width: 'clamp(32px, 8vw, 40px)',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
          <h2 style={{
            color: AURORA_THEME.colors.blueDark,
            fontSize: AURORA_THEME.typography.h3.fontSize,
            fontWeight: AURORA_THEME.typography.h3.fontWeight,
            margin: 0,
            fontFamily: AURORA_THEME.typography.fontFamily,
          }}>
            Editor de Foto
          </h2>
        </div>

        <div style={{ width: 'clamp(40px, 10vw, 48px)' }} />
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
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={(e) => handleTouchMove(e, index)}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => setSelectedStickerIndex(index)}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  style={{
                    position: 'absolute',
                    left: `${sticker.x}px`,
                    top: `${sticker.y}px`,
                    cursor: 'grab',
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Botones flotantes inferiores */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 'clamp(12px, 3vw, 24px)',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 'clamp(12px, 2vw, 20px)',
          zIndex: 5,
        }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Botón flotante para agregar stickers */}
        <motion.button
          onClick={() => setShowModal(true)}
          style={{
            width: 'clamp(56px, 14vw, 72px)',
            height: 'clamp(56px, 14vw, 72px)',
            borderRadius: AURORA_THEME.borderRadius.round,
            background: AURORA_THEME.colors.white,
            border: `3px solid ${AURORA_THEME.colors.blueDark}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(8px, 2vw, 12px)',
            boxShadow: AURORA_THEME.elevations.level6,
          }}
          whileHover={{ scale: 1.15, boxShadow: AURORA_THEME.elevations.level8 }}
          whileTap={{ scale: 0.9 }}
        >
          <img
            src={bstiker}
            alt="Añadir Stickers"
            style={{
              width: 'clamp(24px, 6vw, 32px)',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </motion.button>

        {/* Botón para guardar */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: 'clamp(56px, 14vw, 72px)',
            height: 'clamp(56px, 14vw, 72px)',
            borderRadius: AURORA_THEME.borderRadius.round,
            background: saving ? AURORA_THEME.colors.beigeDark : AURORA_THEME.colors.white,
            border: `3px solid ${AURORA_THEME.colors.blueDark}`,
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(8px, 2vw, 12px)',
            boxShadow: AURORA_THEME.elevations.level6,
            opacity: saving ? 0.7 : 1,
          }}
          whileHover={!saving ? { scale: 1.15, boxShadow: AURORA_THEME.elevations.level8 } : undefined}
          whileTap={!saving ? { scale: 0.9 } : undefined}
        >
          <FiDownload size="clamp(24px, 6vw, 32px)" color={AURORA_THEME.colors.blueDark} strokeWidth={2} />
        </motion.button>
      </motion.div>

      {/* Panel de control simple - solo botón eliminar */}
      <AnimatePresence>
        {selectedStickerIndex !== null && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: 'clamp(100px, 25vw, 140px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: AURORA_THEME.colors.white,
              border: `2px solid ${AURORA_THEME.colors.blueDark}`,
              borderRadius: AURORA_THEME.borderRadius.large,
              padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(12px, 3vw, 16px)',
              zIndex: 4,
              boxShadow: AURORA_THEME.elevations.level8,
              maxWidth: '90%',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div style={{ 
              flex: 1, 
              color: AURORA_THEME.colors.blueDark, 
              fontSize: AURORA_THEME.typography.body.fontSize, 
              fontFamily: AURORA_THEME.typography.fontFamily,
            }}>
              📌 Arrastra • 🤏 Pinch zoom • 🔄 Rota
            </div>

            <motion.button
              onClick={() => removeSticker(selectedStickerIndex)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                background: AURORA_THEME.colors.white,
                color: AURORA_THEME.colors.blueDark,
                border: `2px solid ${AURORA_THEME.colors.blueDark}`,
                borderRadius: AURORA_THEME.borderRadius.medium,
                cursor: 'pointer',
                fontSize: AURORA_THEME.typography.body.fontSize,
                fontWeight: 500,
                fontFamily: AURORA_THEME.typography.fontFamily,
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(6px, 1.5vw, 8px)',
                boxShadow: AURORA_THEME.elevations.level2,
              }}
            >
              <FiTrash2 size="clamp(16px, 4vw, 20px)" />
              Eliminar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

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
                  fontWeight: AURORA_THEME.typography.h3.fontWeight,
                  margin: 0,
                  fontFamily: AURORA_THEME.typography.fontFamily,
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
