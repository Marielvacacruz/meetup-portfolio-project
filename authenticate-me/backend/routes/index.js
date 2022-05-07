const express = require('express');
const router = express.Router();


router.get('/hello/world', function(req, res) {
    res.cookie('XSRF-TOKEN', req.csrfToken());
    req.send('Hello World!');
});
module.exports = router;
