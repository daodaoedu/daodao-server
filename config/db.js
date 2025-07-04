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
    max: 5,         // 降低最大連線數以節省記憶體
    min: 1,         // 降低最小連線數
    acquire: 60000, // 增加獲取超時時間以應對慢速 Swap
    idle: 10000,
    evict: 5000
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
