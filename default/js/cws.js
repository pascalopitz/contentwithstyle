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

CWS.Search = new function() {
    if(!window.Worker || !window.XMLHttpRequest || !window.openDatabase || !window.localStorage) {
        // console.log('not supported');
        return false;
    }

    var Store = window.localStorage;
    var db = openDatabase('atom_search', '1.0', 'indexed atom search', 2 * 1024 * 1024);

    var client = new XMLHttpRequest();
    client.open('HEAD', '/atom.xml', true);
    client.setRequestHeader("Content-Type","text/xml; charset=utf-8");
    client.send();
    client.onreadystatechange = function() {
        if(this.readyState == 2) {
            var lastModified = this.getResponseHeader('Last-Modified');
            var storeModified = Store.getItem('Atom-Last-Modified');
            
            if(storeModified && storeModified == lastModified) {
                enableSearchForm();
                return false;
            }
            
            Store.setItem('Atom-Last-Modified', lastModified); 
            db.transaction(function (tx) {
                tx.executeSql('CREATE TABLE IF NOT EXISTS atom (link, title, content, updated)');
                tx.executeSql('DELETE FROM atom');
            });

            var indexer = new Worker('/default/js/search_indexer.js');
            indexer.onmessage = function(e) {
                if(e.data.result) {
                    var obj = e.data.result;
                    db.transaction(function (tx) {
                        var sql = 'INSERT INTO atom (link, title, content, updated) VALUES ("'+obj.link+'", "'+obj.title+'", "'+obj.content+'", "'+obj.updated+'")';
                        tx.executeSql(sql);
                    });
                } else if(e.data.done) {
                    // console.log('done', e.data);
                    enableSearchForm();
                } else if(e.error) {
                    // console.log('error', e.data);
                    Store.removeItem('Atom-Last-Modified'); 
                } else {
                    // console.log('debug', e.data);
                }
            };
        }
    };
    
    function renderResults(results) {
        $('.main-col').css('opacity', .2);
        
        var str = '';

        if(results.length == 0) {
            str = '<div class="article"><h2>No results</h2></div>';
        } else {
            if(results.length == 1) {
                str += '<p>1 Result</p>';
            } else {
                str += '<p>'+results.length+' Results</p>';
            }
            
            for(i=0; i<results.length; i++) {
                str += '<div class="article">';
                str += '<h2><a href="'+results[i].link+'">' + results[i].title + '</a></h2>';
                str += '<p class="links clearfix">';
                str +='<a href="'+results[i].link+'" class="article-link">Read Article</a>';
                str += '</p>';
                str += '</div>';
            }
        }
        
        $('.main-col').html(str).css('opacity', 1);
    };
    
    function enableSearchForm() {
        $.get('/search.html', function(data) {
            var form = $(data);
            $('.header').append(form);
            $(form).bind('submit', function() {
                var val = $(form).find('input[type=text]').val();
                if(val) {
                    var results = [];
                    
                    db.transaction(function (tx) {
                        val = val.replace(';', '');
                        tx.executeSql("SELECT link, title, content FROM atom WHERE title LIKE '%"+val+"%' OR content LIKE '%"+val+"%'", [], function(tx, rs) {
                            for(i=0; i<rs.rows.length; i++) {
                                results.push(rs.rows.item(i));
                            }
                            renderResults(results);
                        });
                    });
                }
                return false;
            });
        });
    }
};