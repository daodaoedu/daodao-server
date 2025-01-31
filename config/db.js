// config/db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.APP_ENV === 'dev' ? 'postgres-dev' : 'postgres-prod',
  username: 'daodao',
  password: 'daodao',
  database: 'daodao',
  port: 5432,
});

sequelize.authenticate().then(() => {
  console.log('成功連線到 PostgreSQL');
}).catch(err => {
  console.error('無法連線到 PostgreSQL:', err);
});

module.exports = sequelize;
