Xmpp4Js.Lang.namespace( "Xmpp4Js.Packet" );

/**
 * Constructs an IQ packet if the PacketBase constructor doesn't
 * handle it.
 * 
 * @constructor
 * @extends Xmpp4Js.Packet.Base
 * @param {String} to
 * @param {String} type
 * @param {String} queryNS
 */
Xmpp4Js.Packet.IQ = function( to, type, queryNS ) {

    var doc = Xmpp4Js.Packet.getDocument();
    
    var node = doc.createElement( "iq" );
    Xmpp4Js.Packet.IQ.superclass.constructor.call( this, node );
    
    if( to ) { this.setTo( to ); }
    if( type ) { this.setType( type ); }
    if( queryNS ) {
        var query =  this.getNode().appendChild( doc.createElement( "query" ) );
        query.setAttribute( "xmlns",  queryNS );
    }
}

Xmpp4Js.Packet.IQ.prototype = {
    
    setQuery : function( elem ) {
        // TODO check elem
        this.elem.appendChild( elem );
    },
    getQuery : function() {
        var elem = this.elem.getElementsByTagName("query").item(0);
        return elem;
    },
    
    /** @deprecated */
    getQueryXMLNS : function() {
        var query = this.getQuery();
        return query ? query.getAttribute("xmlns").toString() : "";
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Packet.IQ, Xmpp4Js.Packet.Base, Xmpp4Js.Packet.IQ.prototype);
