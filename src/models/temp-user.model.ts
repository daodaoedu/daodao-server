/**
 * 臨時用戶模型
 * PostgreSQL 臨時用戶表的 TypeScript 模型定義
 */

import { DataTypes, Model, Optional, Op } from 'sequelize';
import { postgresClient } from '../services/database/postgres.service';

// 臨時用戶屬性接口
interface TempUserAttributes {
  id: number;
  google_id: string;
  email: string;
  name: string;
  photo_url?: string;
  is_verified: boolean;
  verification_token?: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// 創建臨時用戶時的可選屬性
interface TempUserCreationAttributes extends Optional<TempUserAttributes, 
  'id' | 'is_verified' | 'created_at' | 'updated_at'
> {}

// 臨時用戶模型類
class TempUser extends Model<TempUserAttributes, TempUserCreationAttributes> implements TempUserAttributes {
  public id!: number;
  public google_id!: string;
  public email!: string;
  public name!: string;
  public photo_url?: string;
  public is_verified!: boolean;
  public verification_token?: string;
  public expires_at?: Date;
  public created_at!: Date;
  public updated_at!: Date;

  // 時間戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 檢查是否過期
  public isExpired(): boolean {
    if (!this.expires_at) return false;
    return new Date() > this.expires_at;
  }

  // 設置過期時間（預設 7 天後）
  public setExpirationTime(days = 7): void {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    this.expires_at = expirationDate;
  }

  // 靜態方法聲明
  static cleanupExpired: () => Promise<number>;
}

// 初始化臨時用戶模型
TempUser.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  photo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: () => {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 天後過期
      return expirationDate;
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize: postgresClient,
  modelName: 'TempUser',
  tableName: 'temp_users',
  timestamps: true,
  underscored: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['google_id']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['verification_token']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['is_verified']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    beforeCreate: (tempUser: TempUser) => {
      // 如果沒有設置過期時間，則設置預設值
      if (!tempUser.expires_at) {
        tempUser.setExpirationTime(7);
      }
    },
    beforeFind: (options: { where?: Record<string, unknown>; includeExpired?: boolean }) => {
      // 自動過濾已過期的記錄
      if (!options.where) {
        options.where = {};
      }
      
      // 只有在沒有明確指定 expires_at 條件時才添加過期檢查
      if (!options.where.expires_at && !options.includeExpired) {
        options.where.expires_at = {
          [Op.or]: [
            { [Op.is]: null },
            { [Op.gt]: new Date() }
          ]
        };
      }
    }
  }
});

// 定期清理過期記錄的方法
TempUser.cleanupExpired = async function() {
  const deletedCount = await this.destroy({
    where: {
      expires_at: {
        [Op.lt]: new Date()
      }
    }
  });
  
  console.log(`清理了 ${deletedCount} 個過期的臨時用戶記錄`);
  return deletedCount;
};

export { TempUser, TempUserAttributes, TempUserCreationAttributes };
export default TempUser;