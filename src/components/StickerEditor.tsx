import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiDownload, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
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
      const stickerSize = Math.min(containerWidth, containerHeight) * 0.15; // 15% del tamaño del contenedor
      
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

            // Si no hay stickers, guardar solo la foto
            if (placedStickers.length === 0) {
              const canvasData = canvasRef.current!.toDataURL('image/jpeg', 0.95);
              onSave(canvasData);
              return;
            }

            // Calcular escala: relación entre tamaño real de foto y tamaño visual del contenedor
            const containerRect = containerRef.current!.getBoundingClientRect();
            let containerWidth = containerRect.width;
            
            // Si el contenedor no tiene ancho válido, calcular basado en altura y aspect ratio
            if (containerWidth === 0 || containerWidth < 100) {
              const containerHeight = containerRect.height;
              containerWidth = (containerHeight * 9) / 16; // aspect ratio 9:16
            }
            
            const scale = img.width / containerWidth; // Escala para conversión de píxeles visuales a píxeles reales

            // Dibujar stickers
            let loadedCount = 0;
            const totalStickers = placedStickers.length;

            placedStickers.forEach((sticker) => {
              const stickerDef = AVAILABLE_STICKERS.find(s => s.id === sticker.stickerId);
              if (stickerDef) {
                const stickerImg = new Image();
                stickerImg.crossOrigin = 'anonymous';
                
                stickerImg.onload = () => {
                  ctx.save();
                  
                  // Convertir posiciones visuales a posiciones reales del canvas
                  const realX = sticker.x * scale;
                  const realY = sticker.y * scale;
                  const realStickerWidth = stickerImg.width * sticker.scale;
                  const realStickerHeight = stickerImg.height * sticker.scale;
                  
                  // Calcular el centro del sticker en coordenadas reales
                  const centerX = realX + (realStickerWidth) / 2;
                  const centerY = realY + (realStickerHeight) / 2;
                  
                  // Mover al centro, rotar, escalar y dibujar
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
        background: '#000000',
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
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 107, 53, 0.2)',
          zIndex: 10,
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.button
          onClick={onBackClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiArrowLeft size={24} />
        </motion.button>

        <h2 style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          margin: 0,
        }}>
          Editor de Foto
        </h2>

        <div style={{ width: '40px' }} />
      </motion.div>

      {/* Contenedor de foto con stickers */}
      <motion.div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          backgroundColor: '#000',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          aspectRatio: '9/16',
          maxHeight: 'calc(100vh - 60px)',
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
                    border: selectedStickerIndex === index ? '2px solid #FF6B35' : 'none',
                    borderRadius: '8px',
                    padding: selectedStickerIndex === index ? '4px' : '0px',
                    backgroundColor: selectedStickerIndex === index ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                    touchAction: 'none',
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
            width: 'clamp(48px, 12vw, 64px)',
            height: 'clamp(48px, 12vw, 64px)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(255, 107, 53, 0.4)',
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiPlus size="clamp(24px, 6vw, 32px)" color="white" strokeWidth={2} />
        </motion.button>

        {/* Botón para guardar */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: 'clamp(48px, 12vw, 64px)',
            height: 'clamp(48px, 12vw, 64px)',
            borderRadius: '50%',
            background: saving ? 'rgba(255, 107, 53, 0.5)' : 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(255, 107, 53, 0.4)',
            opacity: saving ? 0.7 : 1,
          }}
          whileHover={!saving ? { scale: 1.15 } : undefined}
          whileTap={!saving ? { scale: 0.9 } : undefined}
        >
          <FiDownload size="clamp(24px, 6vw, 32px)" color="white" strokeWidth={2} />
        </motion.button>
      </motion.div>

      {/* Panel de control simple - solo botón eliminar */}
      <AnimatePresence>
        {selectedStickerIndex !== null && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: 'clamp(80px, 20vw, 120px)',
              left: 'clamp(12px, 3vw, 20px)',
              right: 'clamp(12px, 3vw, 20px)',
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 107, 53, 0.3)',
              borderRadius: '12px',
              padding: 'clamp(8px, 2vw, 16px)',
              display: 'flex',
              gap: 'clamp(8px, 1.5vw, 12px)',
              zIndex: 4,
              flexWrap: 'wrap',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div style={{ flex: 1, color: 'white', fontSize: 'clamp(10px, 2vw, 14px)', display: 'flex', alignItems: 'center' }}>
              📌 Arrastra • 🤏 Pinch zoom • 🔄 Rota
            </div>

            <motion.button
              onClick={() => removeSticker(selectedStickerIndex)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: 'clamp(6px, 1.5vw, 12px) clamp(12px, 2vw, 20px)',
                background: 'rgba(255, 67, 54, 0.3)',
                color: 'white',
                border: '1px solid rgba(255, 67, 54, 0.5)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 'clamp(10px, 2vw, 14px)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FiTrash2 size={16} />
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
                background: 'rgba(20, 20, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255, 107, 53, 0.2)',
                borderRadius: '20px 20px 0 0',
                padding: 'clamp(12px, 3vw, 24px)',
                width: '100%',
                maxHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
              }}
              initial={{ y: 500 }}
              animate={{ y: 0 }}
              exit={{ y: 500 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{
                color: 'white',
                fontSize: 'clamp(16px, 4vw, 22px)',
                fontWeight: '600',
                marginBottom: 'clamp(8px, 2vw, 16px)',
                marginTop: 0,
              }}>
                Selecciona un sticker
              </h3>

              {/* Grid de stickers con scroll */}
              <motion.div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(70px, 15vw, 100px), 1fr))',
                  gap: 'clamp(8px, 2vw, 16px)',
                  overflowY: 'auto',
                  paddingRight: '8px',
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
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 107, 53, 0.3)',
                      borderRadius: '12px',
                      padding: 'clamp(8px, 2vw, 16px)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 'clamp(80px, 18vw, 120px)',
                      aspectRatio: '1',
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
