const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const routes = require('./routes');

const { environment } = require('./config');
const isProduction = environment === 'production';

//initialize the app
const app = express();

//logging
app.use(morgan('dev'));

//parsing
app.use(cookieParser());
app.use(express.json());

//Security Middleware

if (!isProduction) {
    //enable cors only in development
    app.use(cors({
        origin: [] //origin property will list origins or domains that server
        //will allow requests from
    }));
}

//helmet helps set a variety of headers
app.use(
    helmet.crossOriginResourcePolicy({
        policy: "cross-origin"
    })
);

//set _csrf token and create req.csrfToken method
app.use(
    csurf({
        cookie: {
            secure: isProduction,
            sameSite: isProduction && "Lax",
            httpOnly: true
        }
    })
);

app.use(routes); //connects all the routes

module.exports = app;
