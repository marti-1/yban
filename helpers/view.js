var pluralize = require('pluralize');
const md = require('markdown-it')()
            .use(require('markdown-it-footnote'));
var { timeAgoInWords } = require('@bluemarblepayroll/time-ago-in-words');

const mdRender = (markdown) => {
  return md.render(markdown);
};

const pluralizeHelper = (word, count) => {
  return pluralize(word, count);
};

const timeAgoInWordsHelper = (date) => {
  return timeAgoInWords(date);
};

const errorClass = (errors, field) => {
  if (!errors) { return '' }

  if (errors.filter((x) => x.path == field).length > 0) {
    return 'is-invalid';
  } else {
    return '';
  }
};

const errorMessage = (errors, field) => {
  if (!errors) { return '' }

  const error = errors.filter((x) => x.path == field);
  if (error.length > 0) {
    return `<div class="invalid-feedback">${error[0].msg}</div>`;
  } else {
    return '';
  }
};

module.exports = {
  mdRender,
  pluralizeHelper,
  timeAgoInWordsHelper,
  errorClass,
  errorMessage
};