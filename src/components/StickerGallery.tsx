import React from 'react';
import { motion } from 'framer-motion';
import {
  FiSmile,
  FiHeart,
  FiStar,
  FiZap,
  FiMoon,
  FiCloud,
  FiMusic,
  FiFeather,
} from 'react-icons/fi';
import { AVAILABLE_STICKERS } from '../utils/stickers';
import type { Sticker } from '../types';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  FiSmile,
  FiHeart,
  FiStar,
  FiZap,
  FiMoon,
  FiCloud,
  FiMusic,
  FiFeather,
};

interface StickerGalleryProps {
  onStickerSelect: (sticker: Sticker) => void;
}

export const StickerGallery: React.FC<StickerGalleryProps> = ({ onStickerSelect }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.5, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
    exit: {
      opacity: 0,
      scale: 0.5,
      y: -20,
      transition: { duration: 0.2 },
    },
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || FiSmile;
  };

  return (
    <div style={{
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '15px',
      backdropFilter: 'blur(10px)',
      border: `1px solid rgba(255, 107, 53, 0.2)`,
    }}>
      <h3 style={{
        color: '#FFFFFF',
        marginBottom: '15px',
        fontSize: '16px',
        fontWeight: '600',
      }}>
        Selecciona un sticker
      </h3>

      <motion.div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
          gap: '12px',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {AVAILABLE_STICKERS.map((sticker) => {
          const IconComponent = getIconComponent(sticker.icon);
          return (
            <motion.button
              key={sticker.id}
              onClick={() => onStickerSelect(sticker)}
              variants={itemVariants}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: `2px solid ${sticker.color}`,
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <IconComponent size={28} color={sticker.color} />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
