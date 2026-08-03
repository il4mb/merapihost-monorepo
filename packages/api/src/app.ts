import express from 'express';
import routers from './routes';
import { errorJson, notFoundJson } from './middlewares/error.middle';
import { LOGGER } from './utils/logger';
import { graphqlHandler } from '@/sources/graphql';
import mongoose from 'mongoose';
import { env } from './config/env';

const app = express();

app.set("trust proxy", true);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, QUERY, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Powered-By', 'Merapihost');
    LOGGER.info(`Incoming request: ${req.method} ${req.url}`);
    req.local = {}; // Initialize the local object for storing request-specific data
    next();
});

app.use("/graphql", graphqlHandler);
app.use("/", routers);

app.use(errorJson);
app.use(notFoundJson);

export default app; 