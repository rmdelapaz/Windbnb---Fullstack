const express = require('express');
const bcrypt = require('bcryptjs');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

const validateSignup = [
  check('email')
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage("Invalid email"),
  check('username')
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage("Username is required"),
  check('username')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email.'),
  check('firstName')
    .exists({ checkFalsy: true })
    .withMessage("First Name is required"),
  check('lastName')
    .exists({ checkFalsy: true })
    .withMessage("Last Name is required"),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  handleValidationErrors
];

// Sign up
router.post('/', validateSignup, async (req, res) => {
  const { firstName, lastName, email, password, username } = req.body;

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    return res.status(500).json({
      message: "User already exists",
      errors: { email: "User with that email already exists" }
    });
  }

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    return res.status(500).json({
      message: "User already exists",
      errors: { username: "User with that username already exists" }
    });
  }
  const hashedPassword = bcrypt.hashSync(password);
  const user = await User.create({ firstName, lastName, email, username, hashedPassword });

  const safeUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username,
  };

  await setTokenCookie(res, safeUser);

  return res.status(201).json({
    user: safeUser
  });
}

);
module.exports = router;