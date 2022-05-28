const express =  require('express');
const { setTokenCookie, restoreUser, requireAuth } = require('../utils/auth');
const { User, Group, Member, Image, sequelize} = require('../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../utils/validation');

const router = express.Router();

// //middleware to validate sign up
// const validateSignup = [
//     check('email')
//       .exists({ checkFalsy: true })
//       .isEmail()
//       .withMessage('Please provide a valid email.'),
//     check('username')
//       .exists({ checkFalsy: true })
//       .isLength({ min: 4 })
//       .withMessage('Please provide a username with at least 4 characters.'),
//     check('username')
//       .not()
//       .isEmail()
//       .withMessage('Username cannot be an email.'),
//     check('password')
//       .exists({ checkFalsy: true })
//       .isLength({ min: 6 })
//       .withMessage('Password must be 6 characters or more.'),
//     handleValidationErrors
//   ];

// //Sign up
// router.post('/signup', validateSignup, async (req, res) => {
//     const { email, password, username } = req.body;

//     const user = await User.signup({ email, username, password });
//     await setTokenCookie(res, user);


//     return res.json({
//         user
//     });
// });

//Get Current User
router.get('/current', restoreUser, (req, res) => {
  const { user } = req;

  if(user){
      return res.json({
          user: user.toSafeObject()
      });
  } else return res.json({});
});

//Get all Groups Joined or Organized by Current User
router.get('/current/groups', requireAuth, async (req, res) => {
  const { user } = req;

  const Groups = await Group.findAll({
    where:{
     organizerId: user.id
  },
  include: [
    {
      model: Member,
      attributes: [],
      // where: {userId: user.id}
    },
    {
      model: Image,
      attributes: []
  }
  ],
  attributes: [
    'id',
    'organizerId',
    "name",
    "about",
    "type",
    "private",
    "city",
    "state",
    "createdAt",
    "updatedAt",
    [sequelize.fn("COUNT", sequelize.col("Members.id")), "numMembers"], //numMembers count is wrong
    [sequelize.col('Images.url'), 'previewImage']
  ],
group: ["Group.id"]
});

  return res.json({
    Groups
  })
});

module.exports =  router;
