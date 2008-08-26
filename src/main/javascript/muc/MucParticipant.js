Xmpp4Js.Lang.namespace( "Xmpp4Js.Muc" );

/**
 * Represents a participant in a conference room.
 * @constructor
 */
Xmpp4Js.Muc.MucParticipant = function(room, confJid, realJid) {
    this.room = room;
    this.confJid = confJid;
    this.realJid = realJid;
    
    this.status = [];
}

/**
 * http://www.xmpp.org/extensions/xep-0045.html#registrar-statuscodes
 */
Xmpp4Js.Muc.MucParticipant.Status = {
    VISIBLE_JID: "100",
    ENTER_ROOM: "201",
    SELF: "110",
    CHANGED_NICK: "210"
}

Xmpp4Js.Muc.MucParticipant.prototype = {
    getNick : function() {
        return this.confJid.getResource();
    },
    getRealJid : function() {
        return this.realJid;
    },
    getConfJid : function() {
        return this.confJid;
    },
    /**
     * Returns an array of status codes
     */
    getStatus : function() {
        return this.status;
    },
    
    /**
     * Returns whether the participant is self.
     */
    isSelf : function() {
        var status = this.getStatus();
        for( var k in status ) {
            var s = status[k];
            if(s == Xmpp4Js.Muc.MucParticipant.Status.SELF) { return true; }
        }
        
        return false;
    },
    
    _getMucManager : function() {
        return this.room._getMucManager();
    }
}
