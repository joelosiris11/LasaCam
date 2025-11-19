import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AURORA_THEME from '../styles/theme';
import { ArrowLeftIcon, DownloadIcon } from './icons';

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
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            // En desarrollo, usar el proxy de Vite que redirige /backend a test.t-ecogroup.net
            // En producción, usar ruta relativa
            const apiUrl = import.meta.env.DEV ? '/backend/api/photos' : '/backend/api/photos';
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

    const handlePhotoClick = (photo: Photo, index: number) => {
        setSelectedPhoto(photo);
        setSelectedIndex(index);
    };

    const handleCloseModal = () => {
        setSelectedPhoto(null);
        setSelectedIndex(null);
    };

    const handleDownload = (photo: Photo) => {
        const link = document.createElement('a');
        link.href = photo.url;
        link.download = photo.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const navigatePhoto = (direction: 'prev' | 'next') => {
        if (selectedIndex === null) return;

        let newIndex: number;
        if (direction === 'next') {
            newIndex = selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0;
        } else {
            newIndex = selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1;
        }

        setSelectedIndex(newIndex);
        setSelectedPhoto(photos[newIndex]);
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
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{
                        margin: 0,
                        color: AURORA_THEME.colors.blueDark,
                        fontFamily: '"DynaPuff", cursive',
                        fontSize: 'clamp(20px, 5vw, 24px)',
                    }}>
                        Galería Pública
                    </h2>
                    {!loading && photos.length > 0 && (
                        <span style={{
                            color: AURORA_THEME.colors.blueDark,
                            fontFamily: '"Montserrat", sans-serif',
                            fontSize: 'clamp(14px, 3.5vw, 16px)',
                            opacity: 0.7,
                            marginLeft: '16px',
                        }}>
                            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                        </span>
                    )}
                </div>
            </div>

            {/* Grid de Fotos - Optimizado para muchas fotos */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'clamp(10px, 2.5vw, 16px)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(90px, 18vw, 120px), 1fr))',
                gap: 'clamp(6px, 1.5vw, 10px)',
                alignContent: 'start',
                // Optimización de rendimiento
                willChange: 'scroll-position',
                // Mejorar scroll suave
                scrollBehavior: 'smooth',
            }}>
                {loading ? (
                    <motion.div
                        style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '60px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            style={{
                                width: 'clamp(40px, 10vw, 60px)',
                                height: 'clamp(40px, 10vw, 60px)',
                                border: `4px solid rgba(0, 31, 91, 0.2)`,
                                borderTop: `4px solid ${AURORA_THEME.colors.blueDark}`,
                                borderRadius: '50%',
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        <p style={{
                            color: AURORA_THEME.colors.blueDark,
                            fontSize: 'clamp(14px, 3.5vw, 16px)',
                            fontFamily: '"Montserrat", sans-serif',
                            margin: 0,
                        }}>
                            Cargando fotos...
                        </p>
                    </motion.div>
                ) : photos.length === 0 ? (
                    <motion.div
                        style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '60px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div style={{
                            fontSize: 'clamp(48px, 12vw, 64px)',
                            marginBottom: '8px',
                        }}>
                            📸
                        </div>
                        <h3 style={{
                            color: AURORA_THEME.colors.blueDark,
                            fontSize: 'clamp(18px, 4.5vw, 22px)',
                            fontFamily: '"DynaPuff", cursive',
                            margin: 0,
                            fontWeight: 700,
                        }}>
                            Aún no hay fotos
                        </h3>
                        <p style={{
                            color: AURORA_THEME.colors.blueDark,
                            fontSize: 'clamp(14px, 3.5vw, 16px)',
                            fontFamily: '"Montserrat", sans-serif',
                            margin: 0,
                            opacity: 0.7,
                        }}>
                            ¡Sé el primero en compartir!
                        </p>
                    </motion.div>
                ) : (
                    photos.map((photo, index) => (
                        <motion.button
                            key={photo.filename}
                            onClick={() => handlePhotoClick(photo, index)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: Math.min(index * 0.01, 0.3) }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                aspectRatio: '9/16',
                                borderRadius: AURORA_THEME.borderRadius.small,
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: `1.5px solid ${AURORA_THEME.colors.white}`,
                                position: 'relative',
                                background: AURORA_THEME.colors.white,
                                padding: 0,
                                cursor: 'pointer',
                            }}
                        >
                            <img
                                src={photo.url}
                                alt={`Foto ${index + 1}`}
                                loading="lazy"
                                decoding="async"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                        </motion.button>
                    ))
                )}
            </div>

            {/* Modal de vista ampliada */}
            <AnimatePresence>
                {selectedPhoto && selectedIndex !== null && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0, 0, 0, 0.95)',
                                zIndex: 100,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                        />

                        {/* Contenedor de la imagen */}
                        <motion.div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 101,
                                padding: 'clamp(20px, 5vw, 40px)',
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={handleCloseModal}
                        >
                            {/* Botón cerrar */}
                            <motion.button
                                onClick={handleCloseModal}
                                style={{
                                    position: 'absolute',
                                    top: 'clamp(16px, 4vw, 24px)',
                                    right: 'clamp(16px, 4vw, 24px)',
                                    width: 'clamp(40px, 10vw, 48px)',
                                    height: 'clamp(40px, 10vw, 48px)',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    backdropFilter: 'blur(10px)',
                                    border: `2px solid ${AURORA_THEME.colors.white}`,
                                    color: AURORA_THEME.colors.white,
                                    fontSize: 'clamp(24px, 6vw, 32px)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 102,
                                    padding: 0,
                                }}
                                whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.3)' }}
                                whileTap={{ scale: 0.9 }}
                            >
                                ×
                            </motion.button>

                            {/* Botón descargar */}
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(selectedPhoto);
                                }}
                                style={{
                                    position: 'absolute',
                                    bottom: 'clamp(16px, 4vw, 24px)',
                                    right: 'clamp(16px, 4vw, 24px)',
                                    width: 'clamp(48px, 12vw, 56px)',
                                    height: 'clamp(48px, 12vw, 56px)',
                                    borderRadius: '50%',
                                    background: AURORA_THEME.colors.blueDark,
                                    border: `2px solid ${AURORA_THEME.colors.white}`,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 102,
                                    padding: 0,
                                    boxShadow: AURORA_THEME.elevations.level8,
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <DownloadIcon size={24} color={AURORA_THEME.colors.white} strokeWidth={2.5} />
                            </motion.button>

                            {/* Botones de navegación */}
                            {photos.length > 1 && (
                                <>
                                    {/* Botón anterior */}
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigatePhoto('prev');
                                        }}
                                        style={{
                                            position: 'absolute',
                                            left: 'clamp(16px, 4vw, 24px)',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 'clamp(44px, 11vw, 52px)',
                                            height: 'clamp(44px, 11vw, 52px)',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            backdropFilter: 'blur(10px)',
                                            border: `2px solid ${AURORA_THEME.colors.white}`,
                                            color: AURORA_THEME.colors.white,
                                            fontSize: 'clamp(24px, 6vw, 32px)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 102,
                                            padding: 0,
                                        }}
                                        whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.3)' }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        ‹
                                    </motion.button>

                                    {/* Botón siguiente */}
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigatePhoto('next');
                                        }}
                                        style={{
                                            position: 'absolute',
                                            right: 'clamp(16px, 4vw, 24px)',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 'clamp(44px, 11vw, 52px)',
                                            height: 'clamp(44px, 11vw, 52px)',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            backdropFilter: 'blur(10px)',
                                            border: `2px solid ${AURORA_THEME.colors.white}`,
                                            color: AURORA_THEME.colors.white,
                                            fontSize: 'clamp(24px, 6vw, 32px)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 102,
                                            padding: 0,
                                        }}
                                        whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.3)' }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        ›
                                    </motion.button>
                                </>
                            )}

                            {/* Imagen ampliada */}
                            <motion.img
                                key={selectedPhoto.url}
                                src={selectedPhoto.url}
                                alt="Full size"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    borderRadius: AURORA_THEME.borderRadius.large,
                                    boxShadow: AURORA_THEME.elevations.level16,
                                    border: `4px solid ${AURORA_THEME.colors.white}`,
                                }}
                                initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            />

                            {/* Indicador de posición */}
                            {photos.length > 1 && (
                                <motion.div
                                    style={{
                                        position: 'absolute',
                                        bottom: 'clamp(80px, 20vw, 100px)',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        backdropFilter: 'blur(10px)',
                                        padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                                        borderRadius: AURORA_THEME.borderRadius.pill,
                                        color: AURORA_THEME.colors.white,
                                        fontSize: 'clamp(12px, 3vw, 14px)',
                                        fontFamily: '"Montserrat", sans-serif',
                                        fontWeight: 600,
                                    }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                >
                                    {selectedIndex + 1} / {photos.length}
                                </motion.div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
