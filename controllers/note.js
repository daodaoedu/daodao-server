const { Note, Project } = require('../models');
const sequelize = require('../config/db');

// 新增統一格式化方法
const formatNoteResponse = (note) => {
  return {
    id: note.id,
    week: note.week,
    title: note.title,
    date: note.date,  // 保持原始日期，外部再格式化
    imgUrl: note.img_url,
  };
}

// 安全日期格式化處理
const safeDateFormatter = (dateValue) => {
  try {
    const dateObj = dateValue instanceof Date
      ? dateValue
      : new Date(dateValue)
    if (isNaN(dateObj.getTime())) {
      return '無效日期';
    }
    return dateObj.toISOString().split('T')[0];
  } catch (e) {
    return '日期格式錯誤';
  }
};

exports.createNote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { date, ...rest } = req.body;

    // 強制日期轉換與驗證
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('無效的日期格式，請使用 YYYY-MM-DD 格式');
    }

    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const note = await Note.create({
      ...rest,
      project_id: project.id,
      date: parsedDate,
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      ...formatNoteResponse(note.get({ plain: true })),
      date: safeDateFormatter(note.date)
    });


  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }

    res.status(400).json({
      error: true,
      message: '建立便利貼失敗',
      details: error.message
    });
  }
};


exports.getNotes = async (req, res) => {
  try {

    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const notes = await Note.findAll({
      where: { project_id: project.id },
      order: [
        ['week', 'ASC'],
        ['date', 'ASC']
      ]
    });

    res.json(notes.map(o => ({
      ...formatNoteResponse(o.get({ plain: true })),
      date: safeDateFormatter(o.date)
    })));

  } catch (error) {
    res.status(500).json({
      error: true,
      message: '取得專案便利貼失敗',
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

    res.status(200).json(notes.map(o => ({
      ...formatNoteResponse(o.get({ plain: true })),
      date: safeDateFormatter(o.date)
    })));
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
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    if (!project) {
      return res.status(404).json({
        error: true,
        message: '專案不存在'
      });
    }

    // // 權限檢查強化版
    // const hasAccess = project.is_public || 
    //                  (req.user && (project.user_id === req.user.id || req.user.isAdmin));

    // if (!hasAccess) {
    //   return res.status(403).json({
    //     error: true,
    //     message: '無權限查看此專案便利貼',
    //     required: '專案擁有者或管理員權限'
    //   });
    // }

    // 修正為查詢單一便利貼
    const note = await Note.findOne({
      where: {
        id: req.params.noteId,
        project_id: project.id
      },
      attributes: ['id', 'week', 'title', 'description', 'date', 'img_url']
    });

    if (!note) {
      return res.status(404).json({
        error: true,
        message: '便利貼不存在'
      });
    }

    res.json({
      ...formatNoteResponse(note.get({ plain: true })),
      date: safeDateFormatter(note.date)
    });

  } catch (error) {
    res.status(500).json({
      error: true,
      message: '取得便利貼失敗',
      details: error.errors?.map(e => e.message)
    });
  }
};

exports.updateNote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {

    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const note = await Note.findOne({
      where: {
        id: req.params.noteId,
        project_id: project.id
      },
      transaction
    });

    if (!note) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '便利貼不存在'
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
      ...formatNoteResponse(note.get({ plain: true })),
      date: safeDateFormatter(note.date)
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
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const note = await Note.findOne({
      where: {
        id: req.params.noteId,
        project_id: project.id
      },
      transaction
    });

    if (!note) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '便利貼不存在'
      });
    }

    await note.destroy({ transaction });
    await transaction.commit();

    res.json({ message: '便利貼已刪除' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      error: true,
      message: '刪除失敗'
    });
  }
};