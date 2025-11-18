import React from 'react';
import { motion } from 'framer-motion';
import { FiCamera } from 'react-icons/fi';

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
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delay: 0.2, duration: 0.5 },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0, rotate: -180 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { delay: 0.3, duration: 0.7 },
    },
  };

  return (
    <motion.div
      style={{
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        padding: 'clamp(20px, 5vw, 40px)',
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        style={{
          textAlign: 'center',
          maxWidth: '300px',
        }}
        variants={contentVariants}
      >
        <motion.div
          style={{
            marginBottom: 'clamp(24px, 6vw, 48px)',
            display: 'flex',
            justifyContent: 'center',
          }}
          variants={iconVariants}
        >
          <div
            style={{
              width: 'clamp(100px, 25vw, 140px)',
              height: 'clamp(100px, 25vw, 140px)',
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.3)',
            }}
          >
            <FiCamera size="clamp(40px, 12vw, 70px)" color="#FFFFFF" strokeWidth={1.5} />
          </div>
        </motion.div>

        <h1 style={{
          color: '#1A1A2E',
          fontSize: 'clamp(24px, 6vw, 40px)',
          marginBottom: 'clamp(12px, 2vw, 20px)',
          fontWeight: '700',
          letterSpacing: '-0.5px',
        }}>
          ¡Hola!
        </h1>

        <p style={{
          color: '#666666',
          fontSize: 'clamp(14px, 3vw, 18px)',
          marginBottom: 'clamp(24px, 5vw, 40px)',
          lineHeight: '1.6',
        }}>
          Necesitamos acceso a tu cámara para crear fotos increíbles con stickers personalizados.
        </p>

        <motion.button
          onClick={handleRequestPermission}
          style={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
            color: 'white',
            border: 'none',
            padding: 'clamp(12px, 2.5vw, 20px) clamp(32px, 8vw, 56px)',
            fontSize: 'clamp(14px, 3vw, 18px)',
            fontWeight: '600',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(255, 107, 53, 0.3)',
            width: '100%',
            transition: 'all 0.3s ease',
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(255, 107, 53, 0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          Permitir acceso a cámara
        </motion.button>

        <p style={{
          color: '#999999',
          fontSize: 'clamp(10px, 2vw, 14px)',
          marginTop: 'clamp(12px, 3vw, 24px)',
        }}>
          Tu privacidad es importante. No compartiremos tus fotos.
        </p>
      </motion.div>
    </motion.div>
  );
};
