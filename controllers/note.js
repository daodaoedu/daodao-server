const { Note, Post, Project } = require('../models');
const sequelize = require('../config/db');

// 新增統一格式化方法
const formatNoteResponse = (note,post) => {
  return {
    id: note.id,
    week: post.week,
    title: post.title,
    content: note.content,
    date: safeDateFormatter(post.date),
    imageUrls: note?.image_urls,
    videoUrls: note?.video_urls,
    visibility: post?.visibility
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
    const { week, title ,date, content, imageUrls, videoUrls, visibility } = req.body;

    // 強制日期轉換與驗證
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('無效的日期格式，請使用 YYYY-MM-DD 格式');
    }

    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    if (!project) {
      throw new Error('專案不存在');
    }

    const post = await Post.create({
      project_id: project.id,
      user_id: req.user.id,
      week,
      title,
      type: 'note',
      date: parsedDate,
      visibility: visibility || 'private'
    }, { transaction });

    const note = await Note.create({
      post_id: post.id,
      content: content,
      image_urls: imageUrls
        ? (Array.isArray(imageUrls) ? imageUrls : [imageUrls])
        : [],
      video_urls: videoUrls
        ? (Array.isArray(videoUrls) ? videoUrls : [videoUrls])
        : [],
      visibility: visibility || 'private'
    }, { transaction });

    await transaction.commit();

    return res.status(201).json(
      formatNoteResponse(note.get({ plain: true }), post.get({ plain: true }))
    );
  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    return res.status(400).json({
      error: true,
      message: '建立便利貼失敗',
      details: error.message
    });
  }
};


exports.getNotes = async (req, res) => {
  try {
    const project = await Project.findOne({ 
      where: { external_id: req.params.projectId } 
    });
    if (!project) {
      return res.status(404).json({ error: true, message: '專案不存在' });
    }

    const notes = await Note.findAll({
      include: [{
        model: Post,
        where: { 
          project_id: project.id, 
          type: 'note' 
        },
        required: true
      }],
      order: [
        [Post, 'week', 'ASC'],
        [Post, 'date', 'ASC']
      ]
    });

    const formattedNotes = notes
      .map(note => {
        const post = note.Post; // 使用解構方式取得關聯
        if (!post) {
          console.error(`發現無效的便利貼關聯，note ID: ${note.id}`);
          return null;
        }
        return formatNoteResponse(
          note.get({ plain: true }), 
          post.get({ plain: true })
        );
      })
      .filter(Boolean);

    return res.json(formattedNotes);
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
      include: [{
        model: Post,
        include: [{
          model: Project,
          where: { user_id: req.user.id }
        }]
      }]
    });

    const formattedNotes = notes
      .filter(note => note.Post)
      .map(note => formatNoteResponse(note.get({ plain: true }), note.Post.get({ plain: true })));

    return res.status(200).json(formattedNotes);
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "取得Note失敗",
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
    
    const note = await Note.findOne({
      where: { id: req.params.noteId },
      include: [{
        model: Post,
        where: { project_id: project.id }
      }]
    });

    if (!note) {
      return res.status(404).json({
        error: true,
        message: '便利貼不存在'
      });
    }

    return res.json(formatNoteResponse(note.get({ plain: true }), note.Post.get({ plain: true })));
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
    if (!project) {
      throw new Error('專案不存在');
    }

    // 查詢 Note 並 include 關聯的 Post（以確認該筆便利貼屬於此專案）
    const note = await Note.findOne({
      where: { id: req.params.noteId },
      include: [{
        model: Post,
        where: { project_id: project.id }
      }],
      transaction
    });

    if (!note) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '便利貼不存在'
      });
    }

    // 解構 req.body（請直接使用變數名稱）
    const { week, title, content, date, imageUrls, videoUrls, visibility } = req.body;
    const updatesPost = {};

    if (week !== undefined) updatesPost.week = week;
    if (title !== undefined) updatesPost.title = title;
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('無效的日期格式，請使用 YYYY-MM-DD 格式');
      }
      updatesPost.date = parsedDate;
    }
    if (visibility !== undefined) updatesPost.visibility = visibility;

    if (Object.keys(updatesPost).length > 0 && note.Post) {
      await note.Post.update(updatesPost, { transaction });
    }

    const updatesNote = {};
    if (content !== undefined) updatesPost.content = content;

    if (imageUrls !== undefined) {
      updatesNote.image_urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    }
    if (videoUrls !== undefined) {
      updatesNote.video_urls = Array.isArray(videoUrls) ? videoUrls : [videoUrls];
    }
    if (Object.keys(updatesNote).length > 0) {
      await note.update(updatesNote, { transaction });
    }

    await transaction.commit();
    return res.json(
      formatNoteResponse(note.get({ plain: true }), note.Post.get({ plain: true }))
    );
  } catch (error) {
    await transaction.rollback();
    return res.status(400).json({
      error: true,
      message: '更新失敗',
      details: error.errors?.map(e => e.message) || error.message
    });
  }
};


exports.deleteNote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const note = await Note.findOne({
      where: { id: req.params.noteId },
      include: [{
        model: Post,
        where: { project_id: project.id }
      }],
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
    return res.json({ message: '便利貼已刪除' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      error: true,
      message: '刪除失敗'
    });
  }
};
