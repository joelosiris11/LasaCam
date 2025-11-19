import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar CORS para permitir peticiones desde el frontend
app.use(cors());
app.use(express.json());

// Configurar almacenamiento de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nombre de archivo único: timestamp-random.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'lasacam-' + uniqueSuffix + '.jpg');
    }
});

const upload = multer({ storage: storage });

// Servir archivos estáticos (las fotos subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint para subir foto
app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se subió ninguna foto.');
    }

    // Construir URL completa para devolver al cliente
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
        message: 'Foto subida con éxito',
        filename: req.file.filename,
        url: fileUrl
    });
});

// Endpoint para listar todas las fotos (Galería)
app.get('/api/photos', (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads');

    if (!fs.existsSync(uploadDir)) {
        return res.json([]);
    }

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer directorio' });
        }

        // Filtrar solo imágenes y ordenar por fecha (más recientes primero)
        // Nota: Como usamos timestamp en el nombre, podemos ordenar por nombre descendente
        const photos = files
            .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
            .sort().reverse()
            .map(file => {
                return {
                    filename: file,
                    url: `${req.protocol}://${req.get('host')}/uploads/${file}`
                };
            });

        res.json(photos);
    });
});

// Servir el frontend compilado (carpeta dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Cualquier otra ruta que no sea API, servir el index.html (para React Router si se usara)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
