Xmpp4Js.Lang.namespace( "Xmpp4Js.Muc" );

/**
 * @constructor
 * @extends Xmpp4Js.Muc.MucRoom
 */
Xmpp4Js.Muc.StatefulMucRoom = function(mucRoom) {
    // copy properties from 'super' room
    this.mucMan = mucRoom.mucMan;
    this.roomJid = mucRoom.roomJid;
    this.name = mucRoom.name;
    
    this._myNick = null; 
    
    
    this.addEvents({
        /**
         * Some user, including self, has entered the room. see participant.isSelf.
         * @event join
         * @param {StatefulXmpp4Js.Muc.MucRoom} room
         * @param {Xmpp4Js.Muc.MucParticipant} participant
         * @param {Xmpp4Js.Packet.Message} packet
         */
        join : true,
        /**
         * There was an error of some sort, possibly a kick or ban.
         * @event join
         * @param {StatefulXmpp4Js.Muc.MucRoom} room
         * @param {Xmpp4Js.Muc.MucParticipant} participant
         * @param {Xmpp4Js.Packet.Message} packet
         */
        error : true,
        /**
         * Some user, including self, has left the room. see participant.isSelf.
         * @event part
         * @param {StatefulXmpp4Js.Muc.MucRoom} room
         * @param {Xmpp4Js.Muc.MucParticipant} participant
         * @param {Xmpp4Js.Packet.Message} packet
         */
        part : true
    });
}

Xmpp4Js.Muc.StatefulMucRoom.prototype = {
    /**
     * @param cb A function which takes MucRoom and [ Xmpp4Js.Muc.MucParticipant ] params.
     */
    getParticipants : function(cb) {
        //return [ new Xmpp4Js.Muc.MucParticipant( this, "romeo", "romeo@somewhere.com"), new Xmpp4Js.Muc.MucParticipant( this, "juliet", "julietz0r@somewhere-e;se.com") ];
        if( !this.isJoined() ) {
            throw new Xmpp4Js.Muc.MucError( "Not in a room" );
        }
    
        var discoMan = this._getMucManager()._getConnection().getServiceDisco();
        
        var self = this; 
        discoMan.discoverItems( this.roomJid, function(roomJid, items) {
            var participants = [];
            for( var i = 0; i < items.length; i++ ) {
                var item = items[i];
                
                var realJid = undefined;
                var p = new Xmpp4Js.Muc.MucParticipant( self, item.jid, realJid );
                participants.push( p );
            }
            
            cb( self, participants );
        } ); 
    },
    join : function( nick, password ) {
        if( this.isJoined() ) {
            this.part();
        }
        this._myNick = nick;
        
        var pres = this._createPresence("available");
        var mucExt = pres.getExtension( Xmpp4Js.Ext.Muc.XMLNS );
        
        if( password ) {
            mucExt.setPassword( password );
        }

        var con = this._getMucManager()._getConnection();
        
        con.send( pres, function(packet) {
            var extProvider = this._getMucManager()._getExtManager();
            packet.loadExtensions( extProvider );

            var event = "join";
            if( packet.getExtension(Xmpp4Js.Ext.Error.XMLNS) != undefined ) {
                event = "error";
            }
            this.fireEvent( event, this, /* participant */null, packet );

        }.bind(this));
    },
    /**
     * FIXME - this should use the table of participant presence
     *         to determine who the current user is (status 110).
     */
    part : function() {
        var pres = this._createPresence("unavailable");

        var con = this._getMucManager()._getConnection();
        
        con.send( pres, function(packet) {
            this.fireEvent( "part", this, /* participant */null, packet );
            this._myNick = undefined;
        }.bind(this));
    },
    sendMessage : function( msg ) {
        msg.setType( "groupchat" );
        msg.setTo( this.getRoomJid() );
        
        var con = this._getMucManager()._getConnection();
        con.send( msg );
    },
    sendText : function( text ) {
        var msg = new Xmpp4Js.Packet.Message( this.getRoomJid(), "groupchat", text );
        this.sendMessage( msg );
    },
    isJoined : function() {
        return this._myNick ? true : false;
    },
    createPrivateChat : function( toNick ) { 
    
    },
    _createPresence : function(type) {
        var nickJid = this.getRoomJid() + "/" + this._myNick;
        var pres = new Xmpp4Js.Packet.Presence( type, nickJid );
        
        var extProvider = this._getMucManager()._getExtManager();
        var mucExt = extProvider.create( Xmpp4Js.Ext.Muc.XMLNS, pres );
        
        return pres;
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Muc.StatefulMucRoom, Xmpp4Js.Muc.MucRoom, Xmpp4Js.Muc.StatefulMucRoom.prototype);
