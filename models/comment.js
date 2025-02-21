const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'post', key: 'id' },
      onDelete: 'CASCADE'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private', 'mentor_participant'),
      defaultValue: 'private'
    },
    // 當 visibility 為 'mentor_participant' 時，表示該留言僅限特定導師與其參與者可見
    mentor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "當 visibility 為 mentor_participant 時，指定留言所屬的導師 ID"
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'comments',
    timestamps: true
  });

  return Comment;
};
