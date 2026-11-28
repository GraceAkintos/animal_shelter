import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import prisma from './db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import logRoutes from './routes/logs.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); 
app.use(express.json());

// Sessions (FR-02, FR-03, NFR-03)
app.use(
  session({
    name: 'shelter.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // don't create sessions for visitors who never log in
    rolling: true, // every request resets the 30-minute timer, so only inactive users are logged out
    cookie: {
      httpOnly: true, 
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', // HTTPS-only cookie on Render (NFR-02)
      maxAge: 30 * 60 * 1000,
    },
  })
);

// Routes
app.get('/api/health', async (req, res) => {
  const [animals, users] = await Promise.all([prisma.animal.count(), prisma.user.count()]);
  res.json({ status: 'ok', database: 'connected', animals, users, time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

//Error handling (must come after all routes)
app.use('/api', notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));