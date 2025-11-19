import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AURORA_THEME from '../styles/theme';
import lasalogo from '../assets/buttons/lasalogo.png';
import bcamera from '../assets/buttons/bcamera.png';
import bfiltros from '../assets/buttons/bfiltros.png';
import { ImageIcon } from './icons';
import { PublicGallery } from './PublicGallery';

interface CameraCaptureProps {
  onPhotoTaken: (photoData: string) => void;
}

interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoTaken }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [showFilters, setShowFilters] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
  });
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        // Detener stream anterior si existe
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: facingMode === 'user' ? 720 : 1080 },
            height: { ideal: facingMode === 'user' ? 1280 : 1920 },
            aspectRatio: { ideal: 9 / 16 }
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setLoading(false);
        }
      } catch (error) {
        console.error('Error starting camera:', error);
        setLoading(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // Aplicar filtros al video
  useEffect(() => {
    if (videoRef.current) {
      const filterString = `
        brightness(${filterSettings.brightness}%)
        contrast(${filterSettings.contrast}%)
        saturate(${filterSettings.saturation}%)
        hue-rotate(${filterSettings.hue}deg)
      `.trim().replace(/\s+/g, ' ');
      videoRef.current.style.filter = filterString;
    }
  }, [filterSettings]);

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;

        // Forzar aspect ratio 9:16 (vertical)
        let canvasWidth = 1080;
        let canvasHeight = 1920;

        // Si el video no es vertical, ajustar para mantener 9:16
        const videoAspect = videoWidth / videoHeight;
        const targetAspect = 9 / 16;

        if (Math.abs(videoAspect - targetAspect) > 0.01) {
          // El video no es 9:16, calcular el área a capturar
          if (videoAspect > targetAspect) {
            // Video más ancho, recortar los lados
            canvasWidth = Math.floor(videoHeight * targetAspect);
            canvasHeight = videoHeight;
          } else {
            // Video más alto, recortar arriba/abajo
            canvasWidth = videoWidth;
            canvasHeight = Math.floor(videoWidth / targetAspect);
          }
        } else {
          // Video ya es 9:16, usar dimensiones reales
          canvasWidth = videoWidth;
          canvasHeight = videoHeight;
        }

        canvasRef.current.width = canvasWidth;
        canvasRef.current.height = canvasHeight;

        // Calcular offsets para centrar el recorte
        const offsetX = (videoWidth - canvasWidth) / 2;
        const offsetY = (videoHeight - canvasHeight) / 2;

        // Aplicar transformación de espejo
        context.translate(canvasWidth, 0);
        context.scale(-1, 1);

        // Aplicar filtros al canvas
        context.filter = `
          brightness(${filterSettings.brightness}%)
          contrast(${filterSettings.contrast}%)
          saturate(${filterSettings.saturation}%)
          hue-rotate(${filterSettings.hue}deg)
        `.trim().replace(/\s+/g, ' ');

        // Dibujar la porción centrada del video
        context.drawImage(
          videoRef.current,
          offsetX, offsetY, canvasWidth, canvasHeight,
          0, 0, canvasWidth, canvasHeight
        );

        const photoData = canvasRef.current.toDataURL('image/jpeg', 0.95);
        onPhotoTaken(photoData);
      }
    }
  };

  const toggleCamera = () => {
    setLoading(true);
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  const handleGalleryClick = () => {
    setShowGallery(true);
  };

  const updateFilter = (key: keyof FilterSettings, value: number) => {
    setFilterSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilterSettings({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
    });
  };

  return (
    <motion.div
      style={{
        background: AURORA_THEME.colors.beige,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        padding: 0,
        margin: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Video container - fullscreen vertical */}
      <div style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AURORA_THEME.colors.black,
        overflow: 'hidden',
      }}>
        {loading && (
          <LoadingSpinner />
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: 'auto',
            height: '100vh',
            maxWidth: '100vw',
            objectFit: facingMode === 'user' ? 'contain' : 'cover',
            transform: 'scaleX(-1)',
          }}
        />
      </div>

      {/* Header con logo - Solo logo grande */}
      <motion.div
        style={{
          position: 'absolute',
          top: 'clamp(16px, 4vw, 32px)',
          left: '0',
          right: '0',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <img
          src={lasalogo}
          alt="La Aurora"
          style={{
            width: 'clamp(120px, 30vw, 160px)', // Logo mucho más grande
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))', // Sombra para contraste sobre video
          }}
        />
      </motion.div>

      {/* Galería Pública */}
      <AnimatePresence>
        {showGallery && (
          <PublicGallery onBack={() => setShowGallery(false)} />
        )}
      </AnimatePresence>

      {/* Panel de filtros - pestaña desde el botón */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Overlay muy transparente - sin blur para no afectar la cámara */}
            <motion.div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.1)',
                zIndex: 14,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />
            {/* Panel de filtros */}
            <motion.div
              style={{
                position: 'fixed',
                top: 'clamp(156px, 39vw, 216px)',
                right: 'clamp(12px, 3vw, 24px)',
                background: `rgba(245, 240, 230, 0.4)`,
                backdropFilter: 'blur(6px)',
                border: `2px solid ${AURORA_THEME.colors.blueDark}`,
                borderRadius: AURORA_THEME.borderRadius.xlarge,
                padding: 'clamp(20px, 5vw, 28px)',
                zIndex: 15,
                boxShadow: AURORA_THEME.elevations.level16,
                minWidth: 'clamp(260px, 65vw, 360px)',
                maxWidth: '85vw',
              }}
              initial={{ opacity: 0, scale: 0, transformOrigin: 'top right' }}
              animate={{ opacity: 1, scale: 1, transformOrigin: 'top right' }}
              exit={{ opacity: 0, scale: 0, transformOrigin: 'top right' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                marginBottom: 'clamp(16px, 4vw, 24px)',
              }}>
                <h3 style={{
                  color: AURORA_THEME.colors.blueDark,
                  fontSize: AURORA_THEME.typography.h3.fontSize,
                  fontWeight: 700,
                  margin: 0,
                  fontFamily: '"DynaPuff", cursive',
                  textShadow: '0 1px 3px rgba(255, 255, 255, 0.9)',
                }}>
                  Filtros
                </h3>
              </div>

              {/* Controles de filtros */}
              {(['brightness', 'contrast', 'saturation', 'hue'] as const).map((filter) => {
                const labels: Record<typeof filter, string> = {
                  brightness: 'Brillo',
                  contrast: 'Contraste',
                  saturation: 'Saturación',
                  hue: 'Tono',
                };
                const ranges: Record<typeof filter, { min: number; max: number }> = {
                  brightness: { min: 0, max: 200 },
                  contrast: { min: 0, max: 200 },
                  saturation: { min: 0, max: 200 },
                  hue: { min: -180, max: 180 },
                };

                return (
                  <div key={filter} style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
                    <label style={{
                      display: 'block',
                      color: AURORA_THEME.colors.blueDark,
                      fontSize: AURORA_THEME.typography.body.fontSize,
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 700,
                      marginBottom: 'clamp(4px, 1vw, 6px)',
                      textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
                    }}>
                      {labels[filter]}: {filterSettings[filter]}{filter === 'hue' ? '°' : '%'}
                    </label>
                    <input
                      type="range"
                      min={ranges[filter].min}
                      max={ranges[filter].max}
                      value={filterSettings[filter]}
                      onChange={(e) => updateFilter(filter, Number(e.target.value))}
                      className="aurora-slider"
                    />
                  </div>
                );
              })}

              {/* Botón Reset abajo */}
              <motion.button
                onClick={resetFilters}
                style={{
                  width: '100%',
                  marginTop: 'clamp(12px, 3vw, 16px)',
                  background: AURORA_THEME.colors.white,
                  border: `2px solid ${AURORA_THEME.colors.blueDark}`,
                  borderRadius: AURORA_THEME.borderRadius.medium,
                  padding: 'clamp(10px, 2.5vw, 14px)',
                  color: AURORA_THEME.colors.blueDark,
                  cursor: 'pointer',
                  fontSize: AURORA_THEME.typography.body.fontSize,
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 600,
                  boxShadow: AURORA_THEME.elevations.level2,
                }}
                whileHover={{ scale: 1.02, boxShadow: AURORA_THEME.elevations.level4 }}
                whileTap={{ scale: 0.98 }}
              >
                Reset
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Barra de navegación inferior */}
      <motion.div
        style={{
          position: 'fixed',
          bottom: 'clamp(20px, 5vw, 40px)',
          left: 0,
          right: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 clamp(12px, 3vw, 24px)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Botón Gallery (Izquierda) */}
        <motion.button
          onClick={handleGalleryClick}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 8px)',
            width: '80px', // Ancho fijo para alinear
            pointerEvents: 'auto',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div style={{
            width: 'clamp(40px, 10vw, 48px)',
            height: 'clamp(40px, 10vw, 48px)',
            background: 'rgba(255, 255, 255, 0.2)', // Fondo semitransparente
            backdropFilter: 'blur(4px)',
            borderRadius: AURORA_THEME.borderRadius.medium,
            border: `2px solid ${AURORA_THEME.colors.white}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ImageIcon size={24} color={AURORA_THEME.colors.white} />
          </div>
          <span style={{
            color: AURORA_THEME.colors.white,
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: '"Montserrat", sans-serif',
            textTransform: 'uppercase',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            GALLERY
          </span>
        </motion.button>

        {/* Botón principal de captura (Centro) */}
        <motion.button
          onClick={handleTakePhoto}
          style={{
            width: 'clamp(80px, 20vw, 100px)',
            height: 'clamp(80px, 20vw, 100px)',
            borderRadius: AURORA_THEME.borderRadius.round,
            background: 'transparent',
            border: `4px solid ${AURORA_THEME.colors.white}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div style={{
            width: 'clamp(64px, 16vw, 84px)',
            height: 'clamp(64px, 16vw, 84px)',
            borderRadius: AURORA_THEME.borderRadius.round,
            background: AURORA_THEME.colors.white,
          }} />
        </motion.button>

        {/* Controles Derecha (Filtros y Cámara) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '80px', // Ancho fijo para alinear
          alignItems: 'center',
        }}>
          {/* Botón Cámara */}
          <motion.button
            onClick={toggleCamera}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: 0,
              opacity: loading ? 0.5 : 1,
              pointerEvents: 'auto',
            }}
            whileHover={!loading ? { scale: 1.1 } : undefined}
            whileTap={!loading ? { scale: 0.9 } : undefined}
          >
            <img
              src={bcamera}
              alt="Cambiar cámara"
              style={{
                width: 'clamp(40px, 10vw, 48px)',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            />
          </motion.button>

          {/* Botón Filtros */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              pointerEvents: 'auto',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <img
              src={bfiltros}
              alt="Filtros"
              style={{
                width: 'clamp(40px, 10vw, 48px)',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            />
          </motion.button>
        </div>
      </motion.div>

      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </motion.div>
  );
};

const LoadingSpinner: React.FC = () => {
  return (
    <motion.div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={{
          width: 'clamp(60px, 15vw, 100px)',
          height: 'clamp(60px, 15vw, 100px)',
          border: `4px solid rgba(212, 175, 55, 0.3)`,
          borderTop: `4px solid ${AURORA_THEME.colors.gold}`,
          borderRadius: AURORA_THEME.borderRadius.round,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
};
