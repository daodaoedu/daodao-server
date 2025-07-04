// config/db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.APP_ENV === 'dev' ? 'postgres-dev' : 'postgres-prod',
  username: 'daodao',
  password: 'daodao',
  database: 'daodao',
  port: 5432,
  pool: {
    max: 20,        // 增加最大連線數
    min: 5,         // 增加最小連線數
    acquire: 30000, // 減少獲取超時時間
    idle: 30000,    // 增加空閒時間
    evict: 10000    // 增加驅逐時間
  }
});

if (process.env.NODE_ENV !== 'test') {
  sequelize
    .authenticate()
    .then(() => {
      console.log('成功連線到 PostgreSQL');
    })
    .catch((err) => {
      console.error('無法連線到 PostgreSQL:', err);
    });
}

module.exports = sequelize;
