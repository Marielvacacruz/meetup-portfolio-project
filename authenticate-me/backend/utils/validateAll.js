const { check } = require('express-validator');
const { handleValidationErrors } = require('./validation');

//Validate Venue
const validateVenue = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Street address is required"),
  check("city")
    .exists({ checkFalsy: true })
    .withMessage("City is required"),
  check("state")
    .exists({ checkFalsy: true })
    .withMessage("State is required"),
  check("lat")
    .isDecimal({ min: -90.0, max: 90.0 })
    .withMessage("Latitude is not valid"),
  check("lng")
    .isDecimal({ min: -180.0, max: 180.0 })
    .withMessage("Longitude is not valid"),
  handleValidationErrors
];

// let startDate = new Date();

//Validate Events
const validateEvent = [
    check('venueId')
     .exists()
     .withMessage('Venue does not exist'),
    check('name')
      .exists({ checkFalsy: true })
      .withMessage('Name is required')
      .isLength({ min: 5 })
      .withMessage('Name must be at least 5 characters'),
    check('type')
      .exists({ checkFalsy: true })
      .withMessage('Must choose a type')
      .isIn(['Online', 'In person'])
      .withMessage('Type must be Online or In person'),
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
    check('endDate')
        .exists({ checkFalsy: true })
        .withMessage('End date is required'),
        // .isAfter(startDate.toDateString())
        // .withMessage("End date is less than start date"), <---  not working properly
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
      .isIn(['Online', 'In person'])
      .withMessage('Type must be Online or In person'),
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
module.exports = {validateEvent, validateGroup, validateVenue}
