const express = require('express');
const { requireAuth } = require('../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../utils/validation');
const { Group, Member, User, Image, sequelize } = require('../db/models');


const router = express.Router();

//middleware to validate new Group
const validateGroup = [
    check('name')
      .exists({ checkFalsy: true })
      .withMessage('Name is required')
      .isLength({ max: 60 })
      .withMessage('Name must be 60 characters or less.'),
    check('about')
      .exists({ checkFalsy: true })
      .withMessage('About is required')
      .isLength({ min: 50 })
      .withMessage('About must be 50 characters or more'),
    check('type')
      .exists({ checkFalsy: true })
      .withMessage('Must choose a type')
      .isIn(['Online', 'In-person'])
      .withMessage('Type must be Online or In-person'),
    check('private')
        .exists({checkFalsy: true })
        .withMessage('Must select')
        .isBoolean()
        .withMessage('Must choose option'),
    check('city')
        .exists({ checkFalsy: true })
        .withMessage('City is required'),
    check('state')
        .exists({ checkFalsy: true })
        .withMessage('State is required'),
    handleValidationErrors
];

//Get Details of a Group from an id
router.get('/:groupId', async(req, res) => {
    let { groupId } = req.params;
    groupId = parseInt(groupId);

    const images = await Image.findAll({
        where: {groupId},
        attributes: ['url']
    })

    const currentGroup = await Group.findByPk( groupId, {
        include: [
            {
                model: Image,
                attributes: []
            },
            {
                model: Member,
                attributes: []
            },
            {
                model:User, as:'Organizer'
            }

            ],
            attributes: {
                include: [
                    [sequelize.fn("COUNT", sequelize.col("Members.id")), "numMembers"],
                ]
            }
        }

    );
        console.log(currentGroup)
    if(currentGroup.id === null){
        let err = new Error('Group Could not be found');
        err.status = 404
        throw err;
    }
    const imageurls = images.map(image => image.url);
    const response = {...currentGroup.toJSON(), images: imageurls}

    res.json(
        response
    );

});



//Get all Groups
router.get("/", async (req, res) => {
    const groups = await Group.findAll({
      include: [
        {
          model: Member,
          attributes: []

        },
        {
            model: Image,
            attributes: []
        }
      ],
      attributes:{

     include:  [
          [sequelize.fn("COUNT", sequelize.col("Members.id")), "numMembers"],
          [sequelize.col('Images.url'), 'previewImage']
        ]
    },
      group: ["Group.id"]
    });
    res.json({
      groups,
    });
  });


//Create a new Group
router.post('/', requireAuth, validateGroup, async (req, res) => {
    const { name, about, type, private, city, state }= req.body;
    const { user } = req; //grab user information

  const newGroup = await Group.create({
      organizerId: user.id,
      name,
      about,
      type,
      private,
      city,
      state
  });

  return res.json(
      newGroup
  );

});

//Edit a Group

router.put('/:groupId', requireAuth, validateGroup, async(req, res) => {
    const { user } = req;
    let { groupId } = req.params;
        groupId = parseInt(groupId);
    const { name, about, type, private, city, state } = req.body;

    const group = await Group.findByPk(groupId)

    if(!group){
        res.status(404);
        return res.json({
            message: 'Group could not be found',
            statusCode: 404
        });
    }

     if(user.id !== group.organizerId){
        res.status(403);
        return res.json({
            message: 'Current User must be the Organizer to edit Group',
            statusCode: 403
        });
     };

     await group.update({
         name,
         about,
         type,
         private,
         city,
         state
     });

     res.json(group);

});





module.exports = router;
