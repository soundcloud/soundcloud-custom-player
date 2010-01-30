;(function($) {

  
  var engineId = 'scPlayerEngine',
      audioHtml = function(url) {
            return '<object height="1" width="1" id="' + engineId + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"><param name="movie" value="http://player.sandbox-soundcloud.com/player.swf?url=' + url +'&amp;enable_api=true&amp;player_type=tiny&amp;object_id=' + engineId + '"></param><param name="allowscriptaccess" value="always"></param><embed allowscriptaccess="always" height="1" src="http://player.sandbox-soundcloud.com/player.swf?url=' + url +'&amp;enable_api=true&amp;player_type=tiny&amp;object_id=' + engineId + '" type="application/x-shockwave-flash" width="1" name="' + engineId + '"></embed></object>';
          },
      autoPlay = false,
      scApiUrl = function(type) {
        return 'http://api.sandbox-soundcloud.com/' + type +'/';
      },
      scPostfix = '.json?consumer_key=htuiRd1JP11Ww0X72T1C3g&callback=?',
      favoritesRx = /\/([\w\-]+\/favorites)\/?$/,
      audioEngine,
      players = [],
      currentUrl,
      checkAudioEngine = function() {
        // TODO check if it's a good point to do it?
        // init the engine if it's not ready yet
        var url = players[0].tracks[0].url;
        console.log('checkAudioEngine', url);
        if(url && !document.getElementById(engineId)){
          currentUrl = url;
          $(audioHtml(url)).appendTo(document.body);
        }
      },
      loadFavorites = function(url, callback) {
        var permalink = url.match(favoritesRx)[1];
        $.getJSON(scApiUrl('users') + permalink + scPostfix, function(data) {
          console.log('Favorites loaded', data);
          callback(data);
        });
      },
      loadArtworks = function(tracks, container) {
        var t = tracks.slice(0,9),
            createArtItem = function(url) {
              if(url){
                $('<li><img src="' + url + '"/></li>').appendTo(container);
              }
            },
            loadTrackData = function(track) {
              var permalink = track.url.match(/\/([\w\-]+)\/?$/)[1];
              if(track.artwork_url){
                createArtItem(track.artwork_url);
                // load more
                if(t[0]){ loadTrackData(t.shift()); };
              }else{
                $.getJSON(scApiUrl('tracks') + permalink + scPostfix, function(data) {
                  createArtItem(data.artwork_url);
                  // load more
                  if(t[0]){ loadTrackData(t.shift()); };
                });
              }
            };
          
        loadTrackData(t.shift());
      },
      play = function(url) {
        if(!audioEngine){
          audioEngine = soundcloud.getPlayer(engineId);
        }
        if(currentUrl !== url){
          currentUrl = url;
          audioEngine.api_load(url);
          autoPlay = true;
        }else{
          audioEngine.api_play();
        }
      },
      getPlayerData = function(node) {
        return players[$(node).data('sc-player').id];
      },
      onPlayMain = function(node) {
        var url = getPlayerData(node).tracks[0].url;
        play(url);
      },
      onPlayTrack = function(node, id) {
        var url = getPlayerData(node).tracks[id].url;
        console.log('onPlayTrack', id, url);
        play(url);
      },
      onPause = function(node) {
        audioEngine.api_pause();
      },
      onSeek = function(node, relative) {
        audioEngine.seek(audioEngine.api_getTrackDuration() * event.relative);
      };
  
    // listen to audio events
    soundcloud.addEventListener('onPlayerReady', function(flashId, data) {
      if(autoPlay){      
        this.api_play();
      }
    });
  

  
  // Generate skinnable HTML/CSS/JavaScript based SoundCloud players from links to SoundCloud resources
  $.scPlayer = function(node, options) {
    var opts = $.extend({}, $.fn.scPlayer.defaults, options),
        playerId = players.length,
        trackList = [],
        $source = $(node),
        urls = $('a', $source).add($source.filter('a')).map(function(i, val) { return {url: val.href, title: val.innerHTML}; }),
        $player = $('<div class="sc-player"><strong class="title">' + $source.text() +'</strong></div>').data('sc-player', {id: playerId}),
        $list = $('<ul class="tracks"></ul>').appendTo($player),
        generateList = function(arr) {
          $(arr).each(function(index, val) {
            $('<li>' + val.title + '</li>').data('sc-track', {id:trackList.length}).appendTo($list);
            // add to tracks list
            trackList.push({url: val.url || val.permalink_url, artwork_url: val.artwork_url});
          });
          if(opts.loadArtworks){
            loadArtworks(trackList, $('<ul class="artworks"></ul>').appendTo($player));
          }
        };
    
    // parse the tracks
    console.log('$urls', urls);
    if(favoritesRx.test(urls[0].url)){
      loadFavorites(urls[0].url, function(data) {
        generateList(data);
      });
    }else{
      generateList(urls);
    }

    
    // update the players db
    players.push({player: $player, tracks: trackList});
    // update the element before rendering it in the DOM
    $player.each(opts.beforeRender);
    // replace the data source
    $source.replaceWith($player);
    // check if audio engine is inited properly
    checkAudioEngine();
    return $player;
  };
  
  $.fn.scPlayer = function(options) {
    var opts = $.extend({}, $.fn.scPlayer.defaults, options);

    return this.each(function() {
      $.scPlayer(this, options);
    });
  };

  // default options
  $.fn.scPlayer.defaults = {
    // do something with dom object before you render it, add nodes, etc.
    beforeRender  :   function() {
      var $player = $(this);
      $player.append('<div class="controls"><a href="#" class="play">Play<a> <a href="#" class="pause hidden">Pause</a></div>');
    },
    // initialization, when dom is ready
    onDomReady  : function() {
      $('a.sc-player, div.sc-player').scPlayer();
    },
    loadArtworks: true
  };
  
  // the GUI event bindings
  // toggling play/pause
  $('.sc-player a.play, .sc-player a.pause').live('click', function(event) {
    var $player = $(this).closest('.sc-player'),
        play = (/play/).test(this.className);
    if (play) {
      onPlayMain($player);
    }else{
      onPause($player);
    }
    $player.toggleClass('playing', play);
    return false;
  });
  
  $('.sc-player li').live('click', function(event) {
    var $track = $(this),
        $player = $track.closest('.sc-player'),
        trackId = $track.data('sc-track').id,
        play = !$track.is('.active');
    if (play) {
      onPlayTrack($player, trackId);
    }else{
      onPause($player);
    }
    $track.addClass('active').siblings('li').removeClass('active');
    $player.toggleClass('playing', play);
    return false;
  });
  
  // seeking in  buffer
  $('.sc-player div.buffer').live('click', function(event) {
    var $buffer = $(this),
        $availabe = $buffer.closest('available'),
        $player = $buffer.closest('.sc-player'),
        relative = event.pageX  - $available.offset().left / $available.width();
    onSeek($player, relative);
    return false;
  });
  
  $(function() {
    $.fn.scPlayer.defaults.onDomReady();
  });

})(jQuery);
