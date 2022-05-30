const express = require('express');
const router = express.Router();
const loginRouter = require('./login');
const usersRouter = require('./users');
const signupRouter = require('./signup');
const groupsRouter = require('./groups');
const eventRouter = require('./event');
const venueRouter = require('./venues');

router.use('/login', loginRouter);
router.use('/users', usersRouter);
router.use('/signup', signupRouter);
router.use('/groups', groupsRouter);
router.use('/events', eventRouter);
router.use('/venues', venueRouter);



//test route
router.post('/test', (req, res) => {
    res.json({ requestBody: req.body });
});


//test route
// router.get('/hello/world', function(req, res) {
//     res.cookie('XSRF-TOKEN', req.csrfToken());
//     res.send('Hello World!');
// });

//setting cookie on the response with name XSRF-Token
router.get("/api/csrf/restore", (req, res) => {
    const csrfToken = req.csrfToken();
    res.cookie("XSRF-TOKEN", csrfToken);
    res.status(200).json({
        'XSRF-Token': csrfToken
    });
});




module.exports = router;
