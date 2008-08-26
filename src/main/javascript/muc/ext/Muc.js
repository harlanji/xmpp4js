Xmpp4Js.Lang.namespace( "Xmpp4Js.Ext" );
/**
 * @constructor
 * @extends Xmpp4Js.Ext.PacketExtension
 */
Xmpp4Js.Ext.Muc = function(stanza) {
    Xmpp4Js.Ext.Muc.superclass.constructor.call( this, stanza );
}

Xmpp4Js.Ext.Muc.XMLNS = "http://jabber.org/protocol/muc";

Xmpp4Js.Ext.Muc.prototype = {
    getElementNS : function() {
        return Xmpp4Js.Ext.Muc.XMLNS;
    },
    
    setPassword : function(password) {
        throw new Error( "TODO implement" );
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Ext.Muc, Xmpp4Js.Ext.PacketExtension, Xmpp4Js.Ext.Muc.prototype);
