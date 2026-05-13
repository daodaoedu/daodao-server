/**
 * 檢查 gina052801 和 ohtiffanylin 兩個帳號的 email log 問題
 */

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('=== 開始檢查 email log 問題 ===\n');

    // 搜尋這兩個帳號
    const usernames = ['gina052801', 'ohtiffanylin'];

    for (const username of usernames) {
      console.log(`\n--- 檢查帳號: ${username} ---`);

      // 查詢 users 表
      const users = await prisma.users.findMany({
        where: {
          OR: [
            { nickname: { contains: username, mode: 'insensitive' } },
            { contacts: { email: { contains: username, mode: 'insensitive' } } }
          ]
        },
        include: {
          contacts: true,
          practices: {
            orderBy: { created_at: 'desc' },
            take: 5
          }
        }
      });

      if (users.length === 0) {
        console.log(`❌ 找不到帳號: ${username}`);

        // 嘗試在 contacts 表中搜尋
        const contacts = await prisma.contacts.findMany({
          where: {
            email: { contains: username, mode: 'insensitive' }
          },
          include: {
            users: true
          }
        });

        if (contacts.length > 0) {
          console.log(`✓ 在 contacts 表中找到 ${contacts.length} 筆記錄:`);
          contacts.forEach(contact => {
            console.log(`  - Email: ${contact.email}`);
            console.log(`  - User ID: ${contact.user_id}`);
          });
        }
        continue;
      }

      console.log(`✓ 找到 ${users.length} 個符合的用戶:`);

      for (const user of users) {
        console.log(`\n  用戶 ID: ${user.id}`);
        console.log(`  暱稱: ${user.nickname}`);
        console.log(`  Email: ${user.contacts?.email || '無'}`);
        console.log(`  建立時間: ${user.created_at}`);
        console.log(`  實踐數量: ${user.practices.length}`);

        // 查詢此用戶的 email logs
        const emailLogs = await prisma.email_logs.findMany({
          where: { user_id: user.id },
          orderBy: { sent_at: 'desc' },
          take: 10
        });

        console.log(`  Email logs 數量: ${emailLogs.length}`);

        if (emailLogs.length > 0) {
          console.log('  最近的 email logs:');
          emailLogs.forEach(log => {
            console.log(`    - ${log.email_type} (${log.email_code || 'N/A'}) - ${log.status} - ${log.sent_at}`);
          });
        } else {
          console.log('  ⚠️  沒有 email log 記錄!');
        }

        // 查詢實踐相關的 email logs
        if (user.practices.length > 0) {
          console.log('\n  實踐資訊:');
          for (const practice of user.practices) {
            console.log(`    - Practice ID: ${practice.id} (${practice.external_id})`);
            console.log(`      標題: ${practice.title}`);
            console.log(`      建立時間: ${practice.created_at}`);

            // 查詢此實踐的 email logs
            const practiceEmailLogs = await prisma.email_logs.findMany({
              where: {
                user_id: user.id,
                entity_type: 'practice',
                entity_id: practice.id
              },
              orderBy: { sent_at: 'desc' }
            });

            if (practiceEmailLogs.length > 0) {
              console.log(`      Email logs: ${practiceEmailLogs.length} 筆`);
              practiceEmailLogs.forEach(log => {
                console.log(`        ${log.email_code}: ${log.status} - ${log.sent_at}`);
              });
            } else {
              console.log('      ⚠️  此實踐沒有 email log!');
            }
          }
        }
      }
    }

    // 統計最近所有發送的 practice emails (不在 email_logs 中)
    console.log('\n\n=== 檢查最近的實踐建立 (過去7天) ===');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPractices = await prisma.practices.findMany({
      where: {
        created_at: { gte: sevenDaysAgo }
      },
      include: {
        users: {
          include: {
            contacts: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    console.log(`找到 ${recentPractices.length} 個最近建立的實踐\n`);

    for (const practice of recentPractices) {
      const user = practice.users;
      if (!user) continue;

      // 檢查是否有 PE01 email log
      const pe01Log = await prisma.email_logs.findFirst({
        where: {
          user_id: user.id,
          entity_type: 'practice',
          entity_id: practice.id,
          email_code: 'PE01'
        }
      });

      if (!pe01Log) {
        console.log(`⚠️  缺少 PE01 log:`);
        console.log(`   Practice ID: ${practice.id} (${practice.external_id})`);
        console.log(`   標題: ${practice.title}`);
        console.log(`   用戶: ${user.nickname} (ID: ${user.id})`);
        console.log(`   Email: ${user.contacts?.email || '無'}`);
        console.log(`   建立時間: ${practice.created_at}\n`);
      }
    }

  } catch (error) {
    console.error('執行時發生錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
