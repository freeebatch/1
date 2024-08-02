import createError from 'http-errors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();
import fetch from 'node-fetch';

import indexRouter from './routes/index.js';
import './models/connectDB.js'
var app = express();

// view engine setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

let counter = 0;

// async function callURL() {
//   try {
//       const url = "https://studywithme.onrender.com/";
//       const response = await fetch(url);
//       if (response.ok) {
//           console.log("Server Refreshed");
//       } else {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//       }
//   } catch (error) {
//       console.error("Error:", error.message);
//   }
// }

app.use(cors());
const port = process.env.PORT || 3000

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);

  // callURL();
  // if(counter<10){
  //   setInterval(callURL, 5 * 60 * 1000);
  // }
});

export default app;
