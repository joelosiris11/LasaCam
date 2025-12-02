import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AVAILABLE_STICKERS, COMPANIES } from '../utils/stickers';
import type { Sticker } from '../types';
import AURORA_THEME from '../styles/theme';

interface StickerGalleryProps {
  onStickerSelect: (sticker: Sticker) => void;
}

export const StickerGallery: React.FC<StickerGalleryProps> = ({ onStickerSelect }) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  // Filtrar stickers según empresa seleccionada
  const filteredStickers = selectedCompany === 'all'
    ? AVAILABLE_STICKERS
    : AVAILABLE_STICKERS.filter(s => s.company === selectedCompany);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0, rotate: -90 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring' as const,
        damping: 15,
        stiffness: 250,
        duration: 0.4
      },
    },
    exit: {
      opacity: 0,
      scale: 0,
      rotate: 90,
      transition: { duration: 0.2 },
    },
  };

  const tabVariants = {
    inactive: { scale: 1, opacity: 0.7 },
    active: { scale: 1.05, opacity: 1 },
  };

  return (
    <div style={{
      padding: '16px',
      background: 'rgba(26, 26, 46, 0.95)',
      borderRadius: '20px 20px 0 0',
      backdropFilter: 'blur(20px)',
      border: `1px solid rgba(255, 107, 53, 0.3)`,
      maxHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <h3 style={{
        color: '#FFFFFF',
        marginBottom: '12px',
        fontSize: 'clamp(16px, 4vw, 20px)',
        fontWeight: '700',
        fontFamily: '"DynaPuff", cursive',
        textAlign: 'center',
      }}>
        Selecciona un sticker
      </h3>

      {/* Tabs de filtrado - Scroll horizontal */}
      <div style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        marginBottom: '16px',
        paddingBottom: '8px',
        scrollbarWidth: 'thin',
        scrollbarColor: `${AURORA_THEME.colors.gold} rgba(255,255,255,0.1)`,
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          minWidth: 'max-content',
        }}>
          {/* Tab "Todas" */}
          <motion.button
            onClick={() => setSelectedCompany('all')}
            variants={tabVariants}
            animate={selectedCompany === 'all' ? 'active' : 'inactive'}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: selectedCompany === 'all'
                ? `2px solid ${AURORA_THEME.colors.gold}`
                : '2px solid rgba(255,255,255,0.2)',
              background: selectedCompany === 'all'
                ? `linear-gradient(135deg, ${AURORA_THEME.colors.gold}, ${AURORA_THEME.colors.blueDark})`
                : 'rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              fontSize: 'clamp(12px, 3vw, 14px)',
              fontWeight: selectedCompany === 'all' ? '700' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: '"Montserrat", sans-serif',
              transition: 'all 0.3s ease',
            }}
          >
            Todas ({AVAILABLE_STICKERS.length})
          </motion.button>

          {/* Tabs de empresas */}
          {COMPANIES.map((company) => {
            const companyStickers = AVAILABLE_STICKERS.filter(s => s.company === company);
            const companyColor = companyStickers[0]?.color || AURORA_THEME.colors.gold;

            return (
              <motion.button
                key={company}
                onClick={() => setSelectedCompany(company)}
                variants={tabVariants}
                animate={selectedCompany === company ? 'active' : 'inactive'}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: selectedCompany === company
                    ? `2px solid ${companyColor}`
                    : '2px solid rgba(255,255,255,0.2)',
                  background: selectedCompany === company
                    ? companyColor
                    : 'rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  fontWeight: selectedCompany === company ? '700' : '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: '"Montserrat", sans-serif',
                  transition: 'all 0.3s ease',
                }}
              >
                {company} ({companyStickers.length})
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Grid de stickers con scroll */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '4px',
        scrollbarWidth: 'thin',
        scrollbarColor: `${AURORA_THEME.colors.gold} rgba(255,255,255,0.1)`,
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCompany}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
              gap: '12px',
              paddingBottom: '8px',
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {filteredStickers.map((sticker) => (
              <motion.button
                key={sticker.id}
                onClick={() => onStickerSelect(sticker)}
                variants={itemVariants}
                whileHover={{ scale: 1.15, rotate: 5, zIndex: 10 }}
                whileTap={{ scale: 0.85, rotate: -5 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: `2px solid ${sticker.color}40`,
                  borderRadius: '16px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  aspectRatio: '1',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Imagen PNG del sticker */}
                <img
                  src={sticker.icon}
                  alt={sticker.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                  }}
                  loading="lazy"
                />

                {/* Glow effect on hover */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle, ${sticker.color}20 0%, transparent 70%)`,
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'none',
                }} />
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer info */}
      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.6)',
        fontSize: 'clamp(10px, 2.5vw, 12px)',
        fontFamily: '"Montserrat", sans-serif',
      }}>
        Mostrando {filteredStickers.length} sticker{filteredStickers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
