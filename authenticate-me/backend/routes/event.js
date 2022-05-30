const express = require('express');
const { requireAuth, restoreUser } = require('../utils/auth');
const {validateEvent} = require('../utils/validateAll');
const { Event, Group, Member, Image, Attendee, Venue, sequelize} = require('../db/models');



const router = express.Router();

//Edit an Event specified by its id (test this route once merged)
router.put('/:eventId', requireAuth, validateEvent, async(req, res) => {
    const { user } = req;

    let { eventId } = req.params;
        eventId = parseInt(eventId);

        const {
            venueId,
            name,
            type,
            capacity,
            price,
            description,
            startDate,
            endDate
        } = req.body;

        const venue = await Venue.findByPk(venueId);
        if(!venue){
            res.status(404);
            return res.json({
                message: 'Venue could not be found',
                statusCode: 404
            });
        };

        const event = await Event.findByPk(eventId, {
            include: [
                {
                    model: Group,
                    include: [
                        {
                            model: Member,
                            where: {
                                userId: user.id
                            }
                        }
                    ]
                }
            ]
        });

        if(!event){
            res.status(404);
            return res.json({
                message: 'Event could not be found',
                statusCode: 404
            });
        };


        if(user.id === event.Group.organizerId || event.Group.Members[0].status === 'co-host'){
          await event.update({
            venueId,
            name,
            type,
            capacity,
            price,
            description,
            startDate,
            endDate
            });
            return res.json(
                event
            );
        };
});

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
        }; 

        const response = {...event.toJSON(), images: imageurls}

    return res.json(
        response
    )

});



// //Get all events
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

//Delete an Event specified by it's id
router.delete('/:eventId',requireAuth, async(req, res) => {
    const { user } = req;
    const { eventId } = req.params;

    const  event = await Event.findByPk(eventId);

    if(!event){
        res.status(404);
            return res.json({
            message: 'Event could not be found',
            statusCode: 404
            });
    };

   const group = await Group.findByPk(event.groupId, {
        where: {organizerId: user.id}
   });

   if(group){
       await event.destroy();
       return res.json({
           message: 'Successfully deleted',
           statusCode: 200
       });
   }else{
       res.status(403);
       return res.json({
           message: 'Unauthorized',
           statusCode: 403
       })
   }




});

module.exports = router;
