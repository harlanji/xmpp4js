Xmpp4Js.Lang.namespace( "Xmpp4Js.Muc" );

/**
 * A filter that looks for MUC presence for a given JID or all JIDs
 * @param fromJid optional, the JID to filter for. No jid captures all packets.
 * @constructor
 * @extends Xmpp4Js.PacketFilter.PacketFilter
 */
Xmpp4Js.Muc.MucPresenceFilter = function(fromJid) {
    this.fromJid = fromJid;
    
    this.presenceFilter = new Xmpp4Js.PacketFilter.PacketClassFilter( Xmpp4Js.Packet.Presence ); 
    if(fromJid != undefined) {
        this.fromFilter = new Xmpp4Js.PacketFilter.FromContainsFilter(fromJid);
    }
}

Xmpp4Js.Muc.MucPresenceFilter.prototype = {
    accept : function(packet) {
        // if this is not a Presence packet, GTFO
        if( !this.presenceFilter.accept(packet) ) {
            return false;
        }
        
        // if we are looking only at a specific room/occupant and this packet is 
        // not from that room, then gtfo.
        if( this.fromJid != undefined && packet.getFrom().indexOf(this.fromJid) == -1 ) {
            return false;
        }
        
        // if this element contains a muc user extension
        // TODO ideally this would load real packet extensions, but...
        var elements = packet.getNode().childNodes;
        for( var i = 0; i < elements.getLength(); i++ ) {
            var elem = elements.item(i);

            // namespace matches.
            if( elem.namespaceURI == "http://jabber.org/protocol/muc#user" ) {
                return true;
            }
        }
        
        return false;
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Muc.MucPresenceFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.Muc.MucPresenceFilter.prototype);
