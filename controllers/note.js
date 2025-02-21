const { Note, Post, Project } = require('../models');
const sequelize = require('../config/db');

// 新增統一格式化方法
const formatNoteResponse = (note,post) => {
  return {
    id: note.id,
    content: post.content,
    date: safeDateFormatter(post.date),
    image_urls: note.image_urls,
    video_urls: note.video_urls,
    visibility: post.visibility
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
    const { date, description, image_urls, video_urls, visibility } = req.body;

    // 強制日期轉換與驗證
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('無效的日期格式，請使用 YYYY-MM-DD 格式');
    }

    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const post = await Post.create({
      study_plan_id: project.id,
      user_id: req.user.id,
      type: 'note',
      content: description, // 可將原先 title/description 組合後存入此欄
      date: parsedDate,
      visibility: visibility || 'private'
    }, { transaction });

    const note = await Note.create({
      post_id: post.id,
      image_urls: image_urls ? (Array.isArray(image_urls) ? image_urls : [image_urls]) : [],
      video_urls: video_urls ? (Array.isArray(video_urls) ? video_urls : [video_urls]) : [],
      visibility: visibility || 'private'
    }, { transaction });


    await transaction.commit();

    res.status(201).json({
      ...formatNoteResponse(note.get({ plain: true }),post.get({ plain: true })),
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
    if (!project) {
      return res.status(404).json({ error: true, message: '專案不存在' });
    }

    const posts = await Post.findAll({
      where: { study_plan_id: project.id, type: 'note' },
      include: [{ model: Note}],
      order: [['date', 'ASC']]
    });

    const notes = posts.map(post => ({
      note_id: post.Note ? post.Note.id : null,
      post_id: post.id,
      content: post.content,
      date: safeDateFormatter(post.date),
      image_urls: post.Note ? post.Note.image_urls : [],
      video_urls: post.Note ? post.Note.video_urls : [],
      visibility: post.visibility
    }));

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