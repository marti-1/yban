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

const User = require('./db/user');

// load routes
const authRouter = require('./routes/auth');
const homeRouter = require('./routes/home');
const propositionsRouter = require('./routes/propositions');
const argumentsRouter = require('./routes/arguments');
const usersRouter = require('./routes/users');


const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10 // 10 years
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
app.use(async (req, res, next) => {
  if (req.user) {
    res.locals.currentUser = await User.findById(req.user.id);
  } else {
    res.locals.currentUser = null;
  }
  res.locals.mdRender = viewHelpers.mdRender;
  res.locals.pluralize = viewHelpers.pluralizeHelper;
  res.locals.timeAgoInWords = viewHelpers.timeAgoInWordsHelper;
  res.locals.errorClass = viewHelpers.errorClass;
  res.locals.errorMessage = viewHelpers.errorMessage;
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const port = 3000

app.use('/', authRouter);
app.use('/', homeRouter);

app.use('/propositions', argumentsRouter);
app.use('/propositions', propositionsRouter);
app.use('/', usersRouter);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})