const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { environment } = require('./config');

const isProduction = environment === 'production';

const app = express();
app.use(morgan('dev'));
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
