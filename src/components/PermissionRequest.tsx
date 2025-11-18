import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AURORA_THEME from '../styles/theme';
import lasalogo from '../assets/buttons/lasalogo.png';
import bcapturaelpuro from '../assets/buttons/bcapturaelpuro.png';
import { AVAILABLE_STICKERS } from '../utils/stickers';

interface PermissionRequestProps {
  onPermissionGranted: () => void;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({ onPermissionGranted }) => {
  const handleRequestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      stream.getTracks().forEach(track => track.stop());
      onPermissionGranted();
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      alert('Permiso de cámara denegado');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6 },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.2, duration: 0.5 },
    },
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delay: 0.3, duration: 0.6, type: 'spring' },
    },
  };

  return (
    <motion.div
      style={{
        background: AURORA_THEME.colors.beige,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        padding: 'clamp(20px, 5vw, 40px)',
        position: 'relative',
        overflow: 'hidden',
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animación de stickers en el fondo */}
      <StickerCarousel />

      <motion.div
        style={{
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
        variants={contentVariants}
      >
        {/* Logo - mucho más grande */}
        <motion.div
          style={{
            marginBottom: 'clamp(32px, 8vw, 48px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(12px, 3vw, 16px)',
          }}
          variants={logoVariants}
        >
          <img
            src={lasalogo}
            alt="La Aurora Logo"
            style={{
              width: 'clamp(200px, 50vw, 350px)',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
          <h2 style={{
            color: AURORA_THEME.colors.blueDark,
            fontSize: AURORA_THEME.typography.h2.fontSize,
            fontWeight: AURORA_THEME.typography.h2.fontWeight,
            margin: 0,
            fontFamily: AURORA_THEME.typography.fontFamily,
            textTransform: 'uppercase',
            letterSpacing: '3px',
          }}>
            PHOTOBOOTH
          </h2>
        </motion.div>

        {/* Botón principal */}
        <motion.button
          onClick={handleRequestPermission}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 'clamp(32px, 8vw, 48px)',
            boxShadow: AURORA_THEME.elevations.level4,
            borderRadius: AURORA_THEME.borderRadius.large,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: AURORA_THEME.elevations.level8,
          }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src={bcapturaelpuro}
            alt="Captura el Puro Momento"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              maxWidth: 'clamp(280px, 70vw, 400px)',
            }}
          />
        </motion.button>

        {/* Footer */}
        <motion.p
          style={{
            color: AURORA_THEME.colors.blueDark,
            fontSize: AURORA_THEME.typography.body.fontSize,
            margin: 0,
            fontFamily: AURORA_THEME.typography.fontFamily,
            opacity: 0.7,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.6 }}
        >
          Hecho en la República Dominicana
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

// Componente de carrusel de stickers animado
const StickerCarousel: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    // Obtener dimensiones del viewport
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Duplicar los stickers para crear un carrusel continuo
  const duplicatedStickers = [...AVAILABLE_STICKERS, ...AVAILABLE_STICKERS, ...AVAILABLE_STICKERS];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
        width: '100vw',
        height: '100vh',
      }}
    >
      {duplicatedStickers.map((sticker, index) => {
        // Variar el tamaño y velocidad para más naturalidad
        // Usar un seed basado en el index para consistencia
        const seed = index * 7.3; // Número primo para mejor distribución
        const size = Math.abs(Math.sin(seed) * 40 + 60); // Entre 20px y 100px
        const duration = Math.abs(Math.cos(seed) * 20 + 35); // Entre 15s y 55s
        const delay = (index * 2) % 30; // Espaciar los stickers
        
        // Generar direcciones aleatorias pero consistentes
        const angle = (seed * 137.5) % 360; // Ángulo dorado para distribución uniforme
        const angleRad = (angle * Math.PI) / 180;
        
        // Empezar desde posiciones aleatorias DENTRO de la pantalla
        const startX = (seed * 23.7) % dimensions.width;
        const startY = (seed * 31.3) % dimensions.height;
        
        // Calcular punto de salida en dirección aleatoria
        const exitAngle = angleRad;
        const distance = Math.sqrt(dimensions.width ** 2 + dimensions.height ** 2) + 300;
        const endX = startX + Math.cos(exitAngle) * distance;
        const endY = startY + Math.sin(exitAngle) * distance;
        
        // Rotación suave
        const initialRotate = (seed * 57.3) % 360;
        const rotationSpeed = (Math.sin(seed) * 2 + 1) * 180; // Entre 180 y 540 grados
        const finalRotate = initialRotate + rotationSpeed;
        
        return (
          <motion.div
            key={`${sticker.id}-${index}`}
            style={{
              position: 'absolute',
              width: `${size}px`,
              height: `${size}px`,
              opacity: 0.2, // Opacidad baja pero visible
            }}
            initial={{
              x: startX,
              y: startY,
              rotate: initialRotate,
            }}
            animate={{
              x: endX,
              y: endY,
              rotate: finalRotate,
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              repeatDelay: 0,
              ease: 'linear',
            }}
          >
            <img
              src={sticker.icon}
              alt={sticker.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
              onError={(e) => {
                // Si la imagen no carga, intentar con ruta alternativa
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('data:')) {
                  console.warn('Sticker image failed to load:', sticker.icon);
                }
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};
