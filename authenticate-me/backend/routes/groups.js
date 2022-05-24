const express = require('express');
const { requireAuth } = require('../utils/auth');
const { Group, Member, User, Image, sequelize } = require('../db/models');


const router = express.Router();

//Get all Groups
router.get('/', async (req, res) => {
    const groups = await Group.findAll({
        include: [
            {
                model: Member,
                attributes: [ ]
            },
         ],
         attributes: {
             include: [
                 [
                    sequelize.fn('COUNT', sequelize.col('Members.groupId')), 'numMembers'
             ]
            ]
         }
    });
    res.json({
        groups
    });
});
//still need to figure out how to include
//numMembers and previewImage * aggregate data?






module.exports = router;
