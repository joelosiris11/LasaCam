import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { DownloadIcon, RotateIcon } from './icons';
import AURORA_THEME from '../styles/theme';
import lasalogo from '../assets/buttons/lasalogo.png';

interface SuccessScreenProps {
  imageData: string;
  onReset: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ imageData, onReset }) => {
  useEffect(() => {
    downloadImage();
  }, []);

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `LasaCam-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delay: 0.2, duration: 0.6 },
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
        width: '100vw',
        height: '100vh',
        padding: 'clamp(16px, 4vw, 32px)',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        style={{
          textAlign: 'center',
          maxWidth: '90vw',
          width: '100%',
          maxHeight: '100vh',
          overflowY: 'auto',
          paddingRight: 'clamp(4px, 1vw, 8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        variants={contentVariants}
      >
        {/* Logo y título */}
        <motion.div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 'clamp(24px, 6vw, 40px)',
            gap: 'clamp(8px, 2vw, 12px)',
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <img
            src={lasalogo}
            alt="La Aurora"
            style={{
              width: 'clamp(80px, 20vw, 120px)',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
          <h1 style={{
            color: AURORA_THEME.colors.blueDark,
            fontSize: AURORA_THEME.typography.h1.fontSize,
            fontWeight: 700,
            letterSpacing: '1px',
            margin: 0,
            fontFamily: '"DynaPuff", cursive',
          }}>
            La Aurora
          </h1>
          <h2 style={{
            color: AURORA_THEME.colors.blueDark,
            fontSize: AURORA_THEME.typography.h3.fontSize,
            fontWeight: 600,
            margin: 0,
            fontFamily: '"Montserrat", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            PHOTO
          </h2>
        </motion.div>

        {/* Mensaje de éxito */}
        <motion.div
          style={{
            marginBottom: 'clamp(24px, 6vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 12px)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div style={{
            width: 'clamp(80px, 20vw, 120px)',
            height: 'clamp(80px, 20vw, 120px)',
            borderRadius: AURORA_THEME.borderRadius.round,
            background: AURORA_THEME.colors.gold,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: AURORA_THEME.elevations.level8,
          }}>
            <span style={{
              fontSize: 'clamp(48px, 12vw, 72px)',
            }}>
              ✓
            </span>
          </div>
          <h2 style={{
            color: AURORA_THEME.colors.blueDark,
            fontSize: AURORA_THEME.typography.h2.fontSize,
            fontWeight: 700,
            margin: 0,
            fontFamily: '"DynaPuff", cursive',
          }}>
            ¡Perfecto!
          </h2>
          <p style={{
            color: AURORA_THEME.colors.blueDark,
            fontSize: AURORA_THEME.typography.body.fontSize,
            margin: 0,
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 400,
            opacity: 0.8,
            lineHeight: 1.6,
          }}>
            Tu foto con stickers se ha descargado correctamente en tu dispositivo.
          </p>
        </motion.div>

        {/* Preview */}
        <motion.div
          style={{
            marginBottom: 'clamp(16px, 4vw, 24px)',
            borderRadius: AURORA_THEME.borderRadius.xlarge,
            overflow: 'auto',
            boxShadow: AURORA_THEME.elevations.level12,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            backgroundColor: AURORA_THEME.colors.black,
            border: `3px solid ${AURORA_THEME.colors.blueDark}`,
            maxHeight: '60vh',
            maxWidth: '90vw',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <img
            src={imageData}
            alt="Final result"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              minWidth: '200px',
            }}
          />
        </motion.div>

        {/* Botones de acción */}
        <motion.div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 16px)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            width: '100%',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            onClick={downloadImage}
            whileHover={{ scale: 1.05, boxShadow: AURORA_THEME.elevations.level8 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: AURORA_THEME.colors.blueDark,
              color: AURORA_THEME.colors.white,
              border: 'none',
              padding: 'clamp(12px, 3vw, 16px) clamp(24px, 6vw, 32px)',
              fontSize: AURORA_THEME.typography.button.fontSize,
              fontWeight: 600,
              fontFamily: '"Montserrat", sans-serif',
              textTransform: AURORA_THEME.typography.button.textTransform,
              letterSpacing: AURORA_THEME.typography.button.letterSpacing,
              borderRadius: AURORA_THEME.borderRadius.pill,
              cursor: 'pointer',
              boxShadow: AURORA_THEME.elevations.level4,
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 2vw, 12px)',
            }}
          >
            <DownloadIcon size={24} />
            Descargar de nuevo
          </motion.button>

          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.05, boxShadow: AURORA_THEME.elevations.level4 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: AURORA_THEME.colors.white,
              color: AURORA_THEME.colors.blueDark,
              border: `2px solid ${AURORA_THEME.colors.blueDark}`,
              padding: 'clamp(12px, 3vw, 16px) clamp(24px, 6vw, 32px)',
              fontSize: AURORA_THEME.typography.button.fontSize,
              fontWeight: 600,
              fontFamily: '"Montserrat", sans-serif',
              textTransform: AURORA_THEME.typography.button.textTransform,
              letterSpacing: AURORA_THEME.typography.button.letterSpacing,
              borderRadius: AURORA_THEME.borderRadius.pill,
              cursor: 'pointer',
              boxShadow: AURORA_THEME.elevations.level2,
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 2vw, 12px)',
            }}
          >
            <RotateIcon size={24} />
            Crear otra
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
