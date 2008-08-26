Xmpp4Js.Lang.namespace( "Xmpp4Js.Packet" );

/**
 * @constructor
 * @extends Xmpp4Js.Packet.IQ
 */
Xmpp4Js.Packet.RosterPacket = function( node ) {
    Xmpp4Js.Packet.RosterPacket.superclass.constructor.call( this, null, "set", "jabber:iq:roster" );
}


Xmpp4Js.Packet.RosterPacket.prototype = {
    addItem: function( jid, alias, groups, subscription ) {
        var doc = Xmpp4Js.Packet.getDocument();
        
        this.setId( "roster_add" ); 
    
        var query = this.getQuery();
        var item = query.appendChild( doc.createElement( "item" ) );
        item.setAttribute( "xmlns", "jabber:iq:roster" );
        item.setAttribute( "jid", jid );
        
        if( subscription ) {
            item.setAttribute( "subscription", subscription );
        }
        
        if( alias ) {
            item.setAttribute( "alias", alias );
        }
        
        if( groups ) {
            for( var i = 0; i < groups.length; i++ ) {
                var group = groups[i];
                var groupNode = item.appendChild( doc.createElement( "group" ) );
                groupNode.setAttribute( "xmlns", "jabber:iq:roster" );
                groupNode.setTextContent( group );
            }   
        }
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Packet.RosterPacket, Xmpp4Js.Packet.IQ, Xmpp4Js.Packet.RosterPacket.prototype );


// TODO create a test...
function RosterPacketProvider( stanzaNode ) {
    // if it's not an IQ node, we don't care.
    if( !Xmpp4Js.Packet.StanzaProvider.IQProvider( stanzaNode ) ) {
        return false;
    }
    var queryNode = stanzaNode.getElementsByTagName("query" ).item(0);
    return queryNode != undefined && queryNode.namespaceURI == "jabber:iq:roster";
}
