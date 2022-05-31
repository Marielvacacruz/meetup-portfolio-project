const express = require('express');
const { requireAuth, restoreUser } = require('../utils/auth');
const {validateEvent} = require('../utils/validateAll');
const { Event, Group, Member, Image, Attendee, Venue, User, sequelize} = require('../db/models');




const router = express.Router();

 //Get All Attendees of an Event specified by its id

 router.get("/:eventId/attendees", restoreUser, async (req, res, next) => {
    const { user } = req;
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId);
    const member = await Member.findOne({
      where: {
        userId: user.id,
        groupId: event.groupId
      }
    });

    if (!event) {
      const err = new Error("Event couldn't be found");
      err.status = 404;
      err.message = "Event couldn't be found";
      return next(err);
    }

    if (!member) {
      const err = new Error("Membership not found");
      err.message = "Membership not found";
      err.status = 404;
      return next(err);
    }

    if (member.status === "host" || member.status === "co-host") {

      const user = await User.findAll({
        include: {
          model: Attendee,
          as: 'Attendance',
          where: {
            eventId,
          },
          attributes: ['status']
        }
      })
      res.json({ Attendees: user });

    } else {
      const attendees = await Attendee.findAll({
        where: {
          eventId: event.id,
          status: ["member", "waitlist"]
        }
      });
      res.json({ Attendees: attendees });
    }
  });

// router.get('/:eventId/attendees', restoreUser, async(req, res) => {
//     const { user } = req;
//     let { eventId } = req.params;
//         eventId = parseInt(eventId);

//         const events = await Event.findByPk(eventId);

//         if(!events){
//             res.status(404);
//             return res.json({
//                 message: 'Event Could Not Be Found',
//                 statusCode: 404
//             });
//         };

//         const group = await Group.findByPk(events.groupId, {
//             include: [
//                 {
//                     model: Member,
//                     where: { userId: user.id}
//                 }
//             ]
//         });

//         if(user.id === group.organizerId || group.Member.status === 'co-host'){
//              const attendees = await Event.findByPk(eventId,{
//                 include:
//                     {
//                         model: User,
//                         attributes: ['id', 'firstName', 'lastName', 'firstName' ],
//                         through: {attributes: ['status']}
//                     },
//                 attributes: []

//             });



//             return res.json(attendees);
//          }
//          //else{
//         // }

// });

//Request to Attend and Event based on Event's id
router.post('/:eventId/attendees', requireAuth, async(req,  res) => {
    const { user } = req;

    let { eventId } = req.params;
        eventId = parseInt(eventId);

        const event = await Event.findByPk(eventId);

        if(!event){
            res.status(404);
            return res.json({
                message: 'Event Could Not Be Found',
                statusCode: 404
            });
        };

        const attendee = await Event.findOne({where: {userId:user.id, eventId}})

        if(attendee){
            if(attendee.status  === 'pending'){
                res.status(400);
                return res.json({
                    message: 'Attendance has already been requested',
                    statusCode: 400
                });
            };

            if(attendee.status === 'attending'){
                res.status(400);
                return res.json({
                     message: "User is already an attendee of the event",
                    statusCode: 400
                });
            };

            const member = await Group.findByPk(event.groupId, {
                include: [{ model: Member, where: { userId: user.id } }]
              });

            if(member){
                const attendance = await Attendee.create({
                    eventId,
                    userId: user.id,
                    status: 'pending'
                });

            }
            return res.json(attendance);

        };




});

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
