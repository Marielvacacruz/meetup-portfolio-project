const express = require('express');

const { setTokenCookie} = require('../utils/auth');
const { User } = require('../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../utils/validation');


const router = express.Router();

//middleware to validate sign up
const validateSignup = [
  //add validations for first and last names
    check('email')
      .exists({ checkFalsy: true })
      .isEmail()
      .withMessage('Please provide a valid email.'),
    check('username')
      .exists({ checkFalsy: true })
      .isLength({ min: 4 })
      .withMessage('Please provide a username with at least 4 characters.'),
    check('username')
      .not()
      .isEmail()
      .withMessage('Username cannot be an email.'),
    check('password')
      .exists({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('Password must be 6 characters or more.'),
    handleValidationErrors
  ];

//Sign up
router.post('/', validateSignup, async (req, res) => {
    const { email, username, password, firstName, lastName} = req.body;

    const user = await User.signup({ email, username, password, firstName, lastName});
    await setTokenCookie(res, user);
    const { token } = req.cookies;


    return res.json({
        ...user.toSafeObject(),
        token
    });
});

module.exports = router;
