import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DownloadIcon, RotateIcon } from './icons';
import AURORA_THEME from '../styles/theme';
import lasalogo from '../assets/buttons/lasalogo.png';

interface SuccessScreenProps {
  imageData: string;
  onReset: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ imageData, onReset }) => {
  const [uploading, setUploading] = useState(true);
  const [uploadError, setUploadError] = useState(false);
  const hasProcessedRef = React.useRef(false);

  useEffect(() => {
    if (!hasProcessedRef.current) {
      uploadAndDownload();
      hasProcessedRef.current = true;
    }
  }, []);

  const uploadAndDownload = async () => {
    try {
      setUploading(true);
      setUploadError(false);

      // Convertir base64 a Blob
      const res = await fetch(imageData);
      const blob = await res.blob();

      console.log(`Preparando subida. Tamaño: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

      const formData = new FormData();
      formData.append('photo', blob, `lasacam-${Date.now()}.jpg`);

      // Frontend on Firebase, backend on fixed server
      const apiUrl = 'https://test.t-ecogroup.net/backend/api/upload';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Foto subida al servidor correctamente:', responseData);

      // Ahora que se subió exitosamente, descargar la imagen
      setUploading(false);
      downloadImage();
    } catch (error) {
      console.error('Error detallado subiendo foto:', error);
      setUploadError(true);
      setUploading(false);
      // Aún así descargar la imagen localmente
      downloadImage();
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
        height: '100dvh',
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
          maxWidth: '100%',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          padding: 'clamp(8px, 2vw, 16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vw, 12px)',
        }}
        variants={contentVariants}
      >
        {/* Logo y título */}
        <motion.div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
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
              width: 'clamp(100px, 25vw, 140px)',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
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
            border: `4px solid ${AURORA_THEME.colors.white}`,
            width: '100%',
            maxWidth: 'clamp(240px, 60vw, 320px)',
            maxHeight: 'calc(100dvh - 200px)',
            height: 'auto',
            aspectRatio: '9/16',
            position: 'relative',
            flexShrink: 1,
            flexGrow: 0,
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
            {uploading ? '¡Subiendo...' : uploadError ? '¡Listo!' : '¡Perfecto!'}
          </h2>
          <p style={{
            color: AURORA_THEME.colors.blueDark,
            fontSize: 'clamp(12px, 3vw, 14px)',
            margin: 0,
            fontFamily: '"Montserrat", sans-serif',
            opacity: 0.7,
          }}>
            {uploading ? 'Guardando en el servidor...' : uploadError ? 'Foto guardada en tu galería (error al subir)' : 'Foto guardada en tu galería'}
          </p>
        </motion.div>

        {/* Loading spinner mientras sube */}
        {uploading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 360,
              transition: {
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
                rotate: { duration: 1, repeat: Infinity, ease: 'linear' }
              }
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{
              width: 'clamp(40px, 10vw, 60px)',
              height: 'clamp(40px, 10vw, 60px)',
              border: `4px solid rgba(0, 31, 91, 0.2)`,
              borderTop: `4px solid ${AURORA_THEME.colors.blueDark}`,
              borderRadius: '50%',
              marginTop: '12px',
            }}
          />
        )}



        {/* Botones de acción */}
        <motion.div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 16px)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            width: '100%',
            paddingBottom: 'clamp(16px, 4vw, 24px)',
            flexShrink: 0,
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
