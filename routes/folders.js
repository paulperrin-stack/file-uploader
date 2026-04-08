import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { addDays } from 'date-fns';

const router = Router();

// Auth guard middleware
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

// List all folders (dashboard)
router.get('/', requireAuth, async (req, res) => {
    const folders = await prisma.folder.findMany({
        where: { userId: req.user.id },
        include: { files: true },
    });
    const files = await prisma.file.findMany({
        where: { userId: req.user.id, folderId: null },
    });
    res.render('dashboard', { folders, files });
});

// Create folder
router.post('/', requireAuth, async (req, res) => {
    const { name } = req.body;
    await prisma.folder.create({ data: { name, userId: req.user.id } });
    res.redirect('/folders');
});

// View shared folder (public, no auth needed)
router.get('/share/:linkId', async (req, res) => {
    const link = await prisma.shareLink.findUnique({
        where: { id: req.params.linkId },
        include: { folder: { include: { files: true } } },
    });
    if (!link || link.expiresAt < new Date()) {
        return res.status(410).send('This link has expired or does not exist.');
    }
    res.render('folder', { folder: link.folder });
});

// View a single folder
router.get('/:id', requireAuth, async (req, res) => {
    const folder = await prisma.folder.findFirst({
        where: { id: parseInt(req.params.id), userId: req.user.id },
        include: { files: true },
    });
    if (!folder) return res.status(404).send('Folder not found');
    res.render('folder', { folder });
});

// Rename folder
router.post('/:id/rename', requireAuth, async (req, res) => {
    await prisma.folder.updateMany({
        where: { id: parseInt(req.params.id), userId: req.user.id },
        data: { name: req.body.name },
    });
    res.redirect('/folders');
});

// Delete folder
router.post('/:id/delete', requireAuth, async (req, res) => {
    // Delete files in folder first
    await prisma.file.deleteMany({ where: { folderId: parseInt(req.params.id) } });
    await prisma.folder.deleteMany({
        where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    res.redirect('/folders');
});

// Share link
router.post('/:id/share', requireAuth, async (req, res) => {
    const days = parseInt(req.body.days) || 1;
    const link = await prisma.shareLink.create({
        data: {
            folderId: parseInt(req.params.id),
            expiresAt: addDays(new Date(), days),
        },
    });
    res.send(`Share link: ${req.protocol}://${req.get('host')}/share/${link.id}`);
});

export default router;