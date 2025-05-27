const { Note, Post, Project, User, Contact, Position } = require('../models');
const sequelize = require('../config/db');

// 新增統一格式化方法
const formatNoteResponse = (note, post) => {
  return {
    id: note.id,
    week: post.week,
    title: post.title,
    content: note.content,
    date: safeDateFormatter(post.date),
    imgUrls: note?.image_urls,
    videoUrls: note?.video_urls,
    visibility: post?.visibility,
    user: note.User
      ? {
          id: note.User.id,
          name: note.User.nickname,
          _id: note.User.external_id,
          roleList: note.User.Positions ? note.User.Positions.map(p => p.name) : [],
          photoURL: note.User.Contact ? note.User.Contact.photo_url : null,
        }
      : null
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

/**
 * 根據便利貼的 post.user_id 查詢 User 資料並附加
 */
const attachUserToNote = async (note, post) => {
  const user = await User.findOne({
    where: { id: post.user_id },
    attributes: ['id', 'nickname', 'external_id'],
    include: [
      { model: Contact },
      { model: Position, through: { attributes: [] } }
    ]
  });
  note.User = user;
  return note;
};

exports.createNote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { week, title ,date, content, imgUrls, videoUrls, visibility } = req.body;

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
      image_urls: imgUrls
        ? (Array.isArray(imgUrls) ? imgUrls : [imgUrls])
        : [],
      video_urls: videoUrls
        ? (Array.isArray(videoUrls) ? videoUrls : [videoUrls])
        : [],
      visibility: visibility || 'private'
    }, { transaction });

    await transaction.commit();
    
    // 取得 note 和 post 的純文本形式
    let plainNote = note.get({ plain: true });
    const plainPost = post.get({ plain: true });
    
    // 附加用戶資料
    plainNote = await attachUserToNote(plainNote, plainPost);

    return res.status(201).json(
      formatNoteResponse(plainNote, plainPost)
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

    const formattedNotes = await Promise.all(notes
      .map(async note => {
        const post = note.Post; // 使用解構方式取得關聯
        if (!post) {
          console.error(`發現無效的便利貼關聯，note ID: ${note.id}`);
          return null;
        }
        
        // 取得純文本形式
        let plainNote = note.get({ plain: true });
        const plainPost = post.get({ plain: true });
        
        // 附加用戶資料
        plainNote = await attachUserToNote(plainNote, plainPost);
        
        return formatNoteResponse(plainNote, plainPost);
      })
    ).then(results => results.filter(Boolean));

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

    const formattedNotes = await Promise.all(
      notes
        .filter(note => note.Post)
        .map(async note => {
          let plainNote = note.get({ plain: true });
          const plainPost = note.Post.get({ plain: true });
          
          // 附加用戶資料
          plainNote = await attachUserToNote(plainNote, plainPost);
          
          return formatNoteResponse(plainNote, plainPost);
        })
    );

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

    // 取得純文本資料
    let plainNote = note.get({ plain: true });
    const plainPost = note.Post.get({ plain: true });
    
    // 附加用戶資料
    plainNote = await attachUserToNote(plainNote, plainPost);
    
    return res.json(formatNoteResponse(plainNote, plainPost));
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
    const { week, title, content, date, imgUrls, videoUrls, visibility } = req.body;
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
    if (content !== undefined) updatesNote.content = content;

    if (imgUrls !== undefined) {
      updatesNote.image_urls = Array.isArray(imgUrls) ? imgUrls : [imgUrls];
    }
    if (videoUrls !== undefined) {
      updatesNote.video_urls = Array.isArray(videoUrls) ? videoUrls : [videoUrls];
    }
    if (Object.keys(updatesNote).length > 0) {
      await note.update(updatesNote, { transaction });
    }

    await transaction.commit();
    
    // 取得純文本資料
    let plainNote = note.get({ plain: true });
    const plainPost = note.Post.get({ plain: true });
    
    // 附加用戶資料
    plainNote = await attachUserToNote(plainNote, plainPost);
    
    return res.json(
      formatNoteResponse(plainNote, plainPost)
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


exports.getPublicNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const { count, rows: notes } = await Note.findAndCountAll({
      include: [{
        model: Post,
        where: { visibility: 'public' },
        required: true
      }],
      order: [
        [Post, 'week', 'ASC'],
        [Post, 'date', 'ASC']
      ],
      limit: pageSize,
      offset: offset
    });

    const formattedData = await Promise.all(notes
      .map(async note => {
        const post = note.Post;
        if (!post) {
          console.error(`發現無效的便利貼關聯，note ID: ${note.id}`);
          return null;
        }
        
        // 取得純文本資料
        let plainNote = note.get({ plain: true });
        const plainPost = post.get({ plain: true });
        
        // 附加用戶資料
        plainNote = await attachUserToNote(plainNote, plainPost);
        
        return formatNoteResponse(plainNote, plainPost);
      })
    ).then(results => results.filter(Boolean));

    const response = {
      data: formattedData,
      page,
      pageSize,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize)
    };

    return res.json(response);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: '取得公開便利貼失敗',
      details: error.message
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
