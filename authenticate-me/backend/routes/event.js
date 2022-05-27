const express = require('express');
const { requireAuth, restoreUser } = require('../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../utils/validation');
const { Event, Group, Member, Image, Attendee, Venue, sequelize} = require('../db/models');



const router = express.Router();

//Get details of event by it's id
router.get('/:eventId', async(req, res) => {
    let { eventId } = req.params;
        eventId = parseInt(eventId);

        const images = await Image.findAll({
            where: {eventId},
            attributes: ['url']
        });
        const imageurls = images.map(image => image.url);


        const event = await Event.findByPk(eventId, {
            include: [
                {
                    model: Attendee,
                    attributes: []
                },
                {
                    model: Group,
                    attributes: ['id', 'name', 'private', 'city', 'state']
                },
                {
                    model: Venue,
                    attributes: ['id','address', 'city', 'state', 'lat', 'lng']
                },
                {
                    model: Image,
                    attributes: []
                }
            ],
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
                include: [
                    [sequelize.fn("COUNT", sequelize.col("Attendees.id")), "numAttending"],
                ]
            },
        });

        if(!event || !event.id){
            res.status(404);
            return res.json({
            message: 'Event could not be found',
            statusCode: 404
            });
        }; //error won't be thrown (sends object with null values due to sequelize)

        const response = {...event.toJSON(), images: imageurls}

    return res.json(
        response
    )

});


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
