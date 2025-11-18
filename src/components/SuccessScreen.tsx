import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiDownload, FiRotateCcw } from 'react-icons/fi';

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
        background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
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
          paddingRight: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        variants={contentVariants}
      >
        <motion.div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 'clamp(20px, 5vw, 40px)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <FiCheckCircle
            size="clamp(80px, 20vw, 140px)"
            color="#FF6B35"
            strokeWidth={1}
          />
        </motion.div>

        <h1 style={{
          color: '#FFFFFF',
          fontSize: 'clamp(24px, 6vw, 40px)',
          marginBottom: 'clamp(12px, 2vw, 20px)',
          fontWeight: '700',
        }}>
          ¡Perfecto! 🎉
        </h1>

        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: 'clamp(14px, 3vw, 18px)',
          marginBottom: 'clamp(20px, 5vw, 40px)',
          lineHeight: '1.6',
        }}>
          Tu foto con stickers se ha descargado correctamente en tu dispositivo.
        </p>

        {/* Preview */}
        <motion.div
          style={{
            marginBottom: 'clamp(20px, 5vw, 40px)',
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: 'min(90vw, calc(100vh * 9/16))',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <img
            src={imageData}
            alt="Final result"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: 'clamp(300px, 60vh, 500px)',
              display: 'block',
              objectFit: 'contain',
            }}
          />
        </motion.div>

        <motion.div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 2vw, 16px)',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={downloadImage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
              color: 'white',
              border: 'none',
              padding: 'clamp(10px, 2vw, 16px) clamp(20px, 5vw, 32px)',
              fontSize: 'clamp(14px, 3vw, 18px)',
              fontWeight: '600',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(255, 107, 53, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiDownload size="clamp(16px, 4vw, 24px)" />
            Descargar de nuevo
          </motion.button>

          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              padding: 'clamp(10px, 2vw, 16px) clamp(20px, 5vw, 32px)',
              fontSize: 'clamp(14px, 3vw, 18px)',
              fontWeight: '600',
              borderRadius: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiRotateCcw size="clamp(16px, 4vw, 24px)" />
            Crear otra
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
