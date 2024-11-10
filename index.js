require('dotenv-safe').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
var passport = require('passport');
const pool = require('./db/connection');
const methodOverride = require('method-override');

const flashMessages = require('./middleware/flashMessages');
const viewHelpers = require('./helpers/view');

// load routes
const authRouter = require('./routes/auth');
const homeRouter = require('./routes/home');
const propositionsRouter = require('./routes/propositions');


const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
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
// add flash messages middleware
app.use(flashMessages);

app.use(methodOverride('_method'));
app.use(express.json());                            // for application/json
app.use(express.urlencoded({extended:true}));       // for application/x-www-form-urlencoded
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to set user in res.locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.mdRender = viewHelpers.mdRender;
  res.locals.pluralize = viewHelpers.pluralizeHelper;
  res.locals.timeAgoInWords = viewHelpers.timeAgoInWordsHelper;
  res.locals.errorClass = viewHelpers.errorClass;
  res.locals.errorMessage = viewHelpers.errorMessage;
  next();
});

// app.use(express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')))  
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const port = 3000

app.use('/', authRouter);
app.use('/', homeRouter);
app.use('/propositions', propositionsRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})