const express = require('express');
const { requireAuth } = require('../utils/auth');
const { Group, Member, User, Image, sequelize } = require('../db/models');


const router = express.Router();

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
