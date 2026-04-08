import { Router } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Passport config
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return done(null, false, { message: 'Incorrect username.'});
        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: 'Incorrect password.' })
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err);
    }
});

router.get('/', (req, res) => {
    if (req.isAuthenticated()) return res.redirect('/folders');
    res.render('index');
});

router.get('/register', (req, res) => res.render('register'));
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { username, password: hashed } });
    res.redirect('/login');
});

router.get('/login', (req, res) => res.render('login'));
router.post('/login', passport.authenticate('local', {
    successRedirect: '/folders',
    failureRedirect: '/login',
}));

router.post('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

export default router;