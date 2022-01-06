const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');

const catchAsync = require('./utils/catchAsync');
const apiRouter = require('./routes/apiRoutes');


const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.json({ limit: '10kb' })); 
app.use(helmet())


const limiter = rateLimit({
    max: 100, 
    windowMs: 10000,  //10 sekund
    message: { status: 'error', message: 'Too many request from this IP, plese try again in an 10 minutes' } 
});
app.use('/', apiRouter);

app.all('*', catchAsync(async (req, res, next) => {
    res.status(404).json({ code: 404, status: 'error', message: `Can't find ${req.originalUrl}` });
}));



module.exports = app;
