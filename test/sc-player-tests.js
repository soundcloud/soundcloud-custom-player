module("rendering");

// TODO mock the api responses

asyncTest('track', 11, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.find('.sc-controls .sc-play').text(), "Play", "The play button is set correctly");
    equal($player.find('.sc-controls .sc-pause.hidden').text(), "Pause", "The pause button is set correctly");
    equal($player.find('.sc-info h3 a').text(), "Hobnotropic", "The title is set correctly");
    equal($player.find('.sc-info h4 a').text(), "matas", "The username is set correctly");
    equal($player.find('.sc-info p:contains(Kinda of an experiment)').length, 1, "The track description is set correctly");
    equal($player.find('.sc-artwork-list li.active img').length, 1, "First track artwork is activated");
    equal($player.find('.sc-waveform-container img').length, 1, "First track waveform is loaded");
    equal($player.find('.sc-scrubber .sc-buffer').length, 1, "Track buffer is here");
    equal($player.find('.sc-scrubber .sc-played').length, 1, "Play buffer is here");
    equal($player.find('.sc-scrubber .sc-position').text(), '0.00', "Initial track position here");
    equal($player.find('.sc-scrubber .sc-duration').text(), '8.09', "Track duration here");
    start();
  });

  var $link = $('<a href="http://soundcloud.com/matas/hobnotropic">Hobnotropic</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer();

});

asyncTest('loading class', 2, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.hasClass('loading'), false, "Player has no loading class when it's rendered");
    start();
  });

  var $link = $('<a href="http://soundcloud.com/matas/hobnotropic">Hobnotropic</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer();
  equal($('.sc-player.loading').length, 1, "Player has a loading class untill it's rendered");

});

asyncTest('inherit class', 1, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.hasClass('myclass'), true, "Player has inherited the class from the source link");
    start();
  });

  var $link = $('<a href="http://soundcloud.com/matas/hobnotropic" class="myclass">Hobnotropic</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer();

});


asyncTest('set', 3, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.find('.sc-trackslist li').length, 11, "All the tracks are in the list");
    equal($player.find('.sc-trackslist li.active a').text(), "City Ports", "First track is selected and has correct title");
    equal($player.find('.sc-trackslist li:eq(1) .sc-track-duration').text(), "4.34", "Track duration is correct in the tracklist");
    start();
  });

  var $link = $('<a href="http://soundcloud.com/forss/sets/soulhack">Soulhack</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer();

});

asyncTest('user', 3, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.find('.sc-trackslist li').length, 29, "All the tracks are in the list");
    equal($player.find('.sc-trackslist li.active a').text(), "Journeyman Acappella", "First track is selected and has correct title");
    equal($player.find('.sc-trackslist li:eq(1) .sc-track-duration').text(), "2.17", "Track duration is correct in the tracklist");
    start();
  });

  var $link = $('<a href="http://soundcloud.com/forss/">Forss tracks</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer();

});

asyncTest('favorites', 3, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.find('.sc-trackslist li').length, 50, "All the tracks are in the list");
    equal($player.find('.sc-trackslist li.active a').text(), "Fun Fact", "First track is selected and has correct title");
    equal($player.find('.sc-trackslist li:eq(1) .sc-track-duration').text(), "6.49", "Track duration is correct in the tracklist");
    start();
  });

  var $link = $('<a href="http://soundcloud.com/matas/favorites">Matas favorites</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer();

});


asyncTest('group', 3, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.find('.sc-trackslist li').length, 50, "All the tracks are in the list");
    equal($player.find('.sc-trackslist li.active a').text(), "not f**king happy", "First track is selected and has correct title");
    equal($player.find('.sc-trackslist li:eq(1) .sc-track-duration').text(), "3.38", "Track duration is correct in the tracklist");
    start();
  });

  var $link = $('<a href="http://soundcloud.com/groups/field-recordings">Field recordings group</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer();

});


asyncTest('multiple links', 3, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.find('.sc-trackslist li').length, 3, "All the tracks are in the list");
    equal($player.find('.sc-trackslist li.active a').text(), "Hobnotropic", "First track is selected and has correct title");
    equal($player.find('.sc-trackslist li:eq(1) .sc-track-duration').text(), "2.22", "Track duration is correct in the tracklist");
    start();
  });

  var $link = $('<div></div>');
  $link
    .append('<a href="http://soundcloud.com/matas/hobnotropic">Matas hobnotropic</a>')
    .append('<a href="http://soundcloud.com/forss/city-ports">Forss City Ports</a>')
    .append('<a href="http://soundcloud.com/alex/a-phone-call-on-saturday-1">Phone call</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer();

});


module('options', {
  teardown: function() {
    $.mockjaxClear();
    $.scPlayer.destroy();
  }
});


asyncTest("beforeRender", 4, function() {
  var $link = $('<a href="http://soundcloud.com/matas/hobnotropic">Hobnotropic</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer({
    beforeRender  :   function(tracksData) {
      ok(true, 'beforeRender called');
      equal(tracksData[0].title, 'Hobnotropic', 'The track data is passed to the callback');
      equal($(this).hasClass('sc-player'), true, 'The function scope is correct');
      equal($(this).find('.sc-trackslist li a').text(), "Hobnotropic", 'The player DOM is already rendered');
      start();
    }
  });

});


asyncTest("customClass", 1, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.hasClass('very-special'), true, 'The customClass is set correctly');
    start();
  });

  var $link = $('<a href="http://soundcloud.com/matas/hobnotropic">Hobnotropic</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer({
    customClass: 'very-special'
  });

});


asyncTest("loadArtworks", 2, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.find('.sc-artwork-list img').length, 1, 'only one artwork loaded');
    equal($player.find('.sc-artwork-list .sc-loading-artwork').length, 10, 'placeholders for artworks prepared');
    start();
  });

  var $link = $('<a href="http://soundcloud.com/forss/sets/soulhack">Soulhack</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer({
    loadArtworks: 1
  });

});


asyncTest("autoPlay", 2, function() {

  $(document).one('onPlayerPlay', function(event) {
    var $player = $(event.target);
    ok(true, 'The track is playing');
    equal($player.hasClass('playing'), true, 'The playingClass is set correctly');
    start();
  });

  var $link = $('<a href="http://soundcloud.com/matas/hobnotropic">Hobnotropic</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer({
    autoPlay: true
  });

});

asyncTest("apiKey", function() {
  $(document).one('onTrackDataLoaded', function(event) {
    equal(event.url, 'http://api.soundcloud.com/resolve?url=http://soundcloud.com/matas/hobnotropic&format=json&consumer_key=myTestKey&callback=?', 'The custom API key was used');
    start();
  });
  $.mockjax({
    url: 'http://api.soundcloud.com/resolve*',
    proxy: 'fixtures/set.json'
  });
  var $link = $('<a href="http://soundcloud.com/matas/hobnotropic">Hobnotropic</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer({
    apiKey: 'myTestKey'
  });
});


asyncTest("randomize", 1, function() {
  var indexes = [];
  // testing for randomness is complicated
  function compareIndexes() {
    for( var i = 1; i < indexes.length; i++){
      if ( indexes[i] !== indexes [0] ) {
        ok(true, 'Randomized playlist found!');
        break;
      }
    }
    start();
  };
  // TODO can we do it simpler?
  function getPlayerIndexes() {
    $(document).one('onPlayerInit', function(event) {
      var $player = $(event.target);
      indexes.push($.map($('.sc-trackslist li a'), function(item){
        return item.href;
      }).join(''));
      if ( indexes.length < 7 ) {
        getPlayerIndexes();
      } else {
        compareIndexes();
      }
    });
    var $link = $('<a href="http://soundcloud.com/forss/sets/soulhack">Soulhack</a>');

    $("#qunit-fixture").html($link);

    $link.scPlayer({
      randomize: true
    });
  };

  getPlayerIndexes();

});

