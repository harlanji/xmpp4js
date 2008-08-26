Xmpp4Js.Lang.namespace( "Xmpp4Js.Muc" );

/**
 * Represents a conference room.
 * @constructor
 */
Xmpp4Js.Muc.MucRoom = function(mucMan, roomJid, name) {
    
    this.mucMan = mucMan;
    this.roomJid = roomJid;
    this.name = name;
}

Xmpp4Js.Muc.MucRoom.prototype = {
    getRoomJid : function() {
        return this.roomJid;
    },
    createState : function() {
        var room = new Xmpp4Js.Muc.StatefulMucRoom(this);
        return room;
    },
    _getMucManager : function() {
        return this.mucMan;
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Muc.MucRoom, Xmpp4Js.Event.EventProvider, Xmpp4Js.Muc.MucRoom.prototype);
