
try {
    
    var TextSE = "[^<]+";
    var UntilHyphen = "[^-]*-";
    var Until2Hyphens = UntilHyphen + "([^-]" + UntilHyphen + ")*-";
    var CommentCE = Until2Hyphens + ">?";
    var UntilRSBs = "[^]]*]([^]]+])*]+";
    var CDATA_CE = UntilRSBs + "([^]>]" + UntilRSBs + ")*>";
    var S = "[ \\n\\t\\r]+";
    var NameStrt = "[A-Za-z_:]|[^\\x00-\\x7F]";
    var NameChar = "[A-Za-z0-9_:.-]|[^\\x00-\\x7F]";
    var Name = "(" + NameStrt + ")(" + NameChar + ")*";
    var QuoteSE = '"[^"]' + "*" + '"' + "|'[^']*'";
    var DT_IdentSE = S + Name + "(" + S + "(" + Name + "|" + QuoteSE + "))*";
    var MarkupDeclCE = "([^]\"'><]+|" + QuoteSE + ")*>";
    var S1 = "[\\n\\r\\t ]";
    var UntilQMs = "[^?]*\\?+";
    var PI_Tail = "\\?>|" + S1 + UntilQMs + "([^>?]" + UntilQMs + ")*>";
    var DT_ItemSE = "<(!(--" + Until2Hyphens + ">|[^-]" + MarkupDeclCE + ")|\\?" + Name + "(" + PI_Tail + "))|%" + Name + ";|" + S;
    var DocTypeCE = DT_IdentSE + "(" + S + ")?(\\[(" + DT_ItemSE + ")*](" + S + ")?)?>?";
    var DeclCE = "--(" + CommentCE + ")?|\\[CDATA\\[(" + CDATA_CE + ")?|DOCTYPE(" + DocTypeCE + ")?";
    var PI_CE = Name + "(" + PI_Tail + ")?";
    var EndTagCE = Name + "(" + S + ")?>?";
    var AttValSE = '"[^<"]' + "*" + '"' + "|'[^<']*'";
    var ElemTagCE = Name + "(" + S + Name + "(" + S + ")?=(" + S + ")?(" + AttValSE + "))*(" + S + ")?/?>?";
    var MarkupSPE = "<(!(" + DeclCE + ")?|\\?(" + PI_CE + ")?|/(" + EndTagCE + ")?|(" + ElemTagCE + ")?)";
    var XML_SPE = TextSE + "|" + MarkupSPE;

    function ShallowParse(XMLdoc) {
      return XMLdoc.match(new RegExp(XML_SPE, "g"));
    }
    
    function parseAtomFeed(text) {
        postMessage({ debug: 'start parsing' });    

        var matches = ShallowParse(text);

        var cnt = 0;
        var title = false;
        var content = false;
        var updated = false;
        var obj = false;
        
        matches.forEach(function(item, index, array) {
            if(item == '<entry>') obj = {};

            if(item.indexOf('<link href=') > -1) {
                obj.link = /href\=\"(.*)\"/.exec(item)[1];
            }
            
            if(item == '<title>') title = true;
            if(item == '</title>') title = false;
            if(title) obj.title = item;
            if(item == '<content type="html">') content = true;
            if(item == '</content>') content = false;
            if(content) obj.content = item;
            if(item == '<updated>') updated = true;
            if(item == '</updated>') updated = false;
            if(updated) obj.updated = item;

            if(item == '</entry>') {
                postMessage({ result: obj });
            }
        }); 
        // xmlDoc = parser.parseFromString(text,"text/xml");
        // postMessage(xmlDoc);    
        postMessage({ done: 1 });    
        postMessage({ debug: 'end parsing' });    
    }

    var client = new XMLHttpRequest();
    client.open('GET', '/atom.xml', true);
    client.setRequestHeader("Content-Type","text/xml; charset=utf-8");
    client.send();
    client.onreadystatechange = function() {
        if(this.readyState == 4) {
            postMessage({ debug: 'feed loaded' });
            parseAtomFeed(this.responseText);    
        }
    };
} catch(e) {
    postMessage({ error : e });    
}


onmessage = function(e){
    postMessage({ debug: 'received: ' + e.data });    
};