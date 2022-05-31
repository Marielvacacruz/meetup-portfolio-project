const express = require("express");
const router = express.Router();
const { Group, Member, Image, Event } = require("../db/models");
const { requireAuth } = require("../utils/auth");

//Delete image
router.delete('/:imageId', requireAuth, async (req, res, next) => {
    const { user } = req;
    const { imageId } = req.params;

    const image = await Image.findByPk(imageId)

    if (!image) {
        res.status(404);
        return res.json({
            message: 'Image could not be found',
            statusCode: 404
        });
    };


    if (image.imageableType === 'Group') {
        const group = await Group.findByPk(image.groupId)
        if (group.organizerId === user.id) {
            await image.destroy()
            res.json({
                message: "Successfully deleted",
                statusCode: res.statusCode
            })
        } else {
            res.status(403);
            return res.json({
                message: 'Forbidden',
                statusCode: 403
            });
        }
    };

    if (image.imageableType === 'Event') {
        const event = await Event.findByPk(image.eventId)
        const group = await Group.findByPk(event.groupId)

        if (group.organizerId === user.id) {
            await image.destroy()
            res.json({
                message: "Successfully deleted",
                statusCode: res.statusCode
            })
        } else {
            res.status(403);
            return res.json({
                message: 'Forbidden',
                statusCode: 403
            });
        }
    }
})



module.exports = router
