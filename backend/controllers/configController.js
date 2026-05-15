const GlobalConfig = require('../models/GlobalConfig');

/**
 * @desc    Get all configurations
 * @route   GET /api/config
 * @access  Public
 */
exports.getConfigs = async (req, res, next) => {
  try {
    const configs = await GlobalConfig.find();
    const configMap = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });
    res.json({ success: true, data: configMap });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a configuration
 * @route   PUT /api/config/:key
 * @access  Private/Admin
 */
exports.updateConfig = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const config = await GlobalConfig.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};
