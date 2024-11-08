const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
var passport = require('passport');
const pool = require('./db/connection');

// load routes
var authRouter = require('./routes/auth');

const app = express();
app.use(express.json());             // for application/json
app.use(express.urlencoded({extended:true}));       // for application/x-www-form-urlencoded
app.use(session({
  secret: 'godel, escher, bach',
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: new pgSession({
    pool: pool,                // Connection pool
    tableName: 'session'       // Use another table-name than the default "session" one
  }),
}));
app.use(passport.authenticate('session'));
// Middleware to set user in res.locals
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// app.use(express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')))  
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const port = 3000

app.use('/', authRouter);

app.get('/', (req, res) => {
  // render json with the user object
  res.render('index');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})