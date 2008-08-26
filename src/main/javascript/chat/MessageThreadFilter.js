Xmpp4Js.Lang.namespace( "Xmpp4Js.Chat" );

/**
* @class Filters for message packets with a particular thread value.
* @constructor
* @param {String} thread The thread ID to filter incoming Message packets for.
*/
Xmpp4Js.Chat.MessageThreadFilter = function(thread) {
    /** @private @type String */
    this.thread = thread;
    /** A filter for Message packets 
     * @private 
     * @type Xmpp4Js.PacketFilter.PacketClassFilter 
     */
    this.packetClassFilter = new Xmpp4Js.PacketFilter.PacketClassFilter( Xmpp4Js.Packet.Message );
}

Xmpp4Js.Chat.MessageThreadFilter.prototype = {
    /**
     * Return true if this is a Message packet and its thread equals the one we're interested in.
     */
    accept: function(stanza) {
        return this.packetClassFilter.accept(stanza)
        && stanza.getThread() == this.thread;
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Chat.MessageThreadFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.Chat.MessageThreadFilter.prototype );
