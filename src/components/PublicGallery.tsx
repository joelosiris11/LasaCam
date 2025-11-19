import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AURORA_THEME from '../styles/theme';
import { ArrowLeftIcon } from './icons';

interface Photo {
    filename: string;
    url: string;
}

interface PublicGalleryProps {
    onBack: () => void;
}

export const PublicGallery: React.FC<PublicGalleryProps> = ({ onBack }) => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            // En desarrollo usamos localhost:3001, en prod usará la misma URL relativa
            const apiUrl = import.meta.env.DEV ? 'http://localhost:3001/api/photos' : '/api/photos';
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                setPhotos(data);
            }
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: AURORA_THEME.colors.beige,
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
            }}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
            {/* Header */}
            <div style={{
                padding: 'clamp(16px, 4vw, 24px)',
                display: 'flex',
                alignItems: 'center',
                borderBottom: `2px solid ${AURORA_THEME.colors.blueDark}`,
                background: AURORA_THEME.colors.white,
                boxShadow: AURORA_THEME.elevations.level4,
                zIndex: 10,
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        marginRight: '16px',
                    }}
                >
                    <ArrowLeftIcon size={32} color={AURORA_THEME.colors.blueDark} strokeWidth={2.5} />
                </button>
                <h2 style={{
                    margin: 0,
                    color: AURORA_THEME.colors.blueDark,
                    fontFamily: '"DynaPuff", cursive',
                    fontSize: 'clamp(20px, 5vw, 24px)',
                }}>
                    Galería Pública
                </h2>
            </div>

            {/* Grid de Fotos */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'clamp(12px, 3vw, 16px)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 'clamp(8px, 2vw, 12px)',
                alignContent: 'start',
            }}>
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                        Cargando fotos...
                    </div>
                ) : photos.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: AURORA_THEME.colors.blueDark }}>
                        Aún no hay fotos. ¡Sé el primero!
                    </div>
                ) : (
                    photos.map((photo) => (
                        <motion.div
                            key={photo.filename}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            style={{
                                aspectRatio: '9/16',
                                borderRadius: AURORA_THEME.borderRadius.medium,
                                overflow: 'hidden',
                                boxShadow: AURORA_THEME.elevations.level2,
                                border: `2px solid ${AURORA_THEME.colors.white}`,
                                position: 'relative',
                            }}
                        >
                            <img
                                src={photo.url}
                                alt="Gallery item"
                                loading="lazy"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
};
