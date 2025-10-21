import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { notFound, errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.js';
import providerRoutes from './routes/providers.js';
import availabilityRoutes from './routes/availability.js';
import appointmentRoutes from './routes/appointments.js';
import webhookRoutes from './routes/webhooks.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || '*')  // allow all if unset
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}));
app.use(compression());
app.use(express.json());

// health check
app.get('/', (_req, res) => res.send('Vemipo widget backend up'));

// Mount feature routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/webhooks', webhookRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

export default app;
