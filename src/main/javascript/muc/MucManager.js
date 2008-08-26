Xmpp4Js.Lang.namespace( "Xmpp4Js.Muc" );

/**
 * Responsible for MUC operations on a particular node
 * @constructor
 */
Xmpp4Js.Muc.MucManager = function(con, node, extProvider) {
    this.con = con;
    this.node = node;
    this.extProvider = extProvider;
    
    this.con.addPacketListener( );
    
    this.addEvents({
        /**
         * Some participant in some room was updated
         * @event participantupdated
         * @param participant {Xmpp4Js.Muc.MucParticipant}
         */
        participantupdated : true
    });
}

Xmpp4Js.Muc.MucManager.getInstanceFor = function( con, node, extProvider ) {
    if(con._mucManager == undefined) { con._mucManager = {}; }
    
    if( con._mucManager[node] == null ) {
        con._mucManager[node] = new Xmpp4Js.Muc.MucManager( con, node, extProvider );
    }
    
    return con._mucManager[node];
}

/**
 * Gets a list of nodes through service discovery that support MUC, and returns
 * them as a string array. Users con.domain if no node is specified.
 */
Xmpp4Js.Muc.MucManager.getMucNodes = function(con, node) {
    return ["conference.soashable.com"];
}

Xmpp4Js.Muc.MucManager.prototype = {
    /**
     * @param cb A function which takes [ MucRoom ] as a param.
     */
    getRoomList: function(cb) {

        var discoMan = this._getConnection().getServiceDisco();
        
        var self = this; 
        discoMan.discoverItems( this.node, function(node, items) {
            var rooms = [];
            for( var i = 0; i < items.length; i++ ) {
                var item = items[i];
                
                var room = new Xmpp4Js.Muc.MucRoom( self, item.jid, item.name );
                rooms.push( room );
            }
            
            cb( self, rooms );
        } ); 
    },
    
    getRoom : function(name) {
        var roomJid = name + "@" + this.node;
        return new Xmpp4Js.Muc.MucRoom( this, roomJid, name );
    },
    _getConnection : function() {
        return this.con;
    },
    _getExtManager : function() {
        return this.extProvider;
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Muc.MucManager, Xmpp4Js.Event.EventProvider, Xmpp4Js.Muc.MucManager.prototype);
