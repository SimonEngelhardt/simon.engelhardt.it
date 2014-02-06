$(document).foundation();

// Override LinkedIn plugin icon style (see also CSS)
IN.Event.on(IN, 'systemReady', function() {
    $('.li-connect-mark')
        .addClass('fi-social-linkedin');
});
