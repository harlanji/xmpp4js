Xmpp4Js.Lang.namespace( "Xmpp4Js.Roster" );

/**
 * @constructor
 */
Xmpp4Js.Roster.RosterItemManager = function() {
    /**
     * organized by jid, including resource
     * @type Xmpp4Js.Roster.RosterEntry Array of Xmpp4Js.Roster.RosterEntry.
     */
    this.map = {};
      
    this.addEvents({
        /**
         * A new entry was added.
         * @param {Xmpp4Js.Roster.RosterEntry} newEntry
         */
        "add" : true,
        /**
         * An entry was updated.
         * @param {Xmpp4Js.Roster.RosterEntry} oldEntry
         * @param {Xmpp4Js.Roster.RosterEntry} newEntry
         */
        "update" : true,
        /**
         * An entry was removed.
         * @param {Xmpp4Js.Roster.RosterEntry} deletedEntry
         */
        "remove" : true
    });
}

Xmpp4Js.Roster.RosterItemManager.prototype = {
    /**
     * Get a roster entry by JID. Roster entries are not stored by resource, 
     * so it is always stripped to a bare JID.
     *
     * @param {String or Xmpp4Js.Jid} jid
     * @return Xmpp4Js.Roster.RosterEntry
     */
    get: function(jid) {
        jid = new Xmpp4Js.Jid(jid).withoutResource().toString();
    
        return this.map[jid];
    },
    
    /**
     * Get a roster group by name. See documentation on
     * return type for exact details.
     *
     * @param {String} name The name of the group
     * @return Xmpp4Js.Roster.RosterGroup
     */
    getGroup: function(name) {
        var groups = this.getGroups();
        for( var i = 0; i < groups.length; i++ ) {
            if( groups[i].name == name ) {
                return groups[i];
            }
        }
    },
    
    /**
     * Get an array of all groups
     *
     * @return Xmpp4Js.Roster.RosterGroup[] an array of Groups
     */
    getGroups: function() {
        var retGroups = [];
        var groupNames = {};
        
        retGroups.push( this.getUnfiledContacts() );
        
        for( var k in this.map) {
            var entry = this.map[k];
            for(var i = 0; i < entry.groups.length; i++) {
                var groupName = entry.groups[i];
                if( groupNames[groupName] == undefined ) {
                    groupNames[ groupName ] = 1;
                    retGroups.push( new Xmpp4Js.Roster.RosterGroup( groupName, this ) );
                }
            };
            
        };
        
        return retGroups;
    },
    
    /**
     * Get the special unfiled contacts group, and all entries that
     * are not in any group.
     *
     * @return Xmpp4Js.Roster.RosterGroup
     */
    getUnfiledContacts: function(){
        return new Xmpp4Js.Roster.UnfiledEntriesRosterGroup(this);
    },
    
    /**
     * Fires events after add/modify and before delete.
     * Items are stored without taking resource into account.
     * 
     * @param {String or Xmpp4Js.Jid} jid
     * @param {String} alias
     * @param {String} subscription
     * @param {String} ask
     * @param {String Array} groups
     */
    update: function(jid, alias, subscription, ask, groups) {
        jid = new Xmpp4Js.Jid(jid).withoutResource().toString();
    
        // TODO find out if this is ever sent from the server
        if( subscription == "remove" ) {
            this.remove(jid);
            return;
        }
        var newEntry = new Xmpp4Js.Roster.RosterEntry(jid, alias, subscription, ask, groups, this);
        var currentEntry = this.map[jid];
        
        // replace current entry with new one.
        this.map[jid] = newEntry;
        
        if( currentEntry == undefined ) {
            this.fireEvent( "add", newEntry );
        } else {
            this.fireEvent( "update", currentEntry, newEntry );
        }
        
        return newEntry;
    },
    
    /**
     * Remove a contact from the roster. Fires the remove event and
     * deletes the entry from the local map.
     */
    remove: function(jid) {
        var entry = this.map[jid];

        this.fireEvent( "remove", entry );
        
        delete this.map[jid];
    },

    /**
     * Listens for regular roster packets and calls update as needed.
     *
     * FIXME This must be manually added to a connection.
     *
     * @param {Xmpp4Js.Packet.IQ} packet Could be  class of roster packet.
     */
    rosterPacketListener: function( packet ) {
        var itemNodes = packet.getQuery().getElementsByTagName("item");
        for ( var i=0; i < itemNodes.getLength(); i++ ) {
            var item = itemNodes.item(i);
    
            var jid = item.getAttribute( "jid" ).toString();
            var name = item.getAttribute( "name" ).toString();
            var subscription = item.getAttribute( "subscription" ).toString(); // none, to, from, both, remove
            var ask = item.getAttribute( "ask" ).toString(); // subscribe, unsubscribe         
    
            var groups = [];
    
            var groupNodes = item.getElementsByTagName("group");
            for( var j = 0; j < groupNodes.getLength(); j++ ) {
                var node = groupNodes.item(j);
                groups.push( node.getStringValue() );
            }

            this.update( jid, name, subscription, ask, groups );
        }
        
    },

    /**
     * Listens for roster information from legacy services. That is, 
     * these items exist on a transport's legacy roster but not necessarily 
     * in this account's native jabber roster. Calls update as needed.
     *
     * FIXME This must be manually added to a connection.
     *
     *
     * See this document: http://delx.net.au/projects/pymsnt/jep/roster-subsync/
     *
     * @param {Xmpp4Js.Packet.IQ} packet Could be  class of roster packet.
     */
    rosterSubSyncPacketListener: function( presence ) {
        var subsyncNode = presence.getNode().getElementsByTagNameNS("http://jabber.org/protocol/roster-subsync", "x").item(0);
        // TODO create a subsync packet filter.
        if( !subsyncNode ) {
            return;
        }
        
        // in subsync the JID is on the presence element, and not the item element.
        var jid = presence.getFrom();
        
        var itemNodes = subsyncNode.getElementsByTagName("item");
            
        for ( var i=0; i < itemNodes.getLength(); i++ ) {
            var item = itemNodes.item(i);
    
            var name = item.getAttribute( "name" ).toString();
            var subscription = item.getAttribute( "subscription" ).toString(); // none, to, from, both, remove
            var ask = item.getAttribute( "ask" ).toString(); // subscribe, unsubscribe         
    
            var groups = [];
    
            var groupNodes = item.getElementsByTagName("group");
            for( var j = 0; j < groupNodes.getLength(); j++ ) {
                var node = groupNodes.item(j);
                groups.push( node.getStringValue() );
            }

            this.update( jid, name, subscription, ask, groups );
        }
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Roster.RosterItemManager, Xmpp4Js.Event.EventProvider, Xmpp4Js.Roster.RosterItemManager.prototype);
