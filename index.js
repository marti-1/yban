const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
var passport = require('passport');
const pool = require('./db/connection');
const md = require('markdown-it')()
            .use(require('markdown-it-footnote'));
// const md = new MarkdownIt();
var pluralize = require('pluralize');
var { timeAgoInWords } = require('@bluemarblepayroll/time-ago-in-words');
var flash = require('connect-flash');

// load routes
var authRouter = require('./routes/auth');
var homeRouter = require('./routes/home');
var propositionsRouter = require('./routes/propositions');

const app = express();
app.use(flash());
app.use(express.json());                            // for application/json
app.use(express.urlencoded({extended:true}));       // for application/x-www-form-urlencoded
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
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
  res.locals.currentUser = req.user;
  // Define the markdown rendering helper
  res.locals.mdRender = (markdown) => {
    return md.render(markdown);
  };
  // Define the pluralize helper
  res.locals.pluralize = (word, count) => {
    return pluralize(word, count);
  };
  // Define the timeAgoInWords helper
  res.locals.timeAgoInWords = (date) => {
    return timeAgoInWords(date);
  };

  res.locals.errorClass = (errors, field) => {
    if (!errors) { return '' }

    if (errors.filter((x) => x.path == field).length > 0) {
      return 'is-invalid';
    } else {
      return '';
    }
  }

  res.locals.errorMessage = (errors, field) => {
    if (!errors) { return '' }

    const error = errors.filter((x) => x.path == field);
    if (error.length > 0) {
      return `<div class="invalid-feedback">${error[0].msg}</div>`;
    } else {
      return '';
    }
  }

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