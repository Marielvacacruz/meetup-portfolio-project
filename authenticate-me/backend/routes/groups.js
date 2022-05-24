const express = require('express');
const { requireAuth } = require('../utils/auth');
const { Group, Member, User } = require('../db/models');


const router = express.Router();

//Get all Groups
router.get('/', async (req, res) => {
    const groups = await Group.findAll({
        include: [
            {
                model: User
            }
         ]
    });
    res.json({
        groups,
    });
});
//still need to figure out how to include
//numMembers and previewImage * aggregate data?






module.exports = router;
