const express = require('express');
const { requireAuth, restoreUser } = require('../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../utils/validation');
const { Event, Group, Member, Image, Attendee, Venue, sequelize} = require('../db/models');



const router = express.Router();

//Get all events
router.get('/', async(req, res) => {

    const Events = await Event.findAll({
        include: [
            {
                model: Attendee,
                attributes: []
            },
            {
                model: Image,
                attributes: []
            },
            {
                model: Group,
                attributes: ['id', 'name', 'city', 'state']
            },
            {
                model: Venue,
                attributes: ['id', 'city', 'state']
            }
        ],
        attributes:[
            'id',
            'venueId',
            'groupId',
            'name',
            'type',
            'startDate',
             [sequelize.fn("COUNT", sequelize.col("Attendees.id")), "numAttending"],
             [sequelize.col('Images.url'), 'previewImage']

            ],
        group: ['Event.id']
    });

    return res.json({
        Events
    });
});

module.exports = router;
