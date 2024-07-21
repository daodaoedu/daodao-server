const User = require("../models/user.model");
const redis = require("../services/redis");

const getPartner = async (req, res, next) => {
    try {
        let { query: { page = 1, pageSize = 30, educationStage, roleList, location, tag, search } } = req;
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);
        const _id = req.params.id;

        let filter = {};
        if (_id) {
            filter._id = _id;
        }

        if (educationStage) {
            educationStage = educationStage.split(',');
            filter.educationStage = { $in: educationStage };
        }
        if (roleList) {
            roleList = roleList.split(',');
            filter.roleList = { $in: roleList };
        }

        if (location) {
            location = location.split(',');
            filter.location = { $in: location };
        }

        if (tag) {
            tag = tag.split(',');
            filter.tagList = { $in: tag };
        }
        if (search) {
            let searchQuery = {
                $or: [
                    { name: new RegExp(search, 'i') },
                    { selfIntroduction: new RegExp(search, 'i') },
                    { share: new RegExp(search, 'i') },
                    { roleList: new RegExp(search, 'i') },
                    { interestList: new RegExp(search, 'i') },
                    { tagList: new RegExp(search, 'i') },
                ]
            };
            filter = searchQuery;
        }

        const cacheKey = `partners:${JSON.stringify(filter)}`;
        const cachedData = await redis.get(cacheKey);
        let allData = cachedData ? JSON.parse(cachedData) : [];

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        if (allData.length < endIndex) {
            const additionalData = await User.find(filter)
                .skip(allData.length)
                .limit(30); 

            allData = allData.concat(additionalData);
            await redis.set(cacheKey, JSON.stringify(allData), 'EX', 3600); 
        }

        const pagedData = allData.slice(startIndex, endIndex);
        const totalCount = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / pageSize);

        const response = {
            data: pagedData,
            page,
            pageSize,
            totalCount,
            totalPages,
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

const update = async (req, res, next) => {
  try {
      const _id = req.params.id;
      let user = await User.findOne({ _id });
      if (!user) {
          throw new Error("找不到用戶");
      }

      const fieldsToUpdate = [
          'birthDay', 'contactList', 'educationStage', 'email', 'gender', 'googleID',
          'name', 'photoURL', 'interestList', 'isOpenLocation', 'isOpenProfile',
          'isSubscribeEmail', 'location', 'roleList', 'selfIntroduction', 'share',
          'tagList', 'wantToDoList'
      ];

      let isUpdated = false;
      fieldsToUpdate.forEach(field => {
          if (req.body[field] !== undefined) {
              user[field] = req.body[field];
              isUpdated = true;
          }
      });

      if (isUpdated) {
          user.updatedDate = Date.now();
          const updatedUserProfile = await user.save();

          // 更新 Redis 快取
          const updateCache = async () => {
              const cacheKeys = await redis.keys('partners:*');
              for (let cacheKey of cacheKeys) {
                  const cachedData = await redis.get(cacheKey);
                  if (cachedData) {
                      const partners = JSON.parse(cachedData);
                      const userIndex = partners.findIndex(partner => partner._id.toString() === _id);
                      if (userIndex !== -1) {
                          partners[userIndex] = updatedUserProfile.toObject();
                          await redis.set(cacheKey, JSON.stringify(partners), 'EX', 3600);
                      }
                  }
              }

              // 更新用戶特定的快取
              const userCacheKey = `partners:${_id}`;
              await redis.set(userCacheKey, JSON.stringify(updatedUserProfile.toObject()), 'EX', 3600);
          };

          // 非同步更新快取，不阻塞響應
          updateCache().catch(console.error);

          res.json({ data: updatedUserProfile, message: "用戶資料已更新" });
      } else {
          res.json({ message: "沒有字段被更新" });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: '發生錯誤' });
  }
};

module.exports = {
    getPartner,
    update,
};
