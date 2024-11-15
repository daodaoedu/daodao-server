const express = require('express');
const { mongoConnect } = require('./services/mongo');
const cors = require("cors");
const dotenv = require('dotenv');
dotenv.config();
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
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5000',
    'https://dev.daodao-notion-test.pages.dev',
    'https://www.daoedu.tw',
  ],
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

  // Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  trustProxy: true, 
});

app.use(limiter);
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
app.use('/email', emailRoutes);
app.use('/image', imageRoutes);

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.get('/', async (req, res) => {
  const userCount = await User.countDocuments();
  const activityCount = await Activity.countDocuments();
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${process.env.NODE_ENV} Environment</title>
    </head>
    <body>
      <h1>Current Environment: ${process.env.NODE_ENV}</h1>
      <p>PORT: ${process.env.PORT}</p>
      <p>FRONTEND_URL: ${process.env.FRONTEND_URL}</p>
      <p>MONGODB_URL: ${process.env.MONGO_URL}</p>
      <p>USER_NUMBER: ${userCount}</p>
      <p>ACTIVITY_NUMBER: ${activityCount}</p>
    </body>
    </html>
  `;
  res.send(htmlContent);
});


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
