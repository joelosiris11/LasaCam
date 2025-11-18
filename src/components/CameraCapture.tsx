import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCamera, FiRotateCw } from 'react-icons/fi';

interface CameraCaptureProps {
  onPhotoTaken: (photoData: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoTaken }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
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
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            aspectRatio: { ideal: 9/16 }
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

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Aplicar transformación de espejo (como el video)
        context.translate(canvasRef.current.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(videoRef.current, 0, 0);
        const photoData = canvasRef.current.toDataURL('image/jpeg');
        onPhotoTaken(photoData);
      }
    }
  };

  const toggleCamera = () => {
    setLoading(true);
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  return (
    <motion.div
      style={{
        background: '#000000',
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
        backgroundColor: '#000',
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
            objectFit: 'cover',
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(-1)',
          }}
        />
      </div>

      {/* Header con botón de cambiar cámara */}
      <motion.div
        style={{
          position: 'absolute',
          top: 'clamp(12px, 3vw, 24px)',
          right: 'clamp(12px, 3vw, 24px)',
          zIndex: 10,
          display: 'flex',
          gap: 'clamp(8px, 2vw, 16px)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Botón para cambiar cámara */}
        <motion.button
          onClick={toggleCamera}
          disabled={loading}
          style={{
            width: 'clamp(44px, 10vw, 60px)',
            height: 'clamp(44px, 10vw, 60px)',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            opacity: loading ? 0.5 : 1,
            backdropFilter: 'blur(10px)',
          }}
          whileHover={!loading ? { scale: 1.1 } : undefined}
          whileTap={!loading ? { scale: 0.9 } : undefined}
        >
          <FiRotateCw size="clamp(20px, 5vw, 28px)" />
        </motion.button>
      </motion.div>

      {/* Botones flotantes en la parte inferior */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 'clamp(24px, 6vw, 48px)',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'clamp(20px, 5vw, 40px)',
          padding: '0 clamp(12px, 3vw, 24px)',
          zIndex: 10,
        }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Botón redondo para tomar foto */}
        <motion.button
          onClick={handleTakePhoto}
          style={{
            width: 'clamp(64px, 16vw, 90px)',
            height: 'clamp(64px, 16vw, 90px)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
            border: '5px solid white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(255, 107, 53, 0.6)',
          }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
        >
          <FiCamera size="clamp(32px, 10vw, 50px)" color="white" strokeWidth={1.5} />
        </motion.button>

        {/* Espaciador invisible para centrar el botón principal */}
        <div style={{ width: 'clamp(44px, 10vw, 60px)' }} />
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
          border: '4px solid rgba(255, 107, 53, 0.3)',
          borderTop: '4px solid #FF6B35',
          borderRadius: '50%',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
};
