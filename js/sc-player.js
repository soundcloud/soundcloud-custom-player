/*
*   SoundCloud Custom Player jQuery Plugin
*   Author: Matas Petrikas, matas@soundcloud.com
*   Copyright (c) 2009  SoundCloud Ltd.
*   Licensed under the MIT license:
*   http://www.opensource.org/licenses/mit-license.php
*
*   Usage:
*   <a href="http://soundcloud.com/matas/hobnotropic" class="sc-player">My new dub track</a>
*   The link will be automatically replaced by the HTML based player
*/
(function($) {
  // Convert milliseconds into Hours (h), Minutes (m), and Seconds (s)
  var timecode = function(ms) {
    var hms = function(ms) {
          return {
            h: Math.floor(ms/(60*60*1000)),
            m: Math.floor((ms/60000) % 60),
            s: Math.floor((ms/1000) % 60)
          };
        }(ms),
        tc = []; // Timecode array to be joined with '.'

    if (hms.h > 0) {
      tc.push(hms.h);
    }

    tc.push((hms.m < 10 && hms.h > 0 ? "0" + hms.m : hms.m));
    tc.push((hms.s < 10  ? "0" + hms.s : hms.s));

    return tc.join('.');
  };
  // shuffle the array
  var shuffle = function(arr) {
    arr.sort(function() { return 1 - Math.floor(Math.random() * 3); } );
    return arr;
  };

  var debug = true,
      useSandBox = false,
      $doc = $(document),
      log = function(args) {
        try {
          if(debug && window.console && window.console.log){
            window.console.log.apply(window.console, arguments);
          }
        } catch (e) {
          // no console available
        }
      },
      domain = useSandBox ? 'sandbox-soundcloud.com' : 'soundcloud.com',
      secureDocument = (document.location.protocol === 'https:'),
      // convert a SoundCloud resource URL to an API URL
      scApiUrl = function(url, apiKey) {
        var resolver = ( secureDocument || (/^https/i).test(url) ? 'https' : 'http') + '://api.' + domain + '/resolve?url=',
            params = 'format=json&consumer_key=' + apiKey +'&callback=?';

        // force the secure url in the secure environment
        if( secureDocument ) {
          url = url.replace(/^http:/, 'https:');
        }

        // check if it's already a resolved api url
        if ( (/api\./).test(url) ) {
          return url + '?' + params;
        } else {
          return resolver + url + '&' + params;
        }
      };

  // TODO Expose the audio engine, so it can be unit-tested
  var audioEngine = function() {
    var html5AudioAvailable = function() {
        var state = false;
        try{
          var a = new Audio();
          state = a.canPlayType && (/maybe|probably/).test(a.canPlayType('audio/mpeg'));
          // uncomment the following line, if you want to enable the html5 audio only on mobile devices
          // state = state && (/iPad|iphone|mobile|pre\//i).test(navigator.userAgent);
        }catch(e){
          // there's no audio support here sadly
        }

        return state;
    }(),
    callbacks = {
      onReady: function() {
        $doc.trigger('scPlayer:onAudioReady');
      },
      onPlay: function() {
        $doc.trigger('scPlayer:onMediaPlay');
      },
      onPause: function() {
        $doc.trigger('scPlayer:onMediaPause');
      },
      onEnd: function() {
        $doc.trigger('scPlayer:onMediaEnd');
      },
      onBuffer: function(percent) {
        $doc.trigger({type: 'scPlayer:onMediaBuffering', percent: percent});
      }
    };

    var html5Driver = function() {
      var player = new Audio(),
          onTimeUpdate = function(event){
            var obj = event.target,
                buffer = ((obj.buffered.length && obj.buffered.end(0)) / obj.duration) * 100;
            // ipad has no progress events implemented yet
            callbacks.onBuffer(buffer);
            // anounce if it's finished for the clients without 'ended' events implementation
            if (obj.currentTime === obj.duration) { callbacks.onEnd(); }
          },
          onProgress = function(event) {
            var obj = event.target,
                buffer = ((obj.buffered.length && obj.buffered.end(0)) / obj.duration) * 100;
            callbacks.onBuffer(buffer);
          };

      $('<div class="sc-player-engine-container"></div>').appendTo(document.body).append(player);

      // prepare the listeners
      player.addEventListener('play', callbacks.onPlay, false);
      player.addEventListener('pause', callbacks.onPause, false);
      // handled in the onTimeUpdate for now untill all the browsers support 'ended' event
      // player.addEventListener('ended', callbacks.onEnd, false);
      player.addEventListener('timeupdate', onTimeUpdate, false);
      player.addEventListener('progress', onProgress, false);


      return {
        load: function(track, apiKey) {
          player.pause();
          player.src = track.stream_url + (/\?/.test(track.stream_url) ? '&' : '?') + 'consumer_key=' + apiKey;
          player.load();
          player.play();
        },
        play: function() {
          player.play();
        },
        pause: function() {
          player.pause();
        },
        stop: function(){
          if (player.currentTime) {
            player.currentTime = 0;
            player.pause();
          }
        },
        seek: function(relative){
          player.currentTime = player.duration * relative;
          player.play();
        },
        getDuration: function() {
          return player.duration * 1000;
        },
        getPosition: function() {
          return player.currentTime * 1000;
        },
        setVolume: function(val) {
          player.volume = val / 100;
        }
      };

    };



    var flashDriver = function() {
      var engineId = 'scPlayerEngine',
          player,
          flashHtml = function(url) {
            var swf = (secureDocument ? 'https' : 'http') + '://player.' + domain +'/player.swf?url=' + url +'&amp;enable_api=true&amp;player_type=engine&amp;object_id=' + engineId;
            if ($.browser.msie) {
              return '<object height="100%" width="100%" id="' + engineId + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" data="' + swf + '">'+
                '<param name="movie" value="' + swf + '" />'+
                '<param name="allowscriptaccess" value="always" />'+
                '</object>';
            } else {
              return '<object height="100%" width="100%" id="' + engineId + '">'+
                '<embed allowscriptaccess="always" height="100%" width="100%" src="' + swf + '" type="application/x-shockwave-flash" name="' + engineId + '" />'+
                '</object>';
            }
          };


      // listen to audio engine events
      // when the loaded track is ready to play
      soundcloud.addEventListener('onPlayerReady', function(flashId, data) {
        player = soundcloud.getPlayer(engineId);
        callbacks.onReady();
      });

      // when the loaded track finished playing
      soundcloud.addEventListener('onMediaEnd', callbacks.onEnd);

      // when the loaded track is still buffering
      soundcloud.addEventListener('onMediaBuffering', function(flashId, data) {
        callbacks.onBuffer(data.percent);
      });

      // when the loaded track started to play
      soundcloud.addEventListener('onMediaPlay', callbacks.onPlay);

      // when the loaded track is was paused
      soundcloud.addEventListener('onMediaPause', callbacks.onPause);

      return {
        load: function(track) {
          var url = track.uri;
          if(player){
            player.api_load(url);
          }else{
            // create a container for the flash engine (IE needs this to operate properly)
            $('<div class="sc-player-engine-container"></div>').appendTo(document.body).html(flashHtml(url));
          }
        },
        play: function() {
          player && player.api_play();
        },
        pause: function() {
          player && player.api_pause();
        },
        stop: function(){
          player && player.api_stop();
        },
        seek: function(relative){
          player && player.api_seekTo((player.api_getTrackDuration() * relative));
        },
        getDuration: function() {
          return player && player.api_getTrackDuration && player.api_getTrackDuration() * 1000;
        },
        getPosition: function() {
          return player && player.api_getTrackPosition && player.api_getTrackPosition() * 1000;
        },
        setVolume: function(val) {
          if(player && player.api_setVolume){
            player.api_setVolume(val);
          }
        }

      };
    };

    return html5AudioAvailable? html5Driver() : flashDriver();

  }();



  var apiKey,
      didAutoPlay = false,
      players = [],
      updates = {},
      currentUrl,
      loadTracksData = function($player, links, key) {
        var index = 0,
            playerObj = {node: $player, tracks: []},
            loadUrl = function(link) {
              var apiUrl = scApiUrl(link.url, apiKey);
              $.getJSON(apiUrl, function(data) {
                // log('data loaded', link.url, data);
                index += 1;
                if(data.tracks){
                  // log('data.tracks', data.tracks);
                  playerObj.tracks = playerObj.tracks.concat(data.tracks);
                }else if(data.duration){
                  // a secret link fix, till the SC API returns permalink with secret on secret response
                  data.permalink_url = link.url;
                  // if track, add to player
                  playerObj.tracks.push(data);
                }else if(data.creator){
                  // it's a group!
                  links.push({url:data.uri + '/tracks'});
                }else if(data.username){
                  // if user, get his tracks or favorites
                  if(/favorites/.test(link.url)){
                    links.push({url:data.uri + '/favorites'});
                  }else{
                    links.push({url:data.uri + '/tracks'});
                  }
                }else if($.isArray(data)){
                  playerObj.tracks = playerObj.tracks.concat(data);
                }
                if(links[index]){
                  // if there are more track to load, get them from the api
                  loadUrl(links[index]);
                }else{
                  // if loading finishes, anounce it to the GUI
                  playerObj.node.trigger({type:'onTrackDataLoaded', playerObj: playerObj, url: apiUrl});
                }
             });
           };
        // update current API key
        apiKey = key;
        // update the players queue
        players.push(playerObj);
        // load first tracks
        loadUrl(links[index]);
      },
      artworkImage = function(track, usePlaceholder) {
        if(usePlaceholder){
          return '<div class="sc-loading-artwork">Loading Artwork</div>';
        }else if (track.artwork_url) {
          return '<img src="' + track.artwork_url.replace('-large', '-t300x300') + '"/>';
        }else{
          return '<div class="sc-no-artwork">No Artwork</div>';
        }
      },
      updateTrackInfo = function($player, track) {
        // update the current track info in the player
        // log('updateTrackInfo', track);
        $('.sc-info', $player).each(function(index) {
          $('h3', this).html('<a href="' + track.permalink_url +'">' + track.title + '</a>');
          $('h4', this).html('by <a href="' + track.user.permalink_url +'">' + track.user.username + '</a>');
          $('p', this).html(track.description || 'no Description');
        });
        // update the artwork
        $('.sc-artwork-list li', $player).each(function(index) {
          var $item = $(this),
              itemTrack = $item.data('sc-track');

          if (itemTrack === track) {
            // show track artwork
            $item
              .addClass('active')
              .find('.sc-loading-artwork')
                .each(function(index) {
                  // if the image isn't loaded yet, do it now
                  $(this).removeClass('sc-loading-artwork').html(artworkImage(track, false));
                });
          }else{
            // reset other artworks
            $item.removeClass('active');
          }
        });
        // update the track duration in the progress bar
        $('.sc-duration', $player).html(timecode(track.duration));
        // put the waveform into the progress bar
        $('.sc-waveform-container', $player).html('<img src="' + track.waveform_url +'" />');

        $player.trigger('onPlayerTrackSwitch.scPlayer', [track]);
      },
      play = function(track) {
        var url = track.permalink_url;
        if(currentUrl === url){
          // log('will play');
          audioEngine.play();
        }else{
          currentUrl = url;
          // log('will load', url);
          audioEngine.load(track, apiKey);
        }
      },
      getPlayerData = function(node) {
        return players[$(node).data('sc-player').id];
      },
      updatePlayStatus = function(player, status) {
        if(status){
          // reset all other players playing status
          $('div.sc-player.playing').removeClass('playing');
        }
        $(player)
          .toggleClass('playing', status)
          .trigger((status ? 'onPlayerPlay' : 'onPlayerPause'));
      },
      onPlay = function(player, id) {
        var track = getPlayerData(player).tracks[id || 0];
        updateTrackInfo(player, track);
        // cache the references to most updated DOM nodes in the progress bar
        updates = {
          $buffer: $('.sc-buffer', player),
          $played: $('.sc-played', player),
          position:  $('.sc-position', player)[0]
        };
        updatePlayStatus(player, true);
        play(track);
      },
      onPause = function(player) {
        updatePlayStatus(player, false);
        audioEngine.pause();
      },
      onFinish = function() {
        var $player = updates.$played.closest('.sc-player'),
            $nextItem;
        // update the scrubber width
        updates.$played.css('width', '0%');
        // show the position in the track position counter
        updates.position.innerHTML = timecode(0);
        // reset the player state
        updatePlayStatus($player, false);
        // stop the audio
        audioEngine.stop();
        $player.trigger('onPlayerTrackFinish');
      },
      onSeek = function(player, relative) {
        audioEngine.seek(relative);
        $(player).trigger('onPlayerSeek');
        updatePlayStatus(player, true);
      },
      onSkip = function(player) {
        var $player = $(player);
        // continue playing through all players
        log('track finished get the next one');
        $nextItem = $('.sc-trackslist li.active', $player).next('li');
        // try to find the next track in other player
        if(!$nextItem.length){
          $nextItem = $player.nextAll('div.sc-player:first').find('.sc-trackslist li.active');
        }
        $nextItem.click();
      },
      soundVolume = function() {
        var vol = 80,
            cooks = document.cookie.split(';'),
            volRx = new RegExp('scPlayer_volume=(\\d+)');
        for(var i in cooks){
          if(volRx.test(cooks[i])){
            vol = parseInt(cooks[i].match(volRx)[1], 10);
            break;
          }
        }
        return vol;
      }(),
      onVolume = function(volume) {
        var vol = Math.floor(volume);
        // save the volume in the cookie
        var date = new Date();
        date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
        soundVolume = vol;
        document.cookie = ['scPlayer_volume=', vol, '; expires=', date.toUTCString(), '; path="/"'].join('');
        // update the volume in the engine
        audioEngine.setVolume(soundVolume);
      },
      positionPoll;

    // listen to audio engine events
    $doc
      .bind('scPlayer:onAudioReady', function(event) {
        log('onPlayerReady: audio engine is ready');
        audioEngine.play();
        // set initial volume
        onVolume(soundVolume);
      })
      // when the loaded track started to play
      .bind('scPlayer:onMediaPlay', function(event) {
        clearInterval(positionPoll);
        positionPoll = setInterval(function() {
          var duration = audioEngine.getDuration(),
              position = audioEngine.getPosition(),
              relative = (position / duration);

          // update the scrubber width
          updates.$played.css('width', (100 * relative) + '%');
          // show the position in the track position counter
          updates.position.innerHTML = timecode(position);
          // announce the track position to the DOM
          $doc.trigger({
            type: 'onMediaTimeUpdate.scPlayer',
            duration: duration,
            position: position,
            relative: relative
          });
        }, 500);
      })
      // when the loaded track is was paused
      .bind('scPlayer:onMediaPause', function(event) {
        clearInterval(positionPoll);
        positionPoll = null;
      })
      // change the volume
      .bind('scPlayer:onVolumeChange', function(event) {
        onVolume(event.volume);
      })
      .bind('scPlayer:onMediaEnd', function(event) {
        onFinish();
      })
      .bind('scPlayer:onMediaBuffering', function(event) {
        updates.$buffer.css('width', event.percent + '%');
      });


  // Generate custom skinnable HTML/CSS/JavaScript based SoundCloud players from links to SoundCloud resources
  $.scPlayer = function(options, node) {
    var opts = $.extend({}, $.scPlayer.defaults, options),
        playerId = players.length,
        $source = node && $(node),
        sourceClasses = $source[0].className.replace('sc-player', ''),
        links = opts.links || $.map($('a', $source).add($source.filter('a')), function(val) { return {url: val.href, title: val.innerHTML}; }),
        $player = $('<div class="sc-player loading"></div>').data('sc-player', {id: playerId}),
        $artworks = $('<ol class="sc-artwork-list"></ol>').appendTo($player),
        $info = $('<div class="sc-info"><h3></h3><h4></h4><p></p><a href="#" class="sc-info-close">X</a></div>').appendTo($player),
        $controls = $('<div class="sc-controls"></div>').appendTo($player),
        $list = $('<ol class="sc-trackslist"></ol>').appendTo($player);

        // add the classes of the source node to the player itself
        // the players can be indvidually styled this way
        if(sourceClasses || opts.customClass){
          $player.addClass(sourceClasses).addClass(opts.customClass);
        }


        // adding controls to the player
        $player
          .find('.sc-controls')
            .append('<a href="#play" class="sc-play">Play</a> <a href="#pause" class="sc-pause hidden">Pause</a>')
          .end()
          .append('<a href="#info" class="sc-info-toggle">Info</a>')
          .append('<div class="sc-scrubber"></div>')
            .find('.sc-scrubber')
              .append('<div class="sc-volume-slider"><span class="sc-volume-status" style="width:' + soundVolume +'%"></span></div>')
              .append('<div class="sc-time-span"><div class="sc-waveform-container"></div><div class="sc-buffer"></div><div class="sc-played"></div></div>')
              .append('<div class="sc-time-indicators"><span class="sc-position"></span> | <span class="sc-duration"></span></div>');

        // load and parse the track data from SoundCloud API
        loadTracksData($player, links, opts.apiKey);
        // init the player GUI, when the tracks data was laoded
        $player.bind('onTrackDataLoaded.scPlayer', function(event) {
          // log('onTrackDataLoaded.scPlayer', event.playerObj, playerId, event.target);
          var tracks = event.playerObj.tracks;
          if (opts.randomize) {
            tracks = shuffle(tracks);
          }
          // create the playlist
          $.each(tracks, function(index, track) {
            var active = index === 0;
            // create an item in the playlist
            $('<li><a href="' + track.permalink_url +'">' + track.title + '</a><span class="sc-track-duration">' + timecode(track.duration) + '</span></li>').data('sc-track', {id:index}).toggleClass('active', active).appendTo($list);
            // create an item in the artwork list
            $('<li></li>')
              .append(artworkImage(track, index >= opts.loadArtworks))
              .appendTo($artworks)
              .toggleClass('active', active)
              .data('sc-track', track);
          });
          // update the element before rendering it in the DOM
          $player.each(function() {
            if($.isFunction(opts.beforeRender)){
              opts.beforeRender.call(this, tracks);
            }
          });
          // set the first track's duration
          $('.sc-duration', $player)[0].innerHTML = timecode(tracks[0].duration);
          $('.sc-position', $player)[0].innerHTML = timecode(0);
          // set up the first track info
          updateTrackInfo($player, tracks[0]);

          // if continous play enabled always skip to the next track after one finishes
          if (opts.continuePlayback) {
            $player.bind('onPlayerTrackFinish', function(event) {
              onSkip($player);
            });
          }

          // announce the succesful initialization
          $player
            .removeClass('loading')
            .trigger('onPlayerInit');

          // if auto play is enabled and it's the first player, start playing
          if(opts.autoPlay && !didAutoPlay){
            onPlay($player);
            didAutoPlay = true;
          }
        });


    // replace the DOM source (if there's one)
    $source.each(function(index) {
      $(this).replaceWith($player);
    });

    return $player;
  };

  // stop all players, might be useful, before replacing the player dynamically
  $.scPlayer.stopAll = function() {
    $('.sc-player.playing a.sc-pause').click();
  };

  // destroy all the players and audio engine, usefull when reloading part of the page and audio has to stop
  $.scPlayer.destroy = function() {
    $('.sc-player, .sc-player-engine-container').remove();
  };

  // plugin wrapper
  $.fn.scPlayer = function(options) {
    // reset the auto play
    didAutoPlay = false;
    // create the players
    this.each(function() {
      $.scPlayer(options, this);
    });
    return this;
  };

  // default plugin options
  $.scPlayer.defaults = $.fn.scPlayer.defaults = {
    customClass: null,
    // do something with the dom object before you render it, add nodes, get more data from the services etc.
    beforeRender  :   function(tracksData) {
      var $player = $(this);
    },
    // initialization, when dom is ready
    onDomReady  : function() {
      $('a.sc-player, div.sc-player').scPlayer();
    },
    autoPlay: false,
    continuePlayback: true,
    randomize: false,
    loadArtworks: 5,
    // the default Api key should be replaced by your own one
    // get it here http://soundcloud.com/you/apps/new
    apiKey: 'htuiRd1JP11Ww0X72T1C3g'
  };


  // the GUI event bindings
  //--------------------------------------------------------

  // toggling play/pause
  $(document).on('click','a.sc-play, a.sc-pause', function(event) {
    var $list = $(this).closest('.sc-player').find('ol.sc-trackslist');
    // simulate the click in the tracklist
    $list.find('li.active').click();
    return false;
  });

  // displaying the info panel in the player
  $(document).on('click','a.sc-info-toggle, a.sc-info-close', function(event) {
    var $link = $(this);
    $link.closest('.sc-player')
      .find('.sc-info').toggleClass('active').end()
      .find('a.sc-info-toggle').toggleClass('active');
    return false;
  });

  // selecting tracks in the playlist
  $(document).on('click','.sc-trackslist li', function(event) {
    var $track = $(this),
        $player = $track.closest('.sc-player'),
        trackId = $track.data('sc-track').id,
        play = $player.is(':not(.playing)') || $track.is(':not(.active)');
    if (play) {
      onPlay($player, trackId);
    }else{
      onPause($player);
    }
    $track.addClass('active').siblings('li').removeClass('active');
    $('.artworks li', $player).each(function(index) {
      $(this).toggleClass('active', index === trackId);
    });
    return false;
  });

  var scrub = function(node, xPos) {
    var $scrubber = $(node).closest('.sc-time-span'),
        $buffer = $scrubber.find('.sc-buffer'),
        $available = $scrubber.find('.sc-waveform-container img'),
        $player = $scrubber.closest('.sc-player'),
        relative = Math.min($buffer.width(), (xPos  - $available.offset().left)) / $available.width();
    onSeek($player, relative);
  };

  var onTouchMove = function(ev) {
    if (ev.targetTouches.length === 1) {
      scrub(ev.target, ev.targetTouches && ev.targetTouches.length && ev.targetTouches[0].clientX);
      ev.preventDefault();
    }
  };


  // seeking in the loaded track buffer
  $(document)
    .on('click','.sc-time-span', function(event) {
      scrub(this, event.pageX);
      return false;
    })
    .on('touchstart','.sc-time-span', function(event) {
      this.addEventListener('touchmove', onTouchMove, false);
      event.originalEvent.preventDefault();
    })
    .on('touchend','.sc-time-span', function(event) {
      this.removeEventListener('touchmove', onTouchMove, false);
      event.originalEvent.preventDefault();
    });

  // changing volume in the player
  var startVolumeTracking = function(node, startEvent) {
    var $node = $(node),
        originX = $node.offset().left,
        originWidth = $node.width(),
        getVolume = function(x) {
          return Math.floor(((x - originX)/originWidth)*100);
        },
        update = function(event) {
          $doc.trigger({type: 'scPlayer:onVolumeChange', volume: getVolume(event.pageX)});
        };
    $node.bind('mousemove.sc-player', update);
    update(startEvent);
  };

  var stopVolumeTracking = function(node, event) {
    $(node).unbind('mousemove.sc-player');
  };

  $(document)
    .on('mousedown','.sc-volume-slider', function(event) {
      startVolumeTracking(this, event);
    })
    .on('mouseup','.sc-volume-slider', function(event) {
      stopVolumeTracking(this, event);
    });

  $doc.bind('scPlayer:onVolumeChange', function(event) {
    $('span.sc-volume-status').css({width: event.volume + '%'});
  });
  // -------------------------------------------------------------------

  // the default Auto-Initialization
  $(function() {
    if($.isFunction($.scPlayer.defaults.onDomReady)){
      $.scPlayer.defaults.onDomReady();
    }
  });

})(jQuery);
