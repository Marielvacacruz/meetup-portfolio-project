const express = require("express");
const router = express.Router();
const {
  User,
  Group,
  Member,
  Image,
  Venue,
  sequelize
} = require("../db/models");
const { requireAuth } = require("../utils/auth");
const { validateVenue } = require("../utils/validateAll");

//Edit a venue specified by ID
router.put("/:venuesId", requireAuth, validateVenue, async (req, res, next) => {
  const { user } = req;
  const { venuesId } = req.params;
  const { address, city, state, lat, lng } = req.body;

  const venue = await Venue.findByPk(venuesId);
  if (!venue) {
    const err = new Error("Venue couldn't be found");
    err.status = 404;
    err.message = "Venue couldn't be found";
    return next(err);
  }

  const groupId = venue.groupId;

  const membership = await Member.findOne({
    where: {
      userId: user.id,
      groupId
    }
  });

  if (!membership) {
    const err = new Error("Membership not found");
    err.message = "Membership not found";
    err.status = 404;
    return next(err);
  }

  if (membership.status === "host" || membership.status === "co-host") {
    const updatedVenue = await venue.update({
      address,
      city,
      state,
      lat,
      lng
    });
    const newVenue = await Venue.findOne({
      attributes: ["id", "groupId", "address", "city", "state", "lat", "lng"]
    });
    res.json(newVenue);
  } else {
    const err = new Error("Unauthorized");
    err.status = 403;
    err.message = "Unauthorized";
    return next(err);
  }
});

module.exports = router;
