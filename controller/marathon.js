const Marathon = require("../models/marathon.model");
const User = require("../models/user.model");
const sendMarathonEmail = require("../controller/sendMarathonEmail");

const  { verifyToken } = require("../services/jwt");


exports.createMarathon = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if(!token){
        return res.status(401).json({message: "No token provided"});
      }
    const cleanedToken = token.replace('Bearer', '').trim();
    let decoded = verifyToken(cleanedToken);

    if (decoded.error) {
        return res.status(401).json({ message: decoded.error });
    }
    const marathon = new Marathon(req.body);

    const existingMarathon = await Marathon.findOne({ userId: req.body.userId });
    if (existingMarathon) {
      return res.status(400).json({ message: "You can only create one marathon" });
    }
    
    let user = await User.findById(marathon.userId);
    console.log('marathon.user'+ user);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    await sendMarathonEmail(user.email, user.name, marathon.title);

    marathon.isSendEmail = true;

    await marathon.save();
    const response = {
      data: marathon,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
};


exports.handleMarathonRequest = async (req, res) => {
  const { userId, eventId } = req.query;

  if (userId) {
      // 如果有 userId，執行基於 userId 和 eventId 的邏輯
      return getMarathonsByUserAndEvent(req, res);
  } else {
      // 如果沒有 userId，執行取得所有資料的邏輯
      return getAllMarathons(req, res);
  }
};

const getAllMarathons = async (req, res) => {
  try {
    const marathon = await Marathon.find();
    const response = {
      data: marathon,
    };

    res.json(response);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getMarathonsByUserAndEvent = async (req, res) => {
  try {
      const { userId, eventId } = req.query;

      // 檢查 userId 是否存在
      if (!userId) {
          return res.status(400).json({ error: "userId is required" });
      }

      // 構建查詢條件
      let query = { userId };

      // 如果有提供 eventId，則添加到查詢條件
      if (eventId) {
          query.eventId = eventId;
      }

      // 查詢資料庫
      const marathons = await Marathon.find(query);
      const response = {
        data: marathons,
      };
      // 回傳結果
      return res.json(response);

  } catch (error) {
      console.error("Error fetching marathons:", error);
      return res.status(500).json({ error: "Internal server error" });
  }
};



exports.getMarathonById = async (req, res) => {
  try {
    const marathon = await Marathon.findById(req.params.id);
    if (!marathon) return res.status(404).send("Marathon not found");
    const response = {
      data: marathon,
    };

    res.json(response);
  } catch (error) {
    res.status(500).send(error);
  }
};


exports.updateMarathon = async (req, res) => {
  try {
    req.body.updatedDate = Date.now();
    const marathon = await Marathon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!marathon) return res.status(404).send("Marathon not found");

    const response = {
      data: marathon,
    };

    res.json(response);
  } catch (error) {
    res.status(400).send(error);
  }
};


exports.deleteMarathon = async (req, res) => {
  try {
    const marathon = await Marathon.findByIdAndDelete(req.params.id);
    if (!marathon) return res.status(404).send("Marathon not found");
    res.status(200).send("Marathon successfully deleted");
  } catch (error) {
    res.status(500).send(error);
  }
};
