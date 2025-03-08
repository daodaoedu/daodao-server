const express = require('express');
const { mongoConnect } = require('./services/mongo');
const cors = require("cors");
const dotenv = require('dotenv');
dotenv.config();
const recentDataRoutes = require('./routes/recentData'); 
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const projectRoutes = require('./routes/project');
const ideaRoutes = require('./routes/idea');
const mentorRoutes = require('./routes/mentor');
const circleRoutes = require('./routes/circle');
const commentRoutes = require('./routes/comment');
const marathonRoutes = require('./routes/marathon');
const tagRoutes = require('./routes/tag');
const emailRoutes = require('./routes/email');
const imageRoutes = require('./routes/image');
const projectListRoutes = require('./routes/projectList');
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
require("./services/passport");
const monitorRoutes = require('./routes/monitor');
const dbInfoRoutes = require('./routes/dbInfo');
const User = require("./models/user.model");
const Activity = require("./models/activity.model");
const Marathon = require("./models/marathon.model");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.static('public'));

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5000',
      'https://www.daoedu.tw'
    ];
    const daodaoTestPattern = /^https:\/\/[\w-]+\.daodao-notion-test\.pages\.dev$/;

    if (!origin || allowedOrigins.includes(origin) || daodaoTestPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.get('/',recentDataRoutes);

app.use('/list',projectListRoutes);
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/users', userRoutes);
app.use('/ideas', ideaRoutes);
app.use('/circles', circleRoutes);
app.use('/comments', commentRoutes);
app.use("/marathons", marathonRoutes);
app.use("/mentors", mentorRoutes);
app.use('/tags', tagRoutes);
app.use('/emails',strictLimiter, emailRoutes);
app.use('/images',strictLimiter, imageRoutes);
app.use('/monitor', monitorRoutes);
app.use('/db-info', dbInfoRoutes);

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });



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
