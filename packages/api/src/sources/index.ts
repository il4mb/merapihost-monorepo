import { env } from '@/config/env';
import mongoose from 'mongoose';

export const primaryDb = mongoose.createConnection(env.MONGODB_URI);

primaryDb.on('connected', () => console.log('Primary DB connected'));
primaryDb.on('error', (err) => console.error('Primary DB error:', err));