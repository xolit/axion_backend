require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectMongo = require('./db/mongo');
const redisClient = require('./db/redisClient');

const moviesRouter = require('./apis/movies/movies.route');
const requestsRouter = require('./apis/requests/requests.route');
const adminRouter = require('./apis/admin/admin.route');
const authMiddleware = require('./middlewares/auth');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 8,
  message: 'Too many requests from this IP, please try again after 2 minutes',
});

app.use(authMiddleware);

app.use('/movie',limiter, moviesRouter);
app.use('/home',limiter, moviesRouter);
app.use('/Request',limiter, requestsRouter);
app.use('/admin', adminRouter);

app.get('/', (req, res) => res.json({ ok: true, service: 'movies-backend' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectMongo();
    await redisClient.connect();
    app.locals.redis = redisClient;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  console.log('Shutting down');
  try { await redisClient.disconnect(); } catch (_) {}
  try { await require('mongoose').disconnect(); } catch (_) {}
  process.exit(0);
});
