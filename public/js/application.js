// on page load
$(() => {
  $('.copy-text').click(function(e) {
    // get the value from this.data('clipboard-text')
    var text = $(this).data('clipboard-text');

    navigator.clipboard.writeText(text).then(function() {
      let tooltip = new bootstrap.Tooltip(e.target, {'title': 'Copied!', 'trigger': 'manual'});
      tooltip.show();
      setTimeout(function() {
        tooltip.hide();
      }, 1000);
    });
    e.preventDefault();
  });
})