const express = require('express');
const { requireAuth, restoreUser } = require('../utils/auth');
const {validateEvent} = require('../utils/validateAll');
const { Event, Group, Member, Image, Attendee, Venue, User, sequelize} = require('../db/models');




const router = express.Router();

//Get All Attendees of an Event specified by its id
router.get('/:eventId/attendees', restoreUser, async(req, res) => {
    const { user } = req;
    let { eventId } = req.params;
        eventId = parseInt(eventId);

        const events = await Event.findByPk(eventId);

        if(!events){
            res.status(404);
            return res.json({
                message: 'Event Could Not Be Found',
                statusCode: 404
            });
        };

        const group = await Group.findByPk(events.groupId, {
            include: [
                {
                    model: Member,
                    where: { userId: user.id}
                }
            ]
        });

        if(user.id === group.organizerId || group.Member.status === 'co-host'){
             const attendees = await Event.findByPk(eventId,{
                include:
                    {
                        model: User,
                        attributes: ['id', 'firstName', 'lastName', 'firstName' ],
                        through: {attributes: ['status']}
                    },
                attributes: []

            });

            return res.json({Attendees: attendees.Users });
         } else {
                      const attendees = await Attendee.findAll({
                        where: {
                          eventId: events.id,
                          status: ["member", "waitlist"]
                        }
                      });
                      res.json({ Attendees: attendees });
                    }

});

//Request to Attend and Event based on Event's id

// router.post("/:eventId/attendees", requireAuth, async (req, res) => {
//     let { eventId } = req.params;
//     eventId = parseInt(eventId);
//     const { user } = req;
//     const event = await Event.findByPk(eventId);


//     if (!event) {
//       const error = new Error("Event not found");
//       error.status = 404;
//       throw error;
//     }

//     const pendingStatus = await Attendee.findOne({
//       where: {
//         eventId,
//         userId: user.id,
//         status: "pending"
//       }
//     });

//     if (pendingStatus) {
//       const error = new Error("Attendance has already been requested");
//       error.status = 400;
//       throw error;
//     }

//     const statusAccepted = await Attendee.findOne({
//       where: {
//         eventId,
//         userId: user.id,
//         status: "member"
//       }
//     });

//     if (statusAccepted) {
//       const error = new Error("User is already an attendee of the event");
//       error.status = 400;
//       throw error;
//     }
//     const group = await Group.findByPk(event.groupId, {
//       include: [{ model: Member, where: { userId: user.id } }]
//     });
//     const member = group.Member;

//     if (member.status === "member" || member.status === "co-host") {
//       const attendance = await Attendee.create({
//         eventId,
//         userId: user.id,
//         status: "pending"
//       });
//       eventId = attendance.eventId;
//       let userId = attendance.userId;
//       let status = attendance.status;
//       return res.json({ eventId, userId, status });
//     }
//   });
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

        const attendee = await Event.findByPk(eventId, {
            include:
                {
                    model: Attendee,
                    where: {userId: user.id},
                }

        });

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
        };

        const member = await Group.findByPk(event.groupId, {
            include: [{ model: Member, where: { userId: user.id } }]
          });

        if(member){
            const attendance = await Attendee.create({
                eventId: event.id,
                userId: user.id,
                status: 'pending'
            });
            return res.json(attendance);
        }


});

//Change status of an ATTENDANCE to an event by its id
router.put('/:eventId/attendees', requireAuth, async(req, res) =>{
    const { user } = req;
  const { eventId } = req.params;
  const { userId, status } = req.body;

  const event = await Event.findByPk(eventId);

  if (!event) {
    const err = new Error("Event couldn't be found");
    err.status = 404;
    err.message = "Event couldn't be found";
    throw err;
  }

  const membership = await Member.findOne({
    where: {
      userId: user.id,
      groupId: event.groupId
    }
  });

  if (!membership) {
    const err = new Error("Unauthorized");
    err.message = "Unauthorized";
    err.status = 403;
    throw err;
  }

  if (membership.status === "host" || membership.status === "co-host") {
    const attendance = await Attendee.findOne({ where: { userId: userId, eventId } });

    if (!attendance) {
      const err = new Error(
        "Attendance between the user and the event does not exist"
      );
      err.status = 404;
      err.message = "Attendance between the user and the event does not exist";
      throw err;
    }

    if (status === "pending") {
      const err = new Error("Cannot change an attendance status to pending");
      err.status = 400;
      err.message = "Cannot change an attendance status to pending";
      throw err;
    }

    await attendance.update({
      userId,
      status
    });

    const newAttendance = await Attendee.findOne({
      where: {
        userId,
        eventId
      },
      attributes: ["id", "eventId", "userId", "status"]
    });

    res.json(newAttendance);
  } else {
    const err = new Error(
      "Member must be host or co-host to update attendance"
    );
    err.status = 403;
    err.message = "Member must be host or co-host to update attendance";
    throw err;
  }
});

//Delete ATTENDANCE by its id
router.delete('/:eventId/attendees', requireAuth, async(req, res) => {
    const { user } = req;

    let { eventId, attendeeId } = req.params;
        eventId = parseInt(eventId);
        attendeeId = parseInt(attendeeId);

    const event = await Event.findByPk(eventId, {
        include: [
            {
                model: Group
            }
        ]
    });

    if(!event){
        res.status(404);
        return res.json({
            message: 'Event Could Not Be Found',
            statusCode: 404
        });
    };

    const attendance = await Attendee.findOne({
        where: {
            userId: user.id,
            eventId
        }
    });

    if(!attendance){

        res.status(403);
        return res.json({
            message: 'Forbidden',
            statusCode: 403
        });
    }

    if(user.id === event.Group.organizerId || attendance.userId === user.id){
        await attendance.destroy()
        return res.json({
            message: 'Successfully deleted attendance from event'
        });
     }

});

//Edit an Event specified by its id
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

//Add an Image to an Event based on group id
router.post('/:eventId/images', requireAuth, async(req, res) => {
  const { user } = req;
  let { eventId } = req.params;
    eventId = parseInt(eventId);
  const { url } = req.body;

  const event = await Event.findByPk(eventId);

  if(!event){
    res.status(404);
    return res.json({
      message: 'Event could not be found',
      statusCode: 404
    });
  };

  const attendee = Attendee.findByPk(user.id, {
      where: {eventId: eventId}
  });

  if(!attendee){
    res.status(403);
    return res.json({
      message: 'User not authorized',
      statusCode: 403
    });
  };

  const newImage = await Image.create({
    eventId: eventId,
    imageableType: 'Event',
    url
  });

  return res.json({
    newImage
  })
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
