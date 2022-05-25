const express = require('express');
const { requireAuth } = require('../utils/auth');
const { Group, Member, User, Image, sequelize } = require('../db/models');


const router = express.Router();

//Get Details of a Group from an id
router.get('/:groupId', async(req, res) => {
    const { groupId } = req.params;

    const currentGroup = await Group.findByPk(groupId, {
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
                model:User //can't figure out how to alias as 'Organizer'
            }

            ],
            attributes: {
                include: [
                    [sequelize.fn("COUNT", sequelize.col("Members.id")), "numMembers"],
                    [sequelize.col('Images.url'), 'images'] //forcing this format
                ]
            }
        }

    );

    if(!currentGroup){
        let err = new Error('Group Could not be found');
        err.status = 404
        throw err;
    }

    res.json({
        currentGroup
    });

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
      attributes:

        [
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
          [sequelize.fn("COUNT", sequelize.col("Members.id")), "numMembers"],
          [sequelize.col('Images.url'), 'previewImage']
        ],
      group: ["Group.id"]
    });
    res.json({
      groups,
    });
  });






module.exports = router;
