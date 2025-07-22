const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

exports.getAuthenticatedUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ id: user.id, email: user.email, username: user.username });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//edit profile endpoint
exports.editProfile = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.email = email ? email : user.email;
    user.username = username ? username : user.username;
    if (password && password === confirmPassword) {
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();
    res.json({ id: user.id, email: user.email, username: user.username });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};