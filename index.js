const express = require('express');
const { mongoConnect } = require('./services/mongo');
const cors = require("cors");
const dotenv = require('dotenv');
dotenv.config();
const recentDataRoutes = require('./routes/recentData'); 
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const activityRoutes = require('./routes/activity');
const marathonRoutes = require('./routes/marathon');
const tagRoutes = require('./routes/tag');
const emailRoutes = require('./routes/email');
const imageRoutes = require('./routes/image');
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
require("./services/passport");
const User = require("./models/user.model");
const Activity = require("./models/activity.model");
const Marathon = require("./models/marathon.model");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5000',
    'https://feat-v2.daodao-notion-test.pages.dev',
    'https://dev.daodao-notion-test.pages.dev',
    'https://www.daoedu.tw',
  ],
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

  // Rate limiter configuration
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  headers: true,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  trustProxy: true, 
});

const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 60, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  headers: true,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  trustProxy: true, 
});

app.use(globalLimiter);
app.use((req, res, next) => {
  console.log(`IP: ${req.ip}, URL: ${req.originalUrl}`);
  next();
});
app.use(session({
    secret: process.env.SESSION_SEVRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
}))
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/activity', activityRoutes);
app.use("/marathon", marathonRoutes);
app.use('/tag', tagRoutes);
app.use('/email',strictLimiter, emailRoutes);
app.use('/image',strictLimiter, imageRoutes);

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.get('/',recentDataRoutes);


async function startServer() {
  try {
    await mongoConnect();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
