import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { upload } from '../middleware/multer.js';
import { uploadToCloudinary } from '../lib/cloudinary.js';
import path from 'path';

const router = Router();
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

// Upload a file to a folder
router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
    try {
        const { folderId } = req.body;
        const file = req.file;
        if (!file) return res.status(400).send('No file uploaded');

        const result = await uploadToCloudinary(file.buffer, file.originalname);

        const saved = await prisma.file.create({
            data: {
                name: file.originalname,
                size: file.size,
                url: result.secure_url,
                userId: req.user.id,
                folderId: folderId ? parseInt(folderId) : null,
            },
        });
        console.log('saved:', saved);

        res.redirect(folderId ? `/folders/${folderId}` : '/folders');
    } catch (err) {
        next(err);
    }
});

// File detail page
router.get('/:id', requireAuth, async (req, res) => {
    const file = await prisma.file.findFirst({
        where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!file) return res.status(404).send('File not found');
    res.render('fileDetail', { file });
});

// Download file
router.get('/:id/download', requireAuth, async (req, res) => {
    const file = await prisma.file.findFirst({
        where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!file) return res.status(404).send('File not found');
    res.redirect(file.url);
});

// Delete file
router.post('/:id/delete', requireAuth, async (req, res) => {
    const file = await prisma.file.findFirst({
        where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!file) return res.status(404).send('Not found');
    const folderId = file.folderId;
    await prisma.file.delete({ where: { id: file.id } });
    res.redirect(folderId ? `/folders/${folderId}` : '/folders');
});

export default router;