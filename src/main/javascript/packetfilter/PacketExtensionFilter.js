Xmpp4Js.Lang.namespace( "Xmpp4Js.PacketFilter" );

/**
 * @constructor
 * @extends Xmpp4Js.PacketFilter.PacketFilter
 */
Xmpp4Js.PacketFilter.ExtensionFilter = function(extensionNS) {
    Xmpp4Js.PacketFilter.ExtensionFilter.superclass.constructor.apply(this, arguments);
    
    this.extensionNS = extensionNS;
}

Xmpp4Js.PacketFilter.ExtensionFilter.prototype = {
    accept: function(packet) {
        // rather than loading extensions for all packets, we will
        // just check child element namespaces.
        var node = packet.getNode();
        
        for( var i = 0; i < node.childNodes.getLength(); i++ ) {
            if( node.childNodes.item(i).namespaceURI == this.extensionNS ) {
                return true;
            }
        }
    }
}

Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.ExtensionFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.PacketFilter.ExtensionFilter.prototype);

