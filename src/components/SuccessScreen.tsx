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
  const hasDownloadedRef = React.useRef(false);

  useEffect(() => {
    if (!hasDownloadedRef.current) {
      downloadImage();
      uploadImage(); // Subir al servidor
      hasDownloadedRef.current = true;
    }
  }, []);

  const uploadImage = async () => {
    try {
      // Convertir base64 a Blob
      const res = await fetch(imageData);
      const blob = await res.blob();

      console.log(`Preparando subida. Tamaño: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

      const formData = new FormData();
      formData.append('photo', blob, `lasacam-${Date.now()}.jpg`);

      // En producción, usar ruta relativa para evitar problemas de CORS/Protocolo
      const apiUrl = '/backend/api/upload';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // No establecer Content-Type header manualmente con FormData, 
        // el navegador lo hace correctamente con el boundary.
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      console.log('Foto subida al servidor correctamente');
    } catch (error) {
      console.error('Error detallado subiendo foto:', error);
    }
  };

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
          height: '100%', // Ocupar todo el alto disponible
          overflow: 'hidden', // Evitar scroll
          padding: 'clamp(8px, 2vw, 16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between', // Distribuir espacio verticalmente
        }}
        variants={contentVariants}
      >
        {/* Logo y título */}
        <motion.div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: 'clamp(16px, 4vw, 24px)',
            marginBottom: 'clamp(8px, 2vw, 16px)',
            flexShrink: 0,
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <img
            src={lasalogo}
            alt="La Aurora"
            style={{
              width: 'clamp(140px, 35vw, 200px)', // Mucho más grande
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))', // Sutil sombra para dar profundidad
            }}
          />
        </motion.div>

        {/* Preview - Ahora es el protagonista */}
        <motion.div
          style={{
            borderRadius: AURORA_THEME.borderRadius.xlarge,
            overflow: 'hidden',
            boxShadow: AURORA_THEME.elevations.level12,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: AURORA_THEME.colors.black,
            border: `4px solid ${AURORA_THEME.colors.white}`, // Borde blanco tipo polaroid/foto
            flexGrow: 1, // Ocupar todo el espacio posible
            width: 'auto',
            height: 'auto',
            maxHeight: '65vh', // Darle más altura máxima
            aspectRatio: '9/16',
            margin: '8px 0',
            position: 'relative',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <img
            src={imageData}
            alt="Final result"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </motion.div>

        {/* Mensaje Compacto */}
        <motion.div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '16px',
            flexShrink: 0,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 style={{
            color: AURORA_THEME.colors.blueDark,
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: 700,
            margin: 0,
            fontFamily: '"DynaPuff", cursive',
          }}>
            ¡Perfecto!
          </h2>
          <p style={{
            color: AURORA_THEME.colors.blueDark,
            fontSize: 'clamp(12px, 3vw, 14px)',
            margin: 0,
            fontFamily: '"Montserrat", sans-serif',
            opacity: 0.7,
          }}>
            Foto guardada en tu galería
          </p>
        </motion.div>



        {/* Botones de acción */}
        <motion.div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 16px)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            width: '100%',
            marginBottom: 'clamp(16px, 4vw, 24px)',
            flexShrink: 0, // No encoger botones
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
