// TODO mock the api responses
var mockList = [];
function mockAjax(mockObj) {
  mockList.push(mockObj);
};
$.getJSON = function(url, callback) {
  if ( !mockList.length ){
    throw "No mocks prepared! Detected on:" + url;
  }
  $.each(mockList, function(index, mock) {
    var urlRx = new RegExp(mock.url);
    if( url.match(urlRx) ) {
      $.get(mock.proxy, callback);
      return false;
    } else if ( index === mockList.length - 1 ) {
      throw "Unmocked request to:" + url;
    }
  });
  
}

mockList = [
  {
    url: 'http://soundcloud.com/matas/hobnotropic',
    proxy: 'fixtures/hobnotropic.json'
  },
  {
    url: 'https://soundcloud.com/matas/hobnotropic',
    proxy: 'fixtures/hobnotropic.json'
  },
  {
    url: 'http://api.soundcloud.com/tracks/49931',
    proxy: 'fixtures/hobnotropic.json'
  },
  {
    url: 'http://soundcloud.com/forss/sets/soulhack',
    proxy: 'fixtures/soulhack.json'
  },
  {
    url: 'http://api.soundcloud.com/users/183/tracks',
    proxy: 'fixtures/forss-tracks.json'
  },
  {
    url: 'http://soundcloud.com/forss/city-ports',
    proxy: 'fixtures/city-ports.json'
  },
  {
    url: 'http://soundcloud.com/forss',
    proxy: 'fixtures/forss.json'
  },
  {
    url: 'http://soundcloud.com/matas/favorites',
    proxy: 'fixtures/favorites.json'
  },
  {
    url: 'http://soundcloud.com/groups/field-recordings',
    proxy: 'fixtures/group.json'
  },
  {
    url: 'http://api.soundcloud.com/groups/8/tracks',
    proxy: 'fixtures/group-tracks.json'
  },
  {
    url: 'http://soundcloud.com/alex/a-phone-call-on-saturday-1',
    proxy: 'fixtures/alex-call.json'
  }
];


module("rendering");

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
    equal($player.find('.sc-trackslist li.active a').text(), "the dawkins riots", "First track is selected and has correct title");
    equal($player.find('.sc-trackslist li:eq(1) .sc-track-duration').text(), "14.59", "Track duration is correct in the tracklist");
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

asyncTest('api url track', 3, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.find('.sc-trackslist li').length, 1, "All the tracks are in the list");
    equal($player.find('.sc-trackslist li.active a').text(), "Hobnotropic", "First track is selected and has correct title");
    equal($player.find('.sc-trackslist li:eq(0) .sc-track-duration').text(), "8.09", "Track duration is correct in the tracklist");
    start();
  });

  var $link = $('<a href="http://api.soundcloud.com/tracks/49931">Matas hobnotropic</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer();

});

asyncTest('ssl track', 2, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.find('.sc-trackslist li').length, 1, "All the tracks are in the list");
    equal($player.find('.sc-trackslist li.active a').text(), "Hobnotropic", "First track is selected and has correct title");
    start();
  });

  var $link = $('<a href="https://soundcloud.com/matas/hobnotropic">Matas hobnotropic</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer();

});


module('options', {
  setup: function() {
  },
  teardown: function() {
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

asyncTest("continuePlayback:true", 2, function() {
  
  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    $('.sc-trackslist li:first').click();
    ok($player.find('.sc-trackslist li:first').is('.active'), 'First track has to be selected initially');
    $(document).trigger('scPlayer:onMediaEnd');
    ok($player.find('.sc-trackslist li:eq(1)').is('.active'), 'Second track has to be selected');
    start();
  });

  var $link = $('<a href="http://soundcloud.com/forss/sets/soulhack">Soulhack</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer({
    continuePlayback: true
  });
});

asyncTest("continuePlayback:false", 2, function() {
  
  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    $('.sc-trackslist li:first').click();
    ok($player.find('.sc-trackslist li:first').is('.active'), 'First track has to be selected initially');
    $(document).trigger('scPlayer:onMediaEnd');
    ok($player.find('.sc-trackslist li:first').is('.active'), 'First track still has to be selected');
    start();
  });

  var $link = $('<a href="http://soundcloud.com/forss/sets/soulhack">Soulhack</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer({
    continuePlayback: false
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
  var $link = $('<a href="http://soundcloud.com/matas/hobnotropic">Hobnotropic</a>');

  $("#qunit-fixture").append($link);

  $link.scPlayer({
    apiKey: 'myTestKey'
  });
});

asyncTest('links', 3, function() {

  $(document).one('onPlayerInit', function(event) {
    var $player = $(event.target);
    equal($player.find('.sc-trackslist li').length, 3, "All the tracks are in the list");
    equal($player.find('.sc-trackslist li.active a').text(), "Hobnotropic", "First track is selected and has correct title");
    equal($player.find('.sc-trackslist li:eq(1) .sc-track-duration').text(), "2.22", "Track duration is correct in the tracklist");
    start();
  });

  var $link = $('<div></div>');

  $("#qunit-fixture").append($link);

  $link.scPlayer({
    links: [
      {url: 'http://soundcloud.com/matas/hobnotropic', title: 'Hobnotropic'},
      {url: 'http://soundcloud.com/forss/city-ports', title: 'City Ports'},
      {url: 'http://soundcloud.com/alex/a-phone-call-on-saturday-1', title: 'Phone call'}
    ]
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

