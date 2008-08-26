Xmpp4Js.Lang.namespace( "Xmpp4Js.Ext" );

/**
 * @constructor
 * @extends Xmpp4Js.Ext.PacketExtension
 */
Xmpp4Js.Ext.MucUser = function(stanza) {
    Xmpp4Js.Ext.MucUser.superclass.constructor.call( this, stanza );
}

Xmpp4Js.Ext.MucUser.XMLNS = "http://jabber.org/protocol/muc#user";

Xmpp4Js.Ext.MucUser.prototype = {
    getElementNS : function() {
        return Xmpp4Js.Ext.MucUser.XMLNS;
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Ext.MucUser, Xmpp4Js.Ext.PacketExtension, Xmpp4Js.Ext.MucUser.prototype);
