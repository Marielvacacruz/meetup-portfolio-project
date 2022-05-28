const { check } = require('express-validator');
const { handleValidationErrors } = require('./validation');

//Validate Events
const validateEvent = [
    check('venueId')
      .exists({ checkFalsy: true })
      .withMessage('Venue does not exist'),
    check('name')
      .exists({ checkFalsy: true })
      .withMessage('Name is required')
      .isLength({ min: 5 })
      .withMessage('Name must be at least 5 characters'),
    check('type')
      .exists({ checkFalsy: true })
      .withMessage('Must choose a type')
      .isIn(['Online', 'In-Person'])
      .withMessage('Type must be Online or In-person'),
    check('capacity')
        .exists({checkFalsy: true })
        .withMessage('Must enter Capacity')
        .isInt()
        .withMessage('Capacity must be an Integer'),
    check('price')
        .exists()
        .withMessage('Must enter price')
        .isDecimal()
        .withMessage('Price is Invalid'),
    check('description')
        .exists({ checkFalsy: true })
        .withMessage('Description is required'),
    check('startDate')
        .isAfter()
        .withMessage('Start date must be in the future'),
    // check('endDate')
    //     //figure this out
    //     .withMessage('End date is less than start date'),
    handleValidationErrors
];

//middleware to validate new Group
const validateGroup = [
    check('name')
      .exists({ checkFalsy: true })
      .withMessage('Name is required')
      .isLength({ max: 60 })
      .withMessage('Name must be 60 characters or less.'),
    check('about')
      .exists({ checkFalsy: true })
      .withMessage('About is required')
      .isLength({ min: 50 })
      .withMessage('About must be 50 characters or more'),
    check('type')
      .exists({ checkFalsy: true })
      .withMessage('Must choose a type')
      .isIn(['Online', 'In-Person'])
      .withMessage('Type must be Online or In-person'),
    check('private')
        .exists({checkFalsy: true })
        .withMessage('Must select')
        .isBoolean()
        .withMessage('Must choose option'),
    check('city')
        .exists({ checkFalsy: true })
        .withMessage('City is required'),
    check('state')
        .exists({ checkFalsy: true })
        .withMessage('State is required'),
    handleValidationErrors
];
module.exports = {validateEvent, validateGroup}
