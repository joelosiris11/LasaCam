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
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const reelsContainerRef = React.useRef<HTMLDivElement>(null);
    
    // Detectar Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    useEffect(() => {
        if (selectedIndex !== null && reelsContainerRef.current) {
            // Cuando se abre el modal, scrollear a la foto seleccionada
            const selectedElement = reelsContainerRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'auto' });
            }
        }
    }, [selectedIndex]);


    useEffect(() => {
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            // Frontend on Firebase, backend on fixed server
            const apiUrl = 'https://test.t-ecogroup.net/backend/api/photos';
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



    const handleDownload = (photo: Photo) => {
        const link = document.createElement('a');
        link.href = photo.url;
        link.download = photo.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100dvh',
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
            {/* Header Flotante */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: 'clamp(16px, 4vw, 24px)',
                display: 'flex',
                alignItems: 'center',
                zIndex: 10,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        padding: 0,
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '16px',
                    }}
                >
                    <ArrowLeftIcon size={24} color="#fff" strokeWidth={2.5} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{
                        margin: 0,
                        color: '#fff',
                        fontFamily: '"DynaPuff", cursive',
                        fontSize: 'clamp(20px, 5vw, 24px)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}>
                        Galería
                    </h2>
                </div>
            </div>

            {/* Grid de Fotos */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '2px',
                paddingTop: '80px', // Espacio para el header flotante
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)', // 3 columnas
                gap: '2px',
                alignContent: 'start',
                background: AURORA_THEME.colors.white,
            }}>
                {loading ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        height: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <motion.div
                            style={{
                                width: '40px',
                                height: '40px',
                                border: `3px solid rgba(0, 31, 91, 0.2)`,
                                borderTop: `3px solid ${AURORA_THEME.colors.blueDark}`,
                                borderRadius: '50%',
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                    </div>
                ) : photos.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: AURORA_THEME.colors.blueDark,
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>📸</div>
                        <p style={{ fontFamily: '"Montserrat", sans-serif' }}>Aún no hay fotos</p>
                    </div>
                ) : (
                    photos.map((photo, index) => (
                        <motion.div
                            key={photo.filename}
                            onClick={() => setSelectedIndex(index)}
                            whileHover={{ filter: 'brightness(0.9)' }}
                            style={isSafari ? {
                                // Safari: flex con altura fija
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: '#f0f0f0',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '180px',
                            } : {
                                // Chrome y otros: padding-bottom trick
                                position: 'relative',
                                width: '100%',
                                paddingBottom: '177.77%',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: '#f0f0f0',
                            }}
                        >
                            <img
                                src={photo.url}
                                alt={`Foto ${index + 1}`}
                                loading="lazy"
                                style={isSafari ? {
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                } : {
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal Reels Full Screen */}
            <AnimatePresence>
                {selectedIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 100,
                            background: '#000',
                        }}
                    >
                        {/* Botón Cerrar */}
                        <button
                            onClick={() => setSelectedIndex(null)}
                            style={{
                                position: 'absolute',
                                top: 'clamp(16px, 4vw, 24px)',
                                left: 'clamp(16px, 4vw, 24px)',
                                zIndex: 101,
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'rgba(0, 0, 0, 0.5)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '24px',
                            }}
                        >
                            ×
                        </button>

                        {/* Contenedor Scroll Snap */}
                        <div
                            ref={reelsContainerRef}
                            style={{
                                height: '100dvh',
                                overflowY: 'scroll',
                                scrollSnapType: 'y mandatory',
                                scrollbarWidth: 'none',
                            }}
                        >
                            {photos.map((photo, index) => (
                                <div
                                    key={`reel-${photo.filename}`}
                                    style={{
                                        height: '100dvh',
                                        width: '100%',
                                        scrollSnapAlign: 'start',
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Fondo borroso */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundImage: `url(${photo.url})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: 'blur(20px) brightness(0.5)',
                                        transform: 'scale(1.1)',
                                    }} />

                                    {/* Imagen */}
                                    <img
                                        src={photo.url}
                                        alt="Full screen"
                                        loading={Math.abs(index - selectedIndex) < 2 ? "eager" : "lazy"}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            width: 'auto',
                                            height: 'auto',
                                            objectFit: 'contain',
                                            position: 'relative',
                                            zIndex: 1,
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                        }}
                                    />

                                    {/* Botón Descargar */}
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(photo);
                                        }}
                                        whileTap={{ scale: 0.9 }}
                                        style={{
                                            position: 'absolute',
                                            bottom: '40px',
                                            right: '20px',
                                            zIndex: 2,
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#fff',
                                        }}
                                    >
                                        <DownloadIcon size={24} color="#fff" />
                                    </motion.button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


        </motion.div>
    );
};
