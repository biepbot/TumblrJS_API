# TumblrJS_API
The Tumblr API V1 worked out in a JavaScript object to make life easier

# Summary of features
This script offers the following advantages in comparison to the default Tumblr API v1:
- the use of templates to generate posts
- use of variable sizes for posts
- switching blogs easily
- filtering on types
- filtering on 0-x tags
- synchronous loading
- callback on double posts / new posts
- callback on loading, errors, cache exceeded
- loading in advance to speed up the blog

# Installation
Add as javascript file to your page:
```
	<head>
        	<script src="js/tumblr.js?v=1.14" type="text/javascript"></script>
    	</head>
```

## Usage
After adding, you are able to use the `_t` to create a Tumblr JS API object.
Populate it as following:
```
	var tumblrAPI = _t({
		'blog': 'demo',
        	'template': <url, element OR string>
        });
        
        tumblrAPI.settings = {
            'reblogs' : true,
            'submissions' : true
        };
```
Take note that this library is not built to have multiple instances of this object, so it is best to have it globally defined, either in the window, your universal script, your universal object, etc.

Below follows a more detailed explanation to the usage of this Tumblr JS API object.
See "object callbacks" for a detailed usage of the object, or check out the sample.html page

# Interface options
## Object variables
-  `blog`            
	"biepbot"
-  `template`        
	"/template/tumblr.html", element, or string
-  `type`            
	"photo", "audio", "conversation", "regular"... etc or null for all
-  `preventDuplicates`
	Prevents duplicates of the same image. Ieg reblogs or similar, does NOT look at replies. Defaults to false

Creating the Tumble API object:
```
	var tumblrAPI = _t({
		'blog': 'demo',
        'template': document.getElementById('template').children[0]
        });
```


## Settings variables
-  `postID`          
	id of a post to load (either defined or -1), loads a single image
-  `thumbsize`       
	default preview image size, defaults to 400px
-  `reblogs`		   
	defaults to false
-  `submissions`	   
	defaults to false

Adjusting or setting settings:
```
	tumblrAPI.settings = {
            'reblogs' : true,
            'submissions' : true
    };
```

## Object callables:
-  `load(amount)`
-  `getFilters()` -> gets all usable filters (you can add new ones using `addFilter(...)`)
-  `getEvents()` -> gets all currently in use events (by your code)
-  `setBlog(blog)`
-  `filter(filters)`
-  `getCache(<parameter>)` -> ieg `loaded-images` for browsing ALL IMAGES ON PAGE
-  `loadNewPost`
	loads the first post of the blog and appends it before

## Object callbacks
'on' is optional
-  `oninit`
	when the tumblr api finished loading its essentials
-  `onafterload`
	when a post has been loaded
-  `onbeforeload`
	when the user queried a search
-  `onerror`
	on errors (template loading, blog fetching, etc)
-  `ondouble`
	when a new post has been made while something has been searched
-  `onstop`
	when the blog has reached the end, and has no more posts to display
-  `onduplicate`
	used in combination with preventDuplicates. Will be called if there's a duplicate entry

Set up event listeners for these callbacks;
```
        // Set up event listeners
        tumblrAPI.addEventListener('afterload', afterload);
        tumblrAPI.addEventListener('stop', end);
        tumblrAPI.load(5);

		// get the id of the object you want to insert before
        var o = document.getElementById('loader');

		// loadmore function for buttons
        function loadmore() {
            tumblrAPI.load(5);
        }

        function end() {
            o.parentNode.removeChild(o);
        }
		
        function afterload(html) {
            var content = document.body;
            if (html instanceof Array) {
                for (var h in html) {
                    content.insertBefore(html[h], o);
                }
            } else {
                content.insertBefore(html, o);
            }
        }
```

# Template parameters
Template parameters are usable within the template HTML file / element / string
surround these with `_T(<parameter>)`

## Id parameters
parameters that should be embedded in the "id=''" of an element

- `IMAGE`       
	base image
	on img; generate src + alt
	on div; generate `<img/>` + src + alt
- `IMAGES`      
	all other images
	*DIV ONLY*
- `TAGS`        
	generates `<li>` filled with tags
	*UL ONLY*
- `REBLOG_BUTTON`
	generates a reblog button
- `CONVERSATION`  
	generates `<li>` filled with conversation details
- `VIDEO`         
	generates a video embed

Usage:
```

	<div id="_T(VIDEO)"><!-- video player will embed here--></div>
	<ul id="_T(TAGS)"><!-- li's with tags will be here --></ul>

```

## General variables
- `ID`          
	id for the post (used for double posts)
- `REBLOG`      
	url for reblogging
- `BLOG`        
	returns blog name
- `NOTES`       
	returns notes amount (includes 'note/s')
- `NICENOTES`   
	returns notes amount (includes 'note/s', dots/commas)
- `DESCRIPTION`
	returns content
- `TYPE`        
	type of post (image, text, video, etc)
- `DATE`        
	returns the date of the post (GMT)
- `NICEDATE`    
	returns the date of a post, to a nicer format
	
Usage:
```
	<div id="_T(ID)">
		<h3>_T(TITLE)</h3>
		_T(BODY)
		<p>posted at _T(NICEDATE)</p>
	</div>
	
```
	
## Link OR regular post related variables
- `URL`         
	returns the url for a LINK post
- `BODY`        
	returns the body (LINK description OR REGULAR body)
- `TITLE`       
	returns the title (LINK text OR REGULAR title)
	
## Video post related variables
- `ARTIST`      
	returns the artist of a song
- `YEAR`        
	returns the year of a song
- `ALBUM`       
	returns the album of a song
- `PLAYS`       
	returns the amount of plays of a song
- `NICEPLAYS`   
	returns the amount of plays of a song, to a nicer format

## id removal parameters 
- `SINGLE-POST-ONLY`  
	only shows this element if it's a single element post
- `MULTI-POST-ONLY`   
	only shows this element if more posts are loaded
- `<type>-POST-ONLY`  
	only shows this element if it's of the specified type
accepted types:
- `PHOTO` 
- `LINK` 
- `REGULAR` 
- `QUOTE` 
- `CONVERSATION` 
- `AUDIO`

