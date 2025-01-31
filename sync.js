// sync.js
const sequelize = require('./config/db');
const User = require('./models/user');
const Role = require('./models/role');
const Permission = require('./models/permission');
const Location = require('./models/location');
const Position = require('./models/position');
const SubscriptionPlan = require('./models/subscriptionPlan');
const Contact = require('./models/contact');
const UserProfile = require('./models/userProfile');
const UserPosition = require('./models/userPosition');
const RolePermission = require('./models/rolePermission');

sequelize.sync({ force: true })
  .then(() => {
    console.log("Database synchronized");
  })
  .catch((err) => {
    console.error("Error syncing database", err);
  });
