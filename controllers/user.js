// controllers/user.js
const User = require("../models/user");
const Role = require("../models/role");
const UserProfile = require("../models/userProfile");
const Location = require("../models/location");
const { Op } = require("sequelize");
const Contact = require("../models/contact");
const BasicInfo = require("../models/basicInfo");
const Area = require("../models/area");
const Position = require("../models/position");
const UserPosition = require("../models/userPosition");
const sequelize = require("../config/db");
const moment = require('moment-timezone');
const { verifyToken, generateToken } = require("../services/jwt");
const TempUser = require("../models/tempUser.model");
const sendVerifiedEmail = require("../controller/sendVerifiedEmail");
const { FRONTEND_URL, BACKEND_URL } = process.env;
const { validate: isUuid } = require('uuid');
const City = require("../models/city");
const Country = require("../models/country");

const formatToTaipeiTime = (date) => {
  if (!date) return null;
  return moment(date).tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss');
};

const formatUserResponse = (user) => {
  const userJson = user.toJSON();
  return {
    id: userJson.id,
    _id: userJson.external_id,
    name: userJson.nickname,
    gender: userJson.gender,
    email: userJson.Contact?.email,
    photoURL: userJson.Contact?.photo_url,
    birthDay: userJson.birth_date,
    isOpenLocation: userJson.is_open_location,
    isOpenProfile: userJson.is_open_profile,
    role: userJson.Role?.id,
    location: userJson.Location?.City?.name || '',
    tagList: userJson.tag_list,
    wantToDoList: userJson.BasicInfo?.want_to_do_list || [],
    educationStage: userJson.education_stage,
    selfIntroduction: userJson.BasicInfo?.self_introduction,
    share: userJson.BasicInfo?.share_list,
    contactList: {
      email: userJson.Contact?.email,
      photoUrl: userJson.Contact?.photo_url,
      isSubscribeEmail: userJson.Contact?.is_subscribe_email,
      instagram: userJson.Contact?.ig,
      discord: userJson.Contact?.discord,
      line: userJson.Contact?.line,
      facebook: userJson.Contact?.fb
    },
    basicInfo: {
      selfIntroduction: userJson.BasicInfo?.self_introduction,
      shareList: userJson.BasicInfo?.share_list,
      wantToDoList: userJson.BasicInfo?.want_to_do_list || []
    },
    roleList: userJson.Positions?.map(p => p.name) || [],
    createdDate: formatToTaipeiTime(userJson.created_at),
    updatedDate: formatToTaipeiTime(userJson.updated_at)
  };
};

// 获取所有用户
exports.getAllUsers = async (req, res) => {
  try {
    let { page = 1, pageSize = 10, educationStage, roleList, location, search } = req.query;

    page = parseInt(page);
    pageSize = parseInt(pageSize);
    const offset = (page - 1) * pageSize;

    const whereConditions = {
      is_open_profile: true // 默认只显示开放资料的用户
    };

    // 教育阶段过滤
    if (educationStage) {
      whereConditions.education_stage = educationStage.split(',');
    }

    // 角色过滤
    if (roleList) {
      whereConditions['$Positions.name$'] = {
        [Op.in]: roleList.split(',')
      };
    }

    // 地区过滤
    if (location) {
      whereConditions['$Location.City.name$'] = {
        [Op.in]: location.split(',')
      };
    }

    // 搜索条件
    if (search) {
      whereConditions[Op.or] = [
        { nickname: { [Op.iLike]: `%${search}%` } },
        { '$BasicInfo.self_introduction$': { [Op.iLike]: `%${search}%` } },
        { '$BasicInfo.share_list$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Role,
        },
        {
          model: Location,
          attributes: [],
          include: [
            { model: City, required: false },
            { model: Country, required: false }
          ],
          required: false
        },
        {
          model: Contact,
          required: false
        },
        {
          model: BasicInfo,
          required: false
        },
        {
          model: Position,
          through: { attributes: [] },
          required: false
        }
      ],
      distinct: true,
      offset,
      limit: pageSize,
      order: [['created_at', 'DESC']]
    });

    const formattedData = rows.map(user => ({
      ...formatUserResponse(user)
    })
    );

    const response = {
      data: formattedData,
      page,
      pageSize,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize)
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message
    });
  }
};

// 获取当前用户
exports.getMe = async (req, res) => {
  try {
    const currentUser = req.user;

    if (!isUuid(currentUser._id)) {
      let user = null;
      const response = {
        data: user,
        message: "User not found"
      };
      return res.status(200).json(response);
    }
    // 修改部分：添加格式化邏輯
    const user = await User.findOne({
      where: { external_id: currentUser._id },
      include: [
        { model: Role },
        {
          model: Location,
          include: [
            { model: City, attributes: ['name'] },
            { model: Country, attributes: ['name'] }
          ]
        },
        {
          model: Contact,
        },
        { model: BasicInfo },
        {
          model: Position,
          through: { attributes: [] },
        }
      ]
    });

    if (!user) {
      user = null;
      const response = {
        data: user,
        message: "User not found"
      };
      return res.status(200).json(response);
    }

    const response = {
      data: formatUserResponse(user),
    };
    console.log("getMe_response", response)
    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
      details: error.message
    });
  }
};

exports.getOneUser = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { external_id: req.params.id },
      include: [
        { model: Role },
        { model: Location },
        { model: Contact },
        { model: BasicInfo },
        {
          model: Position,
          through: { attributes: [] },
        }
      ],
    });

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found"
      });
    }

    const response = {
      data: [formatUserResponse(user)],
    };

    console.log("getOneUser_response", response)


    res.status(200).json(response);

  } catch (error) {
    console.error('获取用户错误：', {
      error: error.toString(),
      stack: error.stack,
      externalId: req.params.id
    });

    res.status(500).json({
      error: true,
      message: "Error fetching user",
      details: error.message
    });
  }
};

exports.createUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  const requestData = { ...req.body };
  let tempUser = null;
  let newUser = null;

  try {
    const {
      gender,
      birthDate,
      contactList,
      educationStage,
      isOpenLocation,
      isOpenProfile,
      isSubscribeEmail,
      location: areaCode,
      roleList,
      selfIntroduction,
      share,
      wantToDoList,
      tagList,
      interestList
    } = requestData;


    const userData = req.body;
    const { isSendEmail } = userData
    console.log("isSendEmail", isSendEmail);
    console.log("req.user", req.user);
    console.log("req.user._id", req.user._id);
    // 查找臨時用戶
    tempUser = await TempUser.findOne({ _id: req.user._id });
    console.log("tempUser", tempUser);
    if (!tempUser) {
      return res.status(404).json({ error: 'Temporary user not found' });
    }

    const existingUser = await User.findOne({
      where: { nickname: req.user.name },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        error: true,
        message: "建立失敗",
        details: `使用者名稱 ${nickname} 已存在`
      });
    }

    // const existingContact = await Contact.findOne({
    //   where: { email },
    //   transaction
    // });

    // if (existingContact) {
    //   await transaction.rollback();
    //   return res.status(400).json({
    //     error: true,
    //     message: "建立失敗",
    //     details: `信箱 ${email} 已被註冊`
    //   });
    // }

    let locationId = null;
    if (areaCode) {
      const area = await Area.findOne({
        where: { city: areaCode },
        transaction
      });

      if (!area) {
        await transaction.rollback();
        return res.status(400).json({
          error: true,
          message: "Invalid area code",
          details: `'${areaCode}' 不是有效的城市名稱`
        });
      }
      locationId = area.id;
    }

    const contact = await Contact.create({
      google_id: tempUser.googleID,
      photo_url: tempUser.photoURL,
      is_subscribe_email: isSubscribeEmail,
      email: tempUser.email,
      ig: contactList?.instagram,
      discord: contactList?.discord,
      line: contactList?.line,
      fb: contactList?.facebook
    }, { transaction });

    const basicInfo = await BasicInfo.create({
      self_introduction: selfIntroduction,
      share_list: share,
      want_to_do_list: wantToDoList
    }, { transaction });

    newUser = await User.create({
      mongo_id: tempUser._id.toString(),
      nickname: tempUser.name,
      gender,
      education_stage: educationStage,
      tag_list: tagList,
      contact_id: contact.id,
      is_open_location: isOpenLocation,
      location_id: locationId,
      role_id: 2, // 默認角色
      is_open_profile: isOpenProfile,
      birth_date: birthDate,
      basic_info_id: basicInfo.id,
    }, { transaction });

    // 处理职位关联
    if (roleList && roleList.length) {
      const positions = await Position.findAll({
        where: { name: { [Op.in]: roleList } },
        transaction
      });

      if (positions.length > 0) {
        const positionValues = positions.map(position => ({
          user_id: newUser.id,
          position_id: position.id
        }));

        const insertQuery = `
          INSERT INTO user_positions (user_id, position_id)
          VALUES ${positionValues.map(v => `(${v.user_id}, ${v.position_id})`).join(',')}
        `;

        await sequelize.query(insertQuery, {
          transaction
        });
      }
    }

    // 獲取完整的用戶信息
    const createdUser = await User.findOne({
      where: { id: newUser.id },
      include: [
        { model: Role },
        {
          model: Location,
          attributes: [],
          include: [
            { model: City, attributes: ['name'] },
            { model: Country, attributes: ['name'] }
          ],
          required: false
        },
        Contact,
        BasicInfo,
        {
          model: Position,
          through: { attributes: [] },
        }
      ],
      transaction
    });


    const newToken = generateToken({
      id: createdUser.id,
      _id: createdUser.external_id,
      isTemp: false,
    });

    const verifyLink = `${BACKEND_URL}/email/verify?token=${newToken}`;
    console.log("verifyLink", verifyLink);

    // 發送註冊郵件
    console.log('isSendEmail', isSendEmail);
    if (isSendEmail) {
      await sendVerifiedEmail(createdUser.Contact?.email, createdUser.nickname, verifyLink);

      await TempUser.findByIdAndDelete(req.user._id);
      console.log('TempUser删除成功:');
    }

    await transaction.commit();
    res.status(201).json({ message: "User created successfully", user: formatUserResponse(createdUser), token: newToken });

  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    console.error('完整錯誤日誌：', {
      error: error.toString(),
      stack: error.stack,
      sql: error.sql,
      requestData: {
        roleList: requestData.roleList,
        email: tempUser.email,
        nickname: tempUser.name
      },
      newUserId: newUser?.id
    });
    res.status(500).json({
      error: true,
      message: "使用者建立失敗",
      details: `資料庫錯誤：${error.original ? error.original.message : error.message}`
    });
  }
};

exports.updateUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    console.log('Update request:', {
      externalId: req.params.id,
      body: req.body
    });
    const user = await User.findOne({
      where: { external_id: req.params.id },
      include: [
        {
          model: Location,
          attributes: [],
          include: [
            { model: City, attributes: ['name'] },
            { model: Country, attributes: ['name'] }
          ],
          required: false
        },
        Contact,
        BasicInfo,
        {
          model: Position,
          through: { attributes: [] }
        }
      ],
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: "用户不存在"
      });
    }

    const {
      name: nickname,
      email,
      photoUrl,
      gender,
      birthDate,
      contactList,
      educationStage,
      isOpenLocation,
      isOpenProfile,
      isSubscribeEmail,
      selfIntroduction,
      share,
      wantToDoList,
      tagList,
      roleList,
      interestList
    } = req.body;
    console.log('Before update:', {
      userId: user.id,
      currentTagList: user.tag_list,
      newTagList: tagList
    });
    // 更新联系方式
    if (user.Contact) {
      await user.Contact.update({
        photo_url: photoUrl,
        is_subscribe_email: isSubscribeEmail,
        email,
        ig: contactList?.instagram,
        discord: contactList?.discord,
        line: contactList?.line,
        fb: contactList?.facebook
      }, { transaction });
    }

    // 更新基本信息
    if (user.BasicInfo) {
      await user.BasicInfo.update({
        self_introduction: selfIntroduction,
        share_list: share,
        want_to_do_list: wantToDoList
      }, { transaction });
    }

    // 更新用户主表
    await user.update({
      nickname,
      gender,
      tag_list: tagList,
      education_stage: educationStage,
      is_open_location: isOpenLocation,
      is_open_profile: isOpenProfile,
      birth_date: birthDate,
      updated_at: new Date()
    }, { transaction });

    // 更新职位关联
    if (roleList && Array.isArray(roleList)) {
      // 1. 先删除现有的关联
      await sequelize.query(
        'DELETE FROM user_positions WHERE user_id = ?',
        {
          replacements: [user.id],
          type: sequelize.QueryTypes.DELETE,
          transaction
        }
      );

      // 2. 如果有新的角色列表，则添加新的关联
      if (roleList.length > 0) {
        const positions = await Position.findAll({
          where: { name: { [Op.in]: roleList } },
          transaction
        });

        if (positions.length > 0) {
          const insertValues = positions.map(position =>
            `(${user.id}, ${position.id})`
          ).join(',');

          await sequelize.query(
            `INSERT INTO user_positions (user_id, position_id) VALUES ${insertValues}`,
            {
              transaction
            }
          );
        }
      }
    }

    // 获取更新后的完整用户信息
    const updatedUser = await User.findOne({
      where: { external_id: req.params.id },
      include: [
        { model: Role },
        {
          model: Location,
          attributes: [],
          include: [
            { model: City, attributes: ['name'] },
            { model: Country, attributes: ['name'] }
          ],
          required: false
        },
        { model: Contact },
        { model: BasicInfo },
        {
          model: Position,
          through: { attributes: [] },
        }
      ],
      transaction
    });

    const response = {
      data: formatUserResponse(updatedUser),
    };

    await transaction.commit();

    res.status(200).json(response);

  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    console.error('更新用户错误：', {
      error: error.toString(),
      stack: error.stack,
      externalId: req.params.id,
      requestBody: req.body
    });
    res.status(500).json({
      error: true,
      message: "更新用户失败",
      details: error.message
    });
  }
};

exports.deleteMe = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const currentUser = req.user;
    // 1. 獲取完整用戶資料（不包含關聯）
    const user = await User.findOne({
      where: { external_id: currentUser._id },
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: "User not found" });
    }

    // 2. 刪除關聯資料（新順序）
    // 2.1 先刪除user_positions
    await UserPosition.destroy({
      where: { user_id: user.id },
      transaction
    });

    // 2.2 刪除用戶主體（先刪除user解除外鍵約束）
    await user.destroy({ transaction });

    // 2.3 後刪除contact和basic_info
    await Contact.destroy({
      where: { id: user.contact_id },  // 使用user保存的contact_id
      transaction
    });

    await BasicInfo.destroy({
      where: { id: user.basic_info_id },  // 使用user保存的basic_info_id
      transaction
    });

    await transaction.commit();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error('刪除用戶錯誤:', error);
    res.status(500).json({
      error: true,
      message: "刪除失敗",
      details: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.params.id;

    // 查找用户及其关联数据
    const user = await User.findByPk(userId, {
      include: [
        Contact,
        BasicInfo
      ],
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: "用户不存在"
      });
    }

    // 保存关联ID以便后续删除
    const contactId = user.Contact?.id;
    const basicInfoId = user.BasicInfo?.id;

    // 1. 删除用户职位关联
    await sequelize.query(
      'DELETE FROM user_positions WHERE user_id = ?',
      {
        replacements: [userId],
        type: sequelize.QueryTypes.DELETE,
        transaction
      }
    );

    // 2. 先删除用户本身（解除外键约束）
    await user.destroy({ transaction });

    // 3. 删除基本信息
    if (basicInfoId) {
      await sequelize.query(
        'DELETE FROM basic_info WHERE id = ?',
        {
          replacements: [basicInfoId],
          type: sequelize.QueryTypes.DELETE,
          transaction
        }
      );
    }

    // 4. 删除联系方式
    if (contactId) {
      await Contact.destroy({
        where: { user_id: user.id },
        transaction
      });
    }

    // 提交事务
    await transaction.commit();

    res.status(200).json({ message: "User deleted successfully" });

  } catch (error) {
    // 回滚事务
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    console.error('删除用户错误：', {
      error: error.toString(),
      stack: error.stack,
      sql: error.sql,
      userId: req.params.id
    });
    res.status(500).json({
      error: true,
      message: "删除用户失败",
      details: error.message
    });
  }
};
