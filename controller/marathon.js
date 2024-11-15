const Marathon = require("../models/marathon.model");


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
    await marathon.save();
    res.status(201).send(marathon);
  } catch (error) {
    res.status(400).send(error);
  }
};


exports.getAllMarathons = async (req, res) => {
  try {
    const marathons = await Marathon.find();
    res.status(200).send(marathons);
  } catch (error) {
    res.status(500).send(error);
  }
};


exports.getMarathonById = async (req, res) => {
  try {
    const marathon = await Marathon.findById(req.params.id);
    if (!marathon) return res.status(404).send("Marathon not found");
    res.status(200).send(marathon);
  } catch (error) {
    res.status(500).send(error);
  }
};


exports.updateMarathon = async (req, res) => {
  try {
    const marathon = await Marathon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!marathon) return res.status(404).send("Marathon not found");
    res.status(200).send(marathon);
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
