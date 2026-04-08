import multer from "multer";
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});

// Validation: only allow images, PDFs, docs; max 5MB
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf',
        'application/msword', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File typenot allowed'), false);
    }
};

export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});