const {express} = require('express');
const cors = require('cors');

//server setup

app.use(cors({
    origin: [] //origin property will list origins or domains that server
    //will allow requests from
}));
