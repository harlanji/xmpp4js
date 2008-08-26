// Copyright (C) 2007  Harlan Iverson <h.iverson at gmail.com>
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.


Xmpp4Js.Lang.namespace( "Xmpp4Js.Roster" );

/**
 * @constructor
 */
Xmpp4Js.Roster.Roster = function( con ) {    
    this.presenceManager = new Xmpp4Js.Roster.PresenceManager();
    this.rosterItemManager = new Xmpp4Js.Roster.RosterItemManager(this);

    this.con = con;

    
    this.con.addPacketListener( this.rosterItemManager.rosterPacketListener.bind(this.rosterItemManager), new Xmpp4Js.PacketFilter.PacketClassFilter( Xmpp4Js.Packet.RosterPacket ) );
    this.con.addPacketListener( this.rosterItemManager.rosterSubSyncPacketListener.bind(this.rosterItemManager), new Xmpp4Js.PacketFilter.PacketClassFilter( Xmpp4Js.Packet.Presence ) );
    
    this.con.addPacketListener( this.presenceManager.presencePacketListener.bind(this.presenceManager), new Xmpp4Js.PacketFilter.PacketClassFilter( Xmpp4Js.Packet.Presence ) );
    

}

Xmpp4Js.Roster.Roster.prototype = {
    reload: function() {
        var iq = this.con.getPacketHelper().createIQ( null, "get", "jabber:iq:roster" );
        
        this.con.send( iq );    
    },
    
    /**
     * @param {String or Xmpp4Js.Jid} jid
     * @return Xmpp4Js.Roster.RosterEntry
     */
    getEntry: function( jid ) {
        return this.rosterItemManager.get( jid );
    },
    
    /**
     * @param {String} name
     * @return Xmpp4Js.Roster.RosterGroup
     */
    getGroup: function( name ) {
        return this.rosterItemManager.getGroup(name);
    },
    
    /**
     * @return Xmpp4Js.Roster.RosterGroup an array of roster groups
     */
    getGroups: function() {
        return this.rosterItemManager.getGroups();
    },
    
    /**
     * @return Xmpp4Js.Roster.RosterGroup
     */
    getUnfiledEntries: function() {
        return this.rosterItemManager.getUnfiledContacts();
    },

    /**
     * Creates an entry in roster under given groups,
     * and sends a subscription request to jid upon
     * success. Note: this function as asynchronous.
     *
     * @param {String} jid The jid of the person to add
     * @param {String} alias The alias (display name) of the person to add
     * @param {Array} groups an optional array of strings, group names
     */
    add: function( jid, alias, groups ) {
    
        var packet = new Xmpp4Js.Packet.RosterPacket();
        packet.addItem( jid, alias, groups );

        // TODO should this time out?
        this.con.send( packet, function(responsePacket) {
            if( responsePacket.getType() == "error" ) {
                // throw new eception: response.getError()    
            }
        
            // automatically handle sending presence requests
            // the server will ignore it if we already have
            // subscription.
            var presence = this.con.getPacketHelper().createPresence( jid, "subscribe" );
            this.con.send( presence );
        }.bind(this)); 
    },
    
    /**
     * Remove an item from the roster.
     *
     * @param {String} jid The jid of the person to remove
     */
    remove: function( jid ) {
        var packet = new Xmpp4Js.Packet.RosterPacket();
        packet.addItem( jid, null, null, "remove" );
        this.con.send( packet ); 
    },
    

    /**
     * Creates an entry in roster under given groups,
     * and sends a subscription request to jid upon
     * success. Note: this function as asynchronous.
     *
     * @param {String} jid The jid of the person to add
     * @param {String} alias The alias (display name) of the person to add
     * @param {Array} groups an optional array of strings, group names
     *
     * @deprecated use add instead.
     */
    createEntry: function( jid, alias, groups ) {
        return this.add.apply( this, arguments );
    },


    /**
     * Finds the presence with either an exact match on resource, or the "best" presence based
     * on availability followed by show followed by priority.
     * @param {String} jid
     * @param {String} resource
     * 
     * @return Xmpp4Js.Roster.PresenceManager.Presence
     */
    getPresence: function( jid, resource ) {
        return this.presenceManager.get( jid, resource );
    },
    
    getRosterItemManager: function() {
        return this.rosterItemManager;
    },
    
    getPresenceManager: function() {
        return this.presenceManager;
    },
    getConnection : function() {
        return this.con;
    }
};

Xmpp4Js.Roster.Roster.instances = {};
Xmpp4Js.Roster.Roster.getInstanceFor = function(con) {
    var instances = Xmpp4Js.Roster.Roster.instances;
    
    if( instances[con.id] === undefined ) {
        instances[con.id] = new Xmpp4Js.Roster.Roster( con );
    }

    return instances[con.id];
};

