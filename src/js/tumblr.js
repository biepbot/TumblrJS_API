/*
* Embedded Tumblr API
* Copyright (c) 2018 Rowan Dings (biepbot.com)
* Licensed under the MIT and GPL licenses.
*/

function _t(ele) {
    if (!(this instanceof _t)) {
        return new _t(ele);
    } else {
        /* ###################################################################
            Public functions
        ################################################################### */

        // v = amount or string for post
        _t.prototype.load = function (v) {
            // queue a load until a load is possible
            if (!usableTemplate()) {
                waitUntil(usableTemplate, function () {
                    load(v);
                }, 200);
                return;
            }

            if (filterlock()) {
                filterunlock();
                if (getCache('preventload')) {
                    return;
                }
                setCache('preventload', true);

                if (typeof v === 'number') {
                    // amount
                    _load(v);
                } else if (typeof v === 'string') {
                    console.error('Can only load integer amounts. For getting single posts, set the postID in settings');
                }
            }
        }
        // Loads in new posts (in case of double)
        var tempIndex = 0;
        _t.prototype.loadNewPosts = function() {
            var ti = getCache('index'); // get previous index
            setCache('index', tempIndex); // set the new index
            tempIndex = ti;

            // Check if the blog was entirely loaded
            var stop = getCache('stop');

            // Clear old cache
            clearCache('posts');

            // Allow loading in any case
            setCache('stop', false);

            // Demand a load of 1 new item (the new post)
            qt = 1;

            // Send request for new cache
            demandUpdatedCacheFilter(function () {

                // Once finished, update cache
                updateCache(true); // true : appendBefore
                // reset index
                getCache()['index'] += tempIndex;
                tempIndex = 0;
                // clear new cache
                clearCache('posts');

                // If the blog was entirely loaded, refuse to load
                setCache('stop', stop);
            });

        }

        // v = username
        _t.prototype.setBlog = function (v) {
            username = v;
        }

        this.settings = {};
        this.getCache = getCache;

        // v = array of filters or single filter
        _t.prototype.filter = function (v) {
            clearCache(); // any loaded post is not necessarily needed

            if (!v.length) {
                var x = [];
                x.push.v;
                v = x;
            }
            filters = v;
            filterunlock();
            _load(5);
        }

        /* ###################################################################
            Public events
        ################################################################### */
        _t.prototype.addEventListener = function(n, v) {
            var obj = {};
            obj.event = n;
            obj.function = v;
            events.push(obj);
        }
        _t.prototype.removeEventListener = function(n, v) {
            var obj = {};
            obj.event = n;
            obj.function = v;
            removeA(events, obj);
        }
        function callEvents(name, data) {
            for (var i = 0; i < events.length; i++) {
                var e = events[i];
                if (e.event === name || 'on' + e.event === name) {
                    e.function(data);
                }
            }
        }

        /* ###################################################################
            Parsing & variables
        ################################################################### */
        var events = [];                        // Supported events

        var template = ele.template || 0;       // accepted: url to download, string, element
        if (!template) {
            console.error('No template was given');
        } else {
            if (template instanceof HTMLElement) {
                // actual html element: can't use, convert first
                template = stringifyHTML(ele.template, true);
                // delete the original element
                ele.template.parentNode.removeChild(ele.template);
            } else if (template.indexOf('<') !== -1) {
                // string html element
            } else {
                // url
                // download & cache
                var xhr = new XMLHttpRequest();
                xhr.open('GET', template, true);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        template = this.responseText;
                    } else if (xhr.status !== 200) {
                        console.error(xhr.status + ' ERROR during loading "' + xhr.responseURL + '": \r\n' + xhr.responseText);
                    }
                }
                xhr.send();
            }
        }
        var me = this;
        var username = ele.blog || 'biepbot';   // Private variable to change instead of username
        var qt = 0; 						    // Quantity to load from Tumblr (cache)
        var blogs = [];						    // Blog caches and blog load data
        var current_filter;					    // Currently processed filter
        var filters = [];                       // all filters
        function getPostId() {                  // id of the post, if any
            return me.settings.postID || -1;
        }
        var timeout = ele.timeout || 5000;     // timeout for tumblr
        var type = ele.type;
        var usableTemplate = function () {
            return template.indexOf('<') !== -1;
        }
        var size = function () {
            return me.settings.thumbsize || 400;
        }

        function isPost() {
            return getPostId() !== -1;
        }

		/* ##############################
			Array management
		############################## */
        function getArrayId(array, id, persist) {
            var qobj;
            for (var i in array) {
                var q = array[i];
                if (q['id'] === id) {
                    qobj = q;
                    break;
                }
            }
            if (persist) { qobj = persist(qobj); }
            return qobj;
        }
        function removeA(arr) {
            var what, a = arguments, L = a.length, ax;
            while (L > 1 && arr.length) {
                what = a[--L];
                while ((ax = arr.indexOf(what)) !== -1) {
                    arr.splice(ax, 1);
                }
            }
            return arr;
        }

		/* ##############################
			Function dependencies
        ############################## */
        /*
         * Source: https://johnresig.com/files/pretty.js
         * Copyright (c) 2011 John Resig (ejohn.org)
         * Licensed under the MIT and GPL licenses.
        */
        function prettyDate(time) {
            if (!time) return 'unknown';
            // 2014-02-04 22:49:51 GMT
            var date = toDate(time, 'yyyy-mm-dd hh:ii:ss GMT'),
                diff = (((new Date()).getTime() - date.getTime()) / 1000),
                day_diff = Math.floor(diff / 86400);

            if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
                return formatDate(date);

            return day_diff == 0 && (
                diff < 60 && "just now" ||
                diff < 120 && "1 minute ago" ||
                diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
                diff < 7200 && "1 hour ago" ||
                diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
                day_diff == 1 && "Yesterday" ||
                day_diff < 7 && day_diff + " days ago" ||
                day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
        }
        /*
         * End of source
        */
        function addCommas(nStr) {
            nStr += '';
            var x = nStr.split('.');
            var x1 = x[0];
            var x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + ',' + '$2');
            }
            return x1 + x2;
        }
        function toDate(str, format) {
            var normalized = str.replace(/[^a-zA-Z0-9]/g, '-');
            var normalizedFormat = format.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
            var formatItems = normalizedFormat.split('-');
            var dateItems = normalized.split('-');

            var monthIndex = formatItems.indexOf("mm");
            var dayIndex = formatItems.indexOf("dd");
            var yearIndex = formatItems.indexOf("yyyy");
            var hourIndex = formatItems.indexOf("hh");
            var minutesIndex = formatItems.indexOf("ii");
            var secondsIndex = formatItems.indexOf("ss");

            var today = new Date();

            var year = yearIndex > -1 ? dateItems[yearIndex] : today.getFullYear();
            var month = monthIndex > -1 ? dateItems[monthIndex] - 1 : today.getMonth() - 1;
            var day = dayIndex > -1 ? dateItems[dayIndex] : today.getDate();

            var hour = hourIndex > -1 ? dateItems[hourIndex] : today.getHours();
            var minute = minutesIndex > -1 ? dateItems[minutesIndex] : today.getMinutes();
            var second = secondsIndex > -1 ? dateItems[secondsIndex] : today.getSeconds();
            return new Date(year, month, day, hour, minute, second);
        }
        function formatDate(date) {
            var monthNames = [
                "January", "February", "March",
                "April", "May", "June", "July",
                "August", "September", "October",
                "November", "December"
            ];
            var mins = date.getMinutes();
            if (mins < 10) {
                mins = '0' + mins;
            }
            return date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear() + " " + date.getHours() + ":" + mins;
        }
        function endsWith(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        }
        function hasClass(ele, cls) {
            return (" " + ele.className + " ").indexOf(" " + cls + " ") > -1;
        }
        function addClass(ele, cls) {
            if (!hasClass(ele, cls)) {
                var space = ' ';
                if (endsWith(ele.className, space)) {
                    space = '';
                }
                ele.className += space + cls;
                return true;
            }
            return false;
        }
        function removeClass(ele, cls) {
            if (hasClass(ele, cls)) {
                var reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
                ele.className = ele.className.replace(reg, " ")
            }
        }
        function loadScript(url, ignore) {
            var r = window.location.hostname === '' ? '' : '/';
            if (ignore) r = '';
            var resource = document.createElement("script");
            resource.async = "true";
            resource.src = r + url;
            var script = document.getElementsByTagName("script")[0];
            script.parentNode.insertBefore(resource, script)
        }
        function isBT(w, h) {
            return w / h > 1.25 || h / w > 1.25;
        }
        function replaceAll(str, find, replace) {
            return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
        }
        function escapeRegExp(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
        }
        function stringifyHTML(who, deep) {
            if (!who || !who.tagName) return '';
            var txt, ax, el = document.createElement("div");
            el.appendChild(who.cloneNode(false));
            txt = el.innerHTML;
            if (deep) {
                ax = txt.indexOf('>') + 1;
                txt = txt.substring(0, ax) + who.innerHTML + txt.substring(ax);
            } el = null;
            return txt;
        }
        function elementFromString(htmlString) {
            var div = document.createElement('div');
            div.innerHTML = htmlString.trim();
            return div.firstChild;
        }
        function waitUntil(funcCond, readyAction, checkInterval, timeout, timeoutfunc) {
            if (checkInterval == null) {
                checkInterval = 100;
            }
            var start = +new Date();
            if (timeout == null) {
                timeout = Number.POSITIVE_INFINITY;
            }
            var checkFunc = function () {
                var end = +new Date();
                if (end - start > timeout) {
                    if (timeoutfunc) {
                        timeoutfunc();
                    }
                } else {
                    if (funcCond()) {
                        readyAction();
                    } else {
                        setTimeout(checkFunc, checkInterval);
                    }
                }
            };
            checkFunc();
        };

        /* ###################################################################
            Blog caches
        ################################################################### */
        //== Getters and setters ==//
        function addCache(posts) {
            var qobj = getCache();
            for (var post in posts) {
                qobj['posts'].push(posts[post]);
            }
        }
        function addLoadedImg(src) {
            var qobj = getCache();
            qobj['loaded-images'].push(src);
        }
        function getCache(id) {
            return id ? persistBlogCache()[id] : persistBlogCache();
        }
        function setCache(id, val) {
            getCache()[id] = val;
        }
        function clearCache() { // posts only
            revalidateScripts();
            setCache('index', 0);
            tempIndex = 0;
            lastReturn = 0;
            setCache('stop', false);
            setCache('preventload', false);
            setCache('posts', []);
            setCache('loaded-images', []);
        }
        //== Cache mutation ==//
        function persistBlogCache() {
            return qobj = getArrayId(blogs, username, persistBlogCacheObject);
        }
        function persistBlogCacheObject(qobj) {
            if (!qobj) {
                qobj = {};
                qobj['id'] = username;
                qobj['posts'] = [];
                qobj['loaded-images'] = [];
                qobj['stop'] = false;
                qobj['preventload'] = false;
                qobj['index'] = 0;
                blogs.push(qobj);
            }
            return qobj;
        }

        /* ###################################################################
            Updating client
        ################################################################### */
        // After trigger load -> load / verify cache
        function _load(qa, before) {
            // Set load quantity
            qt = qa;

            // Remove all Tumblr scripts
            revalidateScripts();

            // Load
            callEvents('beforeload');
            performLoad(before);
        }

        function isAPIloaded() {
            return tumblr_api_read != null;
        }

        function stopLoad(goodEnd) {
            if (!goodEnd) {
                callEvents('onerror');
            } else {
                setCache('stop', true);
            }
        }

        // After verifying cache -> load
        function performLoad(before) {

            // Load in from cache
            while (qt > 0) {

                // Get next from cache
                var postobj = getCache('posts').shift();
                if (postobj == null) {
                    // If there was no cache

                    // And there are no more new posts
                    if (getCache('stop')) {
                        callEvents('onstop');
                        return;
                    }
                    // else, get new cache
                    demandUpdatedCacheFilter(updateCache);
                    return;
                }

                // Check if object already exists
                var id = postobj['reblog-key'] + postobj['id'];
                if (document.getElementById(id) == null) {
                    // does not exist

                    if (before) {
                        // is ordered to load before
                        callEvents('doubleload', parseImage(postobj));
                    } else
                        // loads as normal
                        callEvents('afterload', parseImage(postobj));
                } else {

                    // trigger double event
                    callEvents('ondouble');
                    qt++; // Load next post
                }
                qt--; // Remove a counter from the quantity

                // Increment index
                getCache()['index'] += 1;
            }

            if (getCache('posts').length == 0) {
                // load a new cache in advance
                demandUpdatedCacheFilter(updateCache);
            }

            // Allow getting of new cache
            setCache('preventload', false);
        }

        function demandUpdatedCacheFilter(onTrigger) {
            if (demandUpdatedCache()) {
                waitUntil(isAPIloaded, onTrigger, 100, timeout, stopLoad);
            }
        }

        // For atomical locking
        var fl = false;
        function filterlock() {
            if (fl) return false;
            fl = true;
            return fl;
        }
        function filterunlock() {
            fl = false;
        }

        function demandUpdatedCache() {
            var filter = filters[0] || false;

            // Check if there's enough posts in cache
            if (qt > getCache('posts').length) {
                tumblr_api_read = null;
                var base = 'http://' + username + '.tumblr.com/api/read/json?';

                if (isPost()) {
                    loadScript(base + 'id=' + getPostId(), true);
                } else {
                    var fget = filter ? '&tagged=' + htmlEncode(filter) : '';
                    var ftype = type != 0 ? '&type=' + type : '';
                    var url = base + 'num=50&start=' + getCache('index') + ftype + fget;
                    loadScript(url, true);
                }
                return true; // Updating
            }
            return false; // Not updating
        }

        function updateCache(appendBefore) {
            if (!isAPIloaded() || qt > 50) {
                return;
            }

            var filterbug = filters.length > 0 ? 48 : 50;

            // Add the new cache
            addCache(tumblr_api_read.posts);

            // Check if loaded the last images
            if (tumblr_api_read.posts.length < filterbug) {
                stopLoad(true); // refuse to cache any more
            }

            // Clear the tumblr API to clear memory
            tumblr_api_read.posts.length = 0;
            var empty = false;

            ///////////////// REBLOGS 
            // remove reblogs if necessary
            if (!me.settings.reblogs) {
                var posts = getCache('posts');
                posts = posts.filter(function (e, i, posts) {
                    return posts[i]['reblogged-from-name'] == null;
                });
                setCache('posts', []);
                addCache(posts);
            }

            ///////////////// SUBMISSIONS
            // remove submissions if necessary
            if (!me.settings.submissions) {
                var posts = getCache('posts');
                posts = posts.filter(function (e, i, posts) {
                    return posts[i]['is-submission'] == false;
                });
                setCache('posts', []);
                addCache(posts);
            }

            ///////////////// FILTERS
            // If there is only a single filter
            if (filters.length <= 1) {
                performLoad(appendBefore);
            } else {
                // Else, process all filter caches
                var posts = getCache('posts');

                // Make unique and filter out posts that are in the filters
                posts = posts.filter(function (e, i, posts) {
                    var nocontain = false;
                    var tags = posts[i]['tags'];
                    for (var j in filters) {
                        var present = false;
                        for (var k in tags) {
                            present = tags[k].toLowerCase() === filters[j].toLowerCase();
                            if (present) break;
                        }
                        nocontain = !present;
                        if (nocontain) break;
                    }
                    return posts.lastIndexOf(e) === i && !nocontain;
                });

                setCache('posts', []);
                addCache(posts);
                performLoad(appendBefore);
            }
            // Unlock filter
            filterunlock();
            tumblr_api_read = null;
        }

        function revalidateScripts() {
            var scripts = document.getElementsByTagName('script');
            for (var i in scripts) {
                var script = scripts[i];
                if (script != null && script.src != null)
                    if (script.src.indexOf('tumblr') !== -1) {
                        script.parentNode.removeChild(script);
                        i--;
                    }
            }
            // Clear the current API
            tumblr_api_read = null;
        }

        /* ###################################################################
            Parsing data to a usable object
        ################################################################### */

        // audio-caption, embed, player, plays
        // id3-album, artist, title, track, year 
        function getGeneralObject(json) {
            // Create HTML object
            var htmlIMG = {};

            htmlIMG['id'] = json['id'];
            htmlIMG['reblog-key'] = json['reblog-key'];
            htmlIMG['note-count'] = json['note-count'];
            htmlIMG['type'] = json['type'];

            var origin = json['reblogged-from-name'];
            if (origin == null) origin = json;
            htmlIMG['origin'] = origin;

            htmlIMG['source'] = json['url'];
            htmlIMG['date-NL'] = json['date'];
            htmlIMG['date-GMT'] = json['date-gmt'];
            htmlIMG['tags'] = json['tags'];
            htmlIMG['description'] = json['photo-caption'];
            htmlIMG['like-button'] = json['like-button'];
            htmlIMG['reblog-button'] = json['reblog-button'];
            htmlIMG['is-submission'] = json['is-submission'];

            return htmlIMG;
        }
        function getRegularObject(json) {
            var o = getGeneralObject(json);
            o.title = json['regular-title'];
            o.body = json['regular-body'];
            return o;
        }
        function getLinkObject(json) {
            var o = getGeneralObject(json);
            o.title = json['link-text'];
            o.body = json['link-description'];
            o.url = json['link-url'];
            return o;
        }
        function getConversationObject(json) {
            var o = getGeneralObject(json);
            o.conversation = json['conversation'];
            return o;
        }
        function getVideoObject(json) {
            var o = getGeneralObject(json);
            o.body = json['video-caption'];
            o.video = {};
            o.video.embed = json['video-player'];
            return o;
        }
        function getAudioObject(json) {
            var o = getGeneralObject(json);
            o.audio = {};
            o.audio.caption = json['audio-caption'];
            o.audio.embed = json['audio-embed'];
            o.audio.player = json['audio-player'];
            o.audio.plays = json['audio-plays'];
            o.id3 = {};
            o.id3.album = json['id3-album'];
            o.id3.artist = json['id3-artist'];
            o.id3.title = json['id3-title'];
            o.title = o.id3.title;
            o.id3.track = json['id3-track'];
            o.id3.year = json['id3-year'];
            return o;
        }
        function getQuoteObject(json) {
            var o = getGeneralObject(json);
            o.title = json['quote-source'];
            o.body = json['quote-text'];
            return o;
        }
        function getPhotoObject(json) {

            // Create HTML object
            var htmlIMG = getGeneralObject(json);

            // fetch images and alts
            htmlIMG['image-alt'] = json['slug'];

            var imgs = [];
            var imgs2 = [];
            for (var name in json) {
                if (json.hasOwnProperty(name)) {
                    if (name.indexOf('photo-url-') !== -1) {
                        var img = {};
                        img['source'] = json[name];
                        imgs.push(img);
                    }
                }
            }

            htmlIMG['images'] = imgs;
            htmlIMG['extra-images'] = json['photos'];
            return htmlIMG;
        }

        /* ###################################################################
            Function factory
        ################################################################### */
        var supportedParameters = [];

        // register values
        registerParameter('ID', 'v', getID);
        registerParameter('REBLOG', 'v', getReblog);
        registerParameter('BLOG', 'v', getBlog);
        registerParameter('NOTES', 'v', getNotes);
        registerParameter('NICENOTES', 'v', getNiceNotes);
        registerParameter('DESCRIPTION', 'v', getDescription);
        registerParameter('TYPE', 'v', getType);
        registerParameter('TITLE', 'v', getTitle);
        registerParameter('BODY', 'v', getBody);
        registerParameter('ARTIST', 'v', getArtist);
        registerParameter('PLAYS', 'v', getPlays);
        registerParameter('NICEPLAYS', 'v', getNicePlays);
        registerParameter('YEAR', 'v', getYear);
        registerParameter('URL', 'v', getUrl);
        registerParameter('DATE', 'v', getDate);
        registerParameter('NICEDATE', 'v', getNiceDate);

        // register elements
        registerParameter('IMAGE', 'e', renderImage);
        registerParameter('REBLOG_BUTTON', 'e', renderReblogButton);
        registerParameter('IMAGES', 'e', renderImages);
        registerParameter('TAGS', 'e', renderTags);
        registerParameter('CONVERSATION', 'e', renderConversation);
        registerParameter('AUDIO', 'e', renderAudio);
        registerParameter('VIDEO', 'e', renderVideo);
        registerParameter('SINGLE-POST-ONLY', 'e', parseSingle);
        registerParameter('MULTI-POST-ONLY', 'e', parseMulti);
        registerParameter('REGULAR-POST-ONLY', 'e', parseRegular);
        registerParameter('LINK-POST-ONLY', 'e', parseLink);
        registerParameter('PHOTO-POST-ONLY', 'e', parseImages);
        registerParameter('QUOTE-POST-ONLY', 'e', parseQuote);
        registerParameter('CONVERSATION-POST-ONLY', 'e', parseConversation);
        registerParameter('AUDIO-POST-ONLY', 'e', parseAudio);
        registerParameter('VIDEO-POST-ONLY', 'e', parseVideo);

        function registerParameter(parameter, t, r) {
            supportedParameters.push({
                'name': parameter,
                'type': t,
                'content': r
            });
        }
        function updateValueParametersInElement(string, obj) {
            for (var i = 0; i < supportedParameters.length; i++) {
                var x = supportedParameters[i];
                if (x.type === 'v') {
                    string = updateValues(string, x, obj);
                }
            }
            return string;
        }

        // remove from scope
        function updateValues(string, x, obj) {
            return replaceAll(string, '_T(' + x.name + ')', function () { return x.content(obj) });
        }
        function updateResources(e, x, o) {
            x.content(e, o);
        }
        // returns all elements with tumblr parameters
        function updateResourcesInElement(element, obj) {
            for (var i = 0; i < supportedParameters.length; i++) {
                var x = supportedParameters[i];
                if (x.type === 'e') {
                    var ele = element.querySelector('[id*="_T(' + x.name + ')"]');
                    if (ele) {
                        ele.id = '';
                        updateResources(ele, x, obj);
                    }
                }
            }
        }

        /* ###################################################################
            VALUE GETTERS
        ################################################################### */
        function getID(o) {
            return o.id;
        }
        function getReblog(o) {
            return 'https://www.tumblr.com/reblog/' + o.id + '.' + o['reblog-key'];
        }
        function getBlog(o) {
            return username;
        }
        function getDate(o) {
            return o['date-GMT'];
        }
        function getNiceDate(o) {
            return prettyDate(o['date-GMT']) || getDate(o);
        }
        function getNotes(o) {
            var c = o['note-count'];
            return c == 1 ? c + ' note' : c + ' notes';
        }
        function getNiceNotes(o) {
            var c = o['note-count'];
            c = addCommas(c);
            return c == 1 ? c + ' note' : c + ' notes';
        }
        function getDescription(o) {
            return o.description || '';
        }
        function getType(o) {
            return o.type;
        }
        function getBody(o) {
            return o.body || '';
        }
        function getTitle(o) {
            return o.title || '';
        }
        function getUrl(o) {
            return o.url || '';
        }
        function getArtist(o) {
            if (o.id3) {
                return o.id3.artist;
            }
            return '';
        }
        function getAlbum(o) {
            if (o.id3) {
                return o.id3.album;
            }
            return '';
        }
        function getYear(o) {
            if (o.id3) {
                return o.id3.year;
            }
            return '';
        }
        function getPlays(o) {
            if (o.audio) {
                var c = o.audio.plays;
                return c == 1 ? c + ' time' : c + ' times';
            }
            return '';
        }
        function getNicePlays(o) {
            if (o.audio) {
                var c = o.audio.plays;
                c = addCommas(c);
                return c == 1 ? c + ' time' : c + ' times';
            }
            return '';
        }

        /* ###################################################################
            ELEMENT GETTERS
        ################################################################### */
        function renderImages(e, o) {
            // Add smaller images 
            var count = 0;
            var ei = o['extra-images'];
            if (!ei) {
                return;
            }
            for (var i = 1; i < ei.length; i++) {
                count++;
                var im = ei[i]['photo-url-250'];
                var w = ei[i]['width'], h = ei[i]['height'];

                image = document.createElement('img');
                var BT = isBT(w, h);
                var last = ei.length - 1 == i;
                // if this one is B or T, then this image is blocking for the next one. 
                // no squares next to each other
                if (BT) {
                    count = 0;
                    addClass(image, 'broad');
                    im = ei[i]['photo-url-' + size()];
                } else {
                    var uneven = count % 2 === 1;
                    if (uneven && !last) { // if not last
                        // check if next one is BT
                        var w2 = ei[i + 1]['width'], h2 = ei[i + 1]['height'];
                        BT = isBT(w2, h2);
                        if (BT) {
                            // treat this one as BT, since there is no space
                            count = 0;
                            addClass(image, 'broad');
                            im = ei[i]['photo-url-' + size()];
                        }
                    } else if (last) { // last
                        if (uneven) { // last and uneven
                            count = 0;
                            addClass(image, 'broad');
                            im = ei[i]['photo-url-' + size()];
                        } else { // last and even
                            count = 0;
                        }
                    }
                }
                image.src = im;
                addLoadedImg(image);
                image.alt = 'extra-image';
                e.appendChild(image);
            }
        }
        function renderImage(e, o) {
            var i = o.images;
            if (i && i.length) {
                var src = i[1]['source'];
                if (e.tagName === 'IMG') {
                    // set img resources
                    e.src = src;
                } else {
                    // add child img
                    var img = document.createElement("img");
                    img.src = src;
                    e.appendChild(img);
                }
            }
        }
        function renderReblogButton(e, o) {
            e.innerHTML = o['reblog-button'];
        }
        function renderTags(e, o) {
            var s = '';
            var tags = o.tags || [];
            for (var i = 0; i < tags.length; i++) {
                var tag = tags[i];
                s += '<li>' + tag + '</li>';
            }
            e.innerHTML = s;
        }
        function renderConversation(e, o) {
            var s = '';
            var c = o.conversation || [];
            for (var i = 0; i < c.length; i++) {
                var con = c[i];
                s += '<li class="conversation"><span class="name">' + con.name + '</span>';
                s += '<span class="phrase">' + con.phrase + '</span></li>';
            }
            e.innerHTML = s;
        }
        function renderAudio(e, o) {
            if (!o.audio) return;

            e.innerHTML = o.audio.embed;
        }
        function renderVideo(e, o) {
            if (!o.video) return;

            e.innerHTML = o.video.embed;
        }
        function parseRegular(e, o) {
            if (o.type !== 'regular') {
                e.parentNode.removeChild(e);
            }
        }
        function parseVideo(e, o) {
            if (o.type !== 'video') {
                e.parentNode.removeChild(e);
            }
        }
        function parseConversation(e, o) {
            if (o.type !== 'conversation') {
                e.parentNode.removeChild(e);
            }
        }
        function parseAudio(e, o) {
            if (o.type !== 'audio') {
                e.parentNode.removeChild(e);
            }
        }
        function parseQuote(e, o) {
            if (o.type !== 'quote') {
                e.parentNode.removeChild(e);
            }
        }
        function parseLink(e, o) {
            if (o.type !== 'link') {
                e.parentNode.removeChild(e);
            }
        }
        function parseImages(e, o) {
            if (o.type !== 'photo') {
                e.parentNode.removeChild(e);
            }
        }
        function parseSingle(e, o) {
            if (!isPost()) {
                e.parentNode.removeChild(e);
            }
        }
        function parseMulti(e, o) {
            if (isPost()) {
                e.parentNode.removeChild(e);
            }
        }

        /* ###################################################################
            OBJECT TO POST PARSERS
        ################################################################### */
        function parseImage(obj) {
            if (obj.type === 'regular') {
                obj = getRegularObject(obj);
            } else if (obj.type === 'photo') {
                obj = getPhotoObject(obj);
            } else if (obj.type === 'link') {
                obj = getLinkObject(obj);
            } else if (obj.type === 'quote') {
                obj = getQuoteObject(obj);
            } else if (obj.type === 'conversation') {
                obj = getConversationObject(obj);
            } else if (obj.type === 'audio') {
                obj = getAudioObject(obj);
            } else if (obj.type === 'video') {
                obj = getVideoObject(obj);
            } else {
                console.warn('Unsupported tumblr type:' + obj.type);
            }

            var t = template;

            // update all values
            t = updateValueParametersInElement(t, obj);

            // create a html element from the string
            t = elementFromString(t);
            updateResourcesInElement(t, obj);
            return t;
        }
    }
}