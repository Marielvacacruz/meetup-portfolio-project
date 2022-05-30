const express = require("express");
const { requireAuth, restoreUser } = require("../utils/auth");
const { validateEvent, validateGroup } = require("../utils/validateAll");
const {
  Group,
  Member,
  User,
  Image,
  sequelize,
  Event,
  Attendee,
  Venue,
} = require("../db/models");

const router = express.Router();

//Get all events of a group by id
router.get("/:groupId/events", async (req, res) => {
  let { groupId } = req.params;
  groupId = parseInt(groupId);

  const group = await Group.findByPk(groupId);

  if (!group) {
    res.status(404);
    return res.json({
      message: "Group could not be found",
      statusCode: 404,
    });
  }

  const Events = await Event.findAll({
    where: { groupId },
    include: [
      {
        model: Attendee,
        attributes: [],
      },
      {
        model: Image,
        attributes: [],
      },
      {
        model: Group,
        attributes: ["id", "name", "city", "state"],
      },
      {
        model: Venue,
        attributes: ["id", "city", "state"],
      },
    ],
    attributes: [
      "id",
      "venueId",
      "groupId",
      "name",
      "type",
      "startDate",
      [sequelize.fn("COUNT", sequelize.col("Attendees.id")), "numAttending"],
      [sequelize.col("Images.url"), "previewImage"],
    ],
    group: ["Event.id"],
  });

  return res.json({
    Events,
  });
});

//Create an event for a Group
router.post(
  "/:groupId/events",
  requireAuth,
  validateEvent,
  async (req, res) => {
    const { user } = req;

    let { groupId } = req.params;
    groupId = parseInt(groupId);

    const {
      venueId,
      name,
      type,
      capacity,
      price,
      description,
      startDate,
      endDate,
    } = req.body;

    const venue = await Venue.findByPk(venueId);
    if (!venue) {
      res.status(404);
      return res.json({
        message: "Venue could not be found",
        statusCode: 404,
      });
    }

    const group = await Group.findByPk(groupId);

    if (!group) {
      res.status(404);
      return res.json({
        message: "Group could not be found",
        statusCode: 404,
      });
    }

    const status = await Member.findOne({
      where: { userId: user.id, groupId },
    });

    if (user.id === group.organizerId || status.status === "co-host") {
      const event = await Event.create({
        groupId: groupId,
        venueId,
        name,
        type,
        capacity,
        price,
        description,
        startDate,
        endDate,
      });
      return res.json(event);
    }
  }
);

//Create Venue for Group (NEED VALIDATION)
router.post("/:groupId/venues", requireAuth, async (req, res) => {
  const { user } = req;
  const { address, city, state, lat, lng } = req.body;

  const { groupId } = req.params;

  const group = await Group.findByPk(groupId);

  if (!group) {
    res.status(404);
    return res.json({
      message: "Group could not be found",
      statusCode: 404,
    });
  }

  const member = await Member.findOne({
    where: { userId: user.id, groupId },
  });

  if (!member) {
    const err = new Error("membership not found");
    err.status(404);
    throw err;
  }

  if (user.id === group.organizerId || member.status === "co-host") {
    const venue = await Venue.create({
      groupId: groupId,
      address,
      city,
      state,
      lat,
      lng,
    });
    return res.json(venue);
  }
});

//Get all members of a Group Specified by it's Id
router.get("/:groupId/members", restoreUser, async (req, res) => {
  const { user } = req;
  let { groupId } = req.params;

  const Members = await Group.findByPk(groupId, {
    where: {
      organizerId: user.id,
    },
    attributes: [],
    include: {
      model: User,
      attributes: ["id", "firstName", "lastName"],
      through: { attributes: ["status"] },
    },
  });

  res.json(Members);
});

//Request membership for a Group based on the Group's id
router.post("/:groupId/members", requireAuth, restoreUser, async (req, res) => {
  const { user } = req;

  let { groupId } = req.params;
  groupId = parseInt(groupId);

  const group = await Group.findByPk(groupId, {
    include: [
      {
        model: Member,
      },
    ],
  });
  const member = await Member.findOne({
    where: {
      userId: user.id,
      groupId,
    },
  });

  if (!group) {
    res.status(404);
    return res.json({
      message: "Group could not be found",
      statusCode: 404,
    });
  }
  if (member) {
    if (member.status === "pending") {
      res.status(400);
      return res.json({
        message: "Membership has already been requested",
        statusCode: 400,
      });
    }

    if (member.status === "member") {
      res.status(400);
      return res.json({
        message: "User is already a member of the group",
        statusCode: 400,
      });
    }

    if (member.status === "host") {
      res.status(400);
      return res.json({
        message: "User is already a member of the group",
        statusCode: 400,
      });
    }
  } else {
    const reqMembership = await Member.create({
      userId: user.id,
      groupId,
      status: "pending",
    });

    const member = await Member.findOne({
      where: {
        userId: user.id,
        groupId,
      },
      attributes: [
        ["groupId", "groupId"],
        ["userId", "memberId"],
        ["status", "status"],
      ],
    });
    return res.json({
      member,
    });
  }
});

//Change status of membership for a group specified by Id
router.put("/:groupId/members", requireAuth, async (req, res, next) => {
  const { user } = req;
  const { groupId } = req.params;
  const { memberId, status } = req.body;

  const group = await Group.findByPk(groupId);
  const member = await Member.findOne({
    where: {
      userId: user.id,
      groupId,
    },
  });


  if (!group) {
    res.status(404);
    return res.json({
      message: "Group could not be found",
      statusCode: 404,
    });
  }
  if(status === 'pending'){
    res.status(404);
    return res.json({
        message: 'Cannot change a membership status to pending',
        statusCode: 400
    });
  };

  const membership = await Member.findOne({
    where: {
        userId: memberId,
        groupId
    }
});

if(!membership){
    res.status(404);
    return res.json({
        message: 'Membership between the user and the group does not exist',
        statusCode: 404
    });
};

  if (user.id !== group.organizerId) {
    if (status === "co-host") {
      const err = new Error(
        "Current User must be the organizer to add a co-host"
      );
      err.status = 403;
      err.message = "Current User must be the organizer to add a co-host";
      return next(err);
    }
  }

  if (member.status !== "host" && member.status !== "co-host") {
    const err = new Error(
      "Current User must be the organizer or a co-host to make someone a member"
    );
    err.status = 400;
    err.message =
      "Current User must be the organizer or a co-host to make someone a member";
    return next(err);
  };



  const updatedMember = await Member.findByPk(memberId);
  await updatedMember.update({ status });
  res.json(updatedMember);
});

//Delete Membership to a group specified by id
router.delete("/:groupId/members/:memberId", requireAuth, async (req, res) => {
  const { user } = req;

  let { groupId, memberId } = req.params;
  groupId = parseInt(groupId);

  const group = await Group.findByPk(groupId);

  if (!group) {
    const err = new Error("Group couldn't be found");
    err.status = 404;
    err.message = "Group couldn't be found";
    throw err;
  }

  const member = await Member.findOne({
    where: {
      userId: memberId,
      groupId,
    },
  });

  if (user.id === group.organizerId || user.id === member.userId) {
    await member.destroy();
    return res.json({
      message: "Successfully deleted membership from group",
    });
  } else {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
});

//Get Details of a Group from an id
router.get("/:groupId", async (req, res) => {
  let { groupId } = req.params;
  groupId = parseInt(groupId);

  const images = await Image.findAll({
    where: { groupId },
    attributes: ["url"],
  });

  const currentGroup = await Group.findByPk(groupId, {
    include: [
      {
        model: Image,
        attributes: [],
      },
      {
        model: Member,
        attributes: [],
      },
      {
        model: User,
        as: "Organizer",
      },
    ],
    attributes: {
      include: [
        [sequelize.fn("COUNT", sequelize.col("Members.id")), "numMembers"],
      ],
    },
  });

  if (currentGroup.id === null) {
    let err = new Error("Group Could not be found");
    err.status = 404;
    throw err;
  }
  const imageurls = images.map((image) => image.url);
  const response = { ...currentGroup.toJSON(), images: imageurls };

  res.json(response);
});

//Get all Groups
router.get("/", async (req, res) => {
  const Groups = await Group.findAll({
    include: [
      {
        model: Member,
        attributes: [],
      },
      {
        model: Image,
        attributes: [],
      },
    ],
    attributes: {
      include: [
        [sequelize.fn("COUNT", sequelize.col("Members.id")), "numMembers"],
        [sequelize.col("Images.url"), "previewImage"],
      ],
    },
    group: ["Group.id"],
  });
  res.json({
    Groups,
  });
});

//Create a new Group
router.post("/", requireAuth, validateGroup, async (req, res) => {
  const { name, about, type, private, city, state } = req.body;
  const { user } = req; //grab user information

  const newGroup = await Group.create({
    organizerId: user.id,
    name,
    about,
    type,
    private,
    city,
    state,
  });

  return res.json(newGroup);
});

//Edit a Group

router.put("/:groupId", requireAuth, validateGroup, async (req, res) => {
  const { user } = req;
  let { groupId } = req.params;
  groupId = parseInt(groupId);
  const { name, about, type, private, city, state } = req.body;

  const group = await Group.findByPk(groupId);

  if (!group) {
    res.status(404);
    return res.json({
      message: "Group could not be found",
      statusCode: 404,
    });
  }

  if (user.id !== group.organizerId) {
    res.status(403);
    return res.json({
      message: "Current User must be the Organizer to edit Group",
      statusCode: 403,
    });
  }

  await group.update({
    name,
    about,
    type,
    private,
    city,
    state,
  });

  res.json(group);
});

//Delete a Group
router.delete("/:groupId", requireAuth, async (req, res) => {
  const { user } = req;
  let { groupId } = req.params;
  groupId = parseInt(groupId);

  const group = await Group.findByPk(groupId);

  if (!group) {
    res.status(404);
    return res.json({
      message: "Group could not be found",
      statusCode: 404,
    });
  }

  if (user.id !== group.organizerId) {
    res.status(403);
    return res.json({
      message: "Current User must be the Organizer to delete Group",
      statusCode: 403,
    });
  }

  await group.destroy();

  return res.json({
    message: "Successfully Deleted",
    statusCode: 200,
  });
});

module.exports = router;
