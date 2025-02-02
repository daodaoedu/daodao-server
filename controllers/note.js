const { Note, Project } = require('../models');
const sequelize = require('../config/db');

exports.createNote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { date, ...rest } = req.body;
    
    // 強制日期轉換與驗證
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('無效的日期格式，請使用 YYYY-MM-DD 格式');
    }

    const project = await Project.findOne({external_id : req.params.projectId})

    
    console.log('project',project);
    const note = await Note.create({
      ...rest,
      project_id: projectId,
      date: parsedDate,  // 確保存入的是 Date 物件
    }, { transaction });

    await transaction.commit();

    // 安全處理日期格式化
    const responseDate = note.date instanceof Date 
      ? note.date.toISOString().split('T')[0]
      : new Date(note.date).toISOString().split('T')[0];

    res.status(201).json({
      id: note.id,
      week: note.week,
      title: note.title,
      date: responseDate,
      img_url: note.img_url
    });

  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    
    res.status(400).json({ 
      error: true,
      message: error.message || '建立成果失敗',
      details: error.errors?.map(e => e.message)
    });
  }
};


exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { project_id: req.params.projectId },
      attributes: ['id', 'week', 'title', 'description', 'date', 'img_url'],
      order: [
        ['week', 'ASC'],
        ['date', 'ASC']
      ]
    });

    // 安全日期格式化處理
    const safeDateFormatter = (dateValue) => {
      try {
        const dateObj = dateValue instanceof Date 
          ? dateValue 
          : new Date(dateValue);
        
        if (isNaN(dateObj.getTime())) {
          return '無效日期';
        }
        return dateObj.toISOString().split('T')[0];
      } catch (e) {
        return '日期格式錯誤';
      }
    };

    res.json(notes.map(o => ({
      ...o.get({ plain: true }),
      date: safeDateFormatter(o.date) // 使用安全格式化函式
    })));
    
  } catch (error) {
    res.status(500).json({
      error: true,
      message: '取得專案成果失敗',
      details: error.message
    });
  }
};

exports.getMyNotes = async (req, res) => {
  try {
    const notes = await Note.findAll({
      include: [
        {
          model: Project,
          where: { user_id: req.user.id }
        }
      ]
    });
    
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "獲取用戶Note失敗",
      details: error.message
    });
  }
};

exports.getNoteDetail = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId, {
      attributes: ['id', 'is_public', 'user_id']
    });
    
    if (!project) {
      return res.status(404).json({
        error: true,
        message: '專案不存在'
      });
    }

    // 權限檢查強化版
    const hasAccess = project.is_public || 
                     (req.user && (project.user_id === req.user.id || req.user.isAdmin));
    
    if (!hasAccess) {
      return res.status(403).json({
        error: true,
        message: '無權限查看此專案成果',
        required: '專案擁有者或管理員權限'
      });
    }

    // 修正為查詢單一成果
    const note = await Note.findOne({
      where: {
        id: req.params.noteId,
        project_id: req.params.projectId
      },
      attributes: ['id', 'week', 'title', 'description', 'date', 'img_url']
    });

    if (!note) {
      return res.status(404).json({
        error: true,
        message: '成果不存在'
      });
    }

    // 安全日期格式化
    const safeDateFormatter = (dateValue) => {
      try {
        const dateObj = dateValue instanceof Date 
          ? dateValue 
          : new Date(dateValue);
        return isNaN(dateObj.getTime()) 
          ? '日期格式錯誤' 
          : dateObj.toISOString().split('T')[0];
      } catch {
        return '無效日期';
      }
    };

    res.json({
      ...note.get({ plain: true }),
      date: safeDateFormatter(note.date)
    });
    
  } catch (error) {
    res.status(500).json({
      error: true,
      message: '取得成果失敗',
      systemError: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateNote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const note = await Note.findOne({
      where: {
        id: req.params.noteId,
        project_id: req.params.projectId
      },
      transaction
    });

    if (!note) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '成果不存在'
      });
    }

    const updates = {};
    ['week', 'title', 'description', 'date', 'img_url'].forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await note.update(updates, { transaction });
    await transaction.commit();
    const responseData = {
        id: note.id,
        week: note.week,
        title: note.title,
        description: note.description,
        date: note.date.toISOString().split('T')[0],
        img_url: note.img_url
      };
  
    res.json(responseData);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      error: true,
      message: '更新失敗',
      details: error.errors?.map(e => e.message)
    });
  }
};

exports.deleteNote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const note = await Note.findOne({
      where: {
        id: req.params.noteId,
        project_id: req.params.projectId
      },
      transaction
    });

    if (!note) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '成果不存在'
      });
    }

    await note.destroy({ transaction });
    await transaction.commit();
    
    res.json({ message: '成果已刪除' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      error: true,
      message: '刪除失敗'
    });
  }
};