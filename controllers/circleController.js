const circleService = require('../services/circleService');

exports.getCircle = async (req, res) => {
  try {
    const result = await circleService.getCircles(req.query, req.params);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.createCircle = async (req, res) => {
  try {
    const newCircle = await circleService.createCircle(req.body);
    res.status(201).json({ data: newCircle });
  } catch (error) {
    if (error.message === "Circle already exists") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateCircle = async (req, res) => {
  try {
    const updatedCircle = await circleService.updateCircle(req.params.id, req.body, req.user.id);
    if (updatedCircle) {
      res.json({ data: circleService.formatCircleResponse(updatedCircle), message: "Circle updated successfully." });
    } else {
      res.json({ message: "No fields were updated" });
    }
  } catch (error) {
    if (error.message === "Circle not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "You are not authorized to update this circle") {
      return res.status(403).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCircle = async (req, res) => {
  try {
    await circleService.deleteCircle(req.params.id, req.user.id);
    res.status(200).json({ message: "Circle deleted successfully." });
  } catch (error) {
    if (error.message === "Circle not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "You are not authorized to delete this circle") {
      return res.status(403).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.changeCircleStatus = async (req, res) => {
  try {
    await circleService.changeCircleStatus(req.params.id, req.body, req.user.id);
    res.status(200).json({ message: "Circle status changed successfully." });
  } catch (error) {
    if (error.message === "Circle not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "You are not authorized to change the status of this circle") {
      return res.status(403).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
