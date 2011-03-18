CWS = new function() {
	this.NS = 'CWS';
	var _drFunctions = [];
};

CWS.GoogleAnalytics = new function() {
	this.NS = 'CWS.GoogleAnalytics';
	var _t = 200;
	
	var _checkTracker = function() {
		if(window._gat !== undefined) {
		    try {
			    var pageTracker = window._gat._getTracker("UA-6910480-1");
			    pageTracker._trackPageview();
		    } catch(err) {}
		} else {
			window.setTimeout(_checkTracker, _t);			
		}
	};
	
    var gaJsHost = (("https:" == document.location.protocol) ? 'https://ssl.' : 'http://www.');
	var str = unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E");
	$('body').append(str);

	window.setTimeout(_checkTracker, _t);
};

CWS.CodeHighlight = new function() {
	if(hljs) {
		hljs.tabReplace = ' ';
		hljs.initHighlightingOnLoad();

		$(document).ready(function() {
			$('body.article pre').wrap('<div class="codeblock" />');
		});
	}
};

CWS.DeliciousFeed = new function() {
    var Store = window.sessionStorage || false;
    var _self = this;
    
    this.generateList = function(data) {
        if(Store && JSON && !Store.getItem('delicious')) {
            Store.setItem('delicious', JSON.stringify(data));
        }

        var box = $('<div class="box links"><h2><a href="http://delicious.com/contentwithstyle/">Elsewhere</a></h2><ul></ul></div>');
        
        for(i=0; i<data.length; i++) {
            var li = $('<li><a href="'+data[i].u+'">'+data[i].d+'</a></li>');
            $('ul', box).append(li);
        }
        
        $('ul li:even', box).addClass('even');
        $('ul li:odd', box).addClass('odd');
        $('ul li:last', box).addClass('last');
        
        $(box).appendTo('.sidebar').css('opacity', 0).animate({'opacity': 1}, 500);
    };
    
	$(document).ready(function() {
	    if(!$('.date.box').length) {
	        if(Store && JSON && Store.getItem('delicious')) {
                _self.generateList(JSON.parse(Store.getItem('delicious')));
                return;
            }
        
    	    var url = 'http://feeds.delicious.com/v2/json/contentwithstyle?count=10&callback=CWS.DeliciousFeed.generateList';
            $('body').append('<script src="'+url+'" type="application/javascript"></script>');
	    }
	});                  
};