// ==UserScript==
// @name         Timeline - WORK
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.google.sk/maps/timeline*
// @match        https://www.google.com/maps/timeline*
// @require http://code.jquery.com/jquery-1.12.4.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.js
// @require https://raw.githubusercontent.com/jsmreese/moment-duration-format/master/lib/moment-duration-format.js
// @require https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.10/lodash.min.js
// @grant        none
// ==/UserScript==

/* global jQuery, moment, _ */

(function run() {
  function recalculateHours() {
    const workLines = jQuery('.place-history-moment-content')
      .toArray()
      .filter(
        line =>
          jQuery(line)
            .find('.place-visit-title')
            .text()
            .startsWith('Work')
      );
    const datePairs = workLines.map(
      line =>
        jQuery(line)
          .find('.segment-duration-part')
          .toArray()
          .map(span => jQuery(span).text())
    );
    const dateDiffs = datePairs.map(
      dates =>
        moment(dates[1], 'HH:mm a')
          .diff(moment(dates[0], 'HH:mm a'))
    );
    const sum = dateDiffs.reduce((a, b) => a + b, 0);

    let formattedSum = '-';
    if (sum > 0) {
      formattedSum = moment.duration(sum).format('HH:mm');
    }

    console.log('WORK HOURS:', formattedSum, sum);
    if (!jQuery('.my-work-hours-report').length) {
      jQuery('<div>')
        .addClass('my-work-hours-report')
        .insertAfter(jQuery('.timeline-subtitle'));
    }
    jQuery('.my-work-hours-report')
      .text(` (Work: ${formattedSum} )`);
  }

  jQuery('*').click(_.debounce(recalculateHours));
  recalculateHours();
}());
