import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from './lib/prisma.js';
import authRouter from './routes/auth.js';
import foldersRouter from './routes/folders.js';
import filesRouter from './routes/files.js';

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new PrismaSessionStore(prisma, {
            checkPeriod: 2 * 60 * 1000, // prune expired sessions every 2 min
            dbRecordIdIsSessionId: true,
        }),
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

app.use('/', authRouter);
app.use('/folders', foldersRouter);
app.use('/files', filesRouter);

app.use((err, req, res, next) => {
    console.error(err.message, err.stack);
    res.status(500).send(err.message);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));