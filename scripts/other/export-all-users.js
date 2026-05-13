// scripts/export-all-users.js
// 匯出所有註冊用戶的完整資料
// 使用方式: node scripts/export-all-users.js [format]
// format: json (預設) 或 csv

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// 載入所有模型和關聯（這會自動設置所有的 associations）
const models = require('../models/index');
const { User, Contact, BasicInfo, Location, City, Country, sequelize } = models;

async function exportAllUsers() {
  try {
    console.log('🔗 正在連接資料庫...');
    await sequelize.authenticate();
    console.log('✅ 資料庫連接成功\n');

    console.log('📊 正在查詢用戶資料...');

    // 查詢所有用戶及其關聯資料
    const users = await User.findAll({
      include: [
        {
          model: Contact,
          required: false,
          attributes: ['email', 'google_id', 'photo_url', 'is_subscribe_email', 'ig', 'discord', 'line', 'fb']
        },
        {
          model: BasicInfo,
          required: false,
          attributes: ['self_introduction', 'share_list', 'want_to_do_list']
        },
        {
          model: Location,
          required: false,
          include: [
            {
              model: City,
              required: false,
              attributes: ['name']
            },
            {
              model: Country,
              required: false,
              attributes: ['name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`✅ 查詢完成！共 ${users.length} 位用戶\n`);

    // 轉換資料格式
    const userData = users.map(user => {
      const u = user.toJSON();
      return {
        // 基本資訊
        id: u.id,
        external_id: u.external_id,
        nickname: u.nickname,
        birth_date: u.birth_date,
        gender: u.gender,
        education_stage: u.education_stage,
        language: u.language,
        is_open_profile: u.is_open_profile,
        is_open_location: u.is_open_location,

        // 聯絡資訊
        email: u.Contact?.email || '',
        google_id: u.Contact?.google_id || '',
        photo_url: u.Contact?.photo_url || '',
        is_subscribe_email: u.Contact?.is_subscribe_email || false,
        instagram: u.Contact?.ig || '',
        discord: u.Contact?.discord || '',
        line: u.Contact?.line || '',
        facebook: u.Contact?.fb || '',

        // 個人簡介
        self_introduction: u.BasicInfo?.self_introduction || '',
        share_list: u.BasicInfo?.share_list || '',
        want_to_do_list: u.BasicInfo?.want_to_do_list ? u.BasicInfo.want_to_do_list.join('; ') : '',

        // 位置資訊
        location_city: u.Location?.City?.name || '',
        location_country: u.Location?.Country?.name || '',
        location_is_taiwan: u.Location?.isTaiwan || false,

        // 其他
        tag_list: u.tag_list ? u.tag_list.join('; ') : '',
        role_id: u.role_id,
        mongo_id: u.mongo_id,

        // 時間戳記
        created_at: u.created_at,
        updated_at: u.updated_at
      };
    });

    // 匯出格式
    const format = process.argv[2] || 'json';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

    if (format === 'csv') {
      // 匯出 CSV
      const outputPath = path.join(__dirname, `../users-export-${timestamp}.csv`);
      const headers = Object.keys(userData[0]);
      const csvContent = [
        headers.join(','),
        ...userData.map(row =>
          headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          }).join(',')
        )
      ].join('\n');

      fs.writeFileSync(outputPath, '\ufeff' + csvContent, 'utf8'); // 加 BOM 讓 Excel 正確顯示中文
      console.log(`💾 CSV 檔案已匯出到: ${outputPath}`);

    } else {
      // 匯出 JSON
      const outputPath = path.join(__dirname, `../users-export-${timestamp}.json`);
      fs.writeFileSync(
        outputPath,
        JSON.stringify({
          export_date: new Date().toISOString(),
          total_users: users.length,
          users: userData
        }, null, 2),
        'utf8'
      );
      console.log(`💾 JSON 檔案已匯出到: ${outputPath}`);
    }

    // 顯示統計資訊
    console.log('\n📈 統計資訊:');
    console.log(`   總用戶數: ${users.length}`);
    console.log(`   有填寫 Email: ${userData.filter(u => u.email).length}`);
    console.log(`   有填寫性別: ${userData.filter(u => u.gender).length}`);
    console.log(`   有填寫位置: ${userData.filter(u => u.location_city || u.location_country).length}`);
    console.log(`   有自我介紹: ${userData.filter(u => u.self_introduction).length}`);
    console.log(`   訂閱電子報: ${userData.filter(u => u.is_subscribe_email).length}`);

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('\n✅ 資料庫連接已關閉');
  }
}

// 執行匯出
exportAllUsers();
