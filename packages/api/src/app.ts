import express from 'express';
import routers from './routes';
import { errorJson, notFoundJson } from './middlewares/error.middleware';
import { LOGGER } from './utils/logger';

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
    next();
});
app.use("/", routers);

app.use(errorJson);
app.use(notFoundJson);

export default app; 