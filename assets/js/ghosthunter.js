/**
  * ghostHunter - This is an edited version of the plugin made by Aspire Themes
  * Copyright (C) 2014 Jamal Neufeld (jamal@i11u.me)
  * MIT Licensed
  * @license
 **/

(function( $ ) {

	//This is the main plugin definition
	$.fn.ghostHunter 	= function( options ) {

		//Here we use jQuery's extend to set default values if they weren't set by the user
    var opts 		= $.extend( {}, $.fn.ghostHunter.defaults, options );

		if ( opts.results )
		{
			pluginMethods.init( this , opts );
			return pluginMethods;
		}
	};

	$.fn.ghostHunter.defaults = {
		resultsData			: false,
		onPageLoad			: false,
		onKeyUp				: false,
		result_template 	: "<a href='{{link}}'><h2>{{title}}</h2></a>",
		info_template		: "<p>Number of posts found: {{amount}}</p>",
		displaySearchInfo	: true,
		zeroResultsInfo		: true,
		before				: false,
		onComplete			: false,
		filterfields		: false
  };

	var prettyDate = function(date) {
    var d = new Date(date);

    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var date  = d.toUTCString().substr(5, 2),
        month = monthNames[d.getMonth()].substr(0, 3),
        year  = d.getFullYear();

		return date + ' ' + month + ' ' + year;
	};

	var pluginMethods	= {
		isInit : false,
		init : function( target , opts ){
			var that				= this;
			this.target				= target;
			this.results			= opts.results;
			this.blogData			= {};
			this.result_template	= opts.result_template;
			this.info_template		= opts.info_template;
			this.zeroResultsInfo	= opts.zeroResultsInfo;
			this.displaySearchInfo	= opts.displaySearchInfo;
			this.before				= opts.before;
			this.onComplete			= opts.onComplete;
			this.filterfields		= opts.filterfields;

			// This is where we'll build the index for later searching. It's not a big deal to build it on every load as it takes almost no space without data
			this.index = lunr(function () {
        this.use(lunr.multiLanguage('en', 'ru', 'fr', 'de', 'es', 'pt', 'it', 'fi', 'nl', 'da'));
        this.ref('id');
        this.field('title', {boost: 10});
        this.field('plaintext', {boost: 5});
        this.field('pubDate');
				this.field('link');
			});

			if ( opts.onPageLoad ) {
				function miam () {
					that.loadAPI();
				}
				window.setTimeout(miam, 1);
			} else {
				target.focus(function(){
					that.loadAPI();
				});
			}

			target.closest("form").submit(function(e){
				e.preventDefault();
				that.find(target.val());
			});

			if( opts.onKeyUp ) {
				target.keyup(function() {
					that.find(target.val());
				});
			}
		},

		loadAPI : function() {
			if(this.isInit) return false;

      /*
        Here we load all of the blog posts to the index.
        This function will not call on load to avoid unnecessary heavy
        operations on a page if a visitor never ends up searching anything.
      */

			var index = this.index,
        blogData = this.blogData;

        var url = site_url + "/bluedot/api/v4/content/posts/?key=" + search_api_key + "&limit=all&fields=id,title,url,published_at,feature_image&formats=plaintext";

      $.get(url).done(function(data) {
        searchData = data.posts;
				searchData.forEach(function(arrayItem) {
					var parsedData 	= {
						id: String(arrayItem.id),
            title: String(arrayItem.title),
            plaintext: String(arrayItem.plaintext),
            pubDate: String(arrayItem.published_at),
            link: String(arrayItem.url),
            featureImage: String(arrayItem.feature_image)
          }

					var prettyPubDate = prettyDate(parsedData.pubDate);
					index.add(parsedData)
					blogData[arrayItem.id] = {title: arrayItem.title, pubDate: prettyPubDate, link: arrayItem.url, featureImage: arrayItem.feature_image};
				});
      });
			this.isInit = true;
		},

		find: function(value) {
			var searchResult = this.index.search(value);
			var results = $(this.results);
			var resultsData = [];
			results.empty();

			if(this.before) {
				this.before();
			};

			if(this.zeroResultsInfo || searchResult.length > 0) {
				if(this.displaySearchInfo) results.append(this.format(this.info_template,{"amount":searchResult.length}));
			}

			for (var i = 0; i < searchResult.length; i++) {
				var lunrref		= searchResult[i].ref;
				var postData  	= this.blogData[lunrref];
				results.append(this.format(this.result_template,postData));
				resultsData.push(postData);
			}

			if(this.onComplete) {
				this.onComplete(resultsData);
			};
		},

		clear : function() {
			$(this.results).empty();
			this.target.val("");
		},

		format : function (t, d) {
			return t.replace(/{{([^{}]*)}}/g, function (a, b) {
				var r = d[b];
				return typeof r === 'string' || typeof r === 'number' ? r : a;
			});
		}
	}

})( jQuery );