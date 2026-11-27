import 'dotenv/config'; // loads .env into process.env
import express from 'express';
import prisma from './db.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());


//confirms the server is running and the database is reachable
app.get('/api/health', async (req, res) => {
  const [animals, users] = await Promise.all([prisma.animal.count(), prisma.user.count()]);
  res.json({ status: 'ok', database: 'connected', animals, users, time: new Date().toISOString() });
});

// Error handling (must come after all routes)
app.use('/api', notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));