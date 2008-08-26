Xmpp4Js.Lang.namespace( "Xmpp4Js.Roster" );

/**
 * @constructor
 */
Xmpp4Js.Roster.PresenceManager = function() {
    /**
     * Map by jid => resource
     */
    this.map = {};
    /**
     * Map by jid
     */
    this.best = {};
    
    this.getBestImpl = new Xmpp4Js.Roster.PresenceManager.GetBestImpl();

    this.addEvents({
        update: true
    });
    
}

Xmpp4Js.Roster.PresenceManager.prototype = {

    /**
     * Set presence based on jid and resource, and clear best presence cache.
     * 
     * @param {Xmpp4Js.Packet.Presence} newPresence
     */
    update: function(newPresence) {
        var jid = newPresence.getFromJid().withoutResource().toString();
        var resource = newPresence.getFromJid().getResource();
        
        var type = newPresence.getType();
        
        if(type != "available" && type != "unavailable") {
            throw new Error("Invalid prsence type: " + type);
        }
        
        // If a map entry for JID doesn't exist, create it.
        if(this.map[jid]==undefined) { this.map[jid] = {}; }

        // update the new presence
        this.map[jid][resource] = newPresence;
        
        // fire the update event.
        this.fireEvent( "update", newPresence );
        
        delete this.best[jid];
    },
    /**
     * Get the presnce of a JID with a specific resource. Calls
     * getBest is resource is null.
     *
     * @return Xmpp4Js.Packet.Presence
     */
    get: function( jid, resource) {
        if( !resource ) {
            // find "best"
            return this.getBest(jid);
        }
        
        return this.map[jid] ? this.map[jid][resource] : undefined;
        
    },
    /**
     * Finds the presence with the "best" presence based on the algorithm 
     * implementation. In the future, it will be swappable. For now, 
     * see it.
     * 
     * @param {String} jid
     * @return Xmpp4Js.Packet.Presence
     */
    getBest: function( jid ) {
        var presenceList = this.map[jid];
        
        this.best[jid] = this.getBestImpl.getBest( presenceList );
        return this.best[jid];
    },
    
    /**
     * Remove a jid/resource combo. If resource is empty, all resources are removed.
     * @param {String} jid
     * @param {String} resource
     */
    remove: function(jid, resource) {
        if( this.map[jid] == undefined ) { return; }
    
        // remove all resources if none is specified
        if( !resource ) {
            for( var k in this.map[jid]) {
                var mapResource = this.map[jid][k];
                this.remove( jid, mapResource);
            }
            delete this.map[jid];
        } else {
            if( this.map[jid][resource] == undefined ) { return; }
            
            this.fireEvent( "remove", this.map[jid][resource] );
            delete this.map[jid][resource]; 
        }
    },
    /**
     * Listen to presence packets
     * @param {Packet} packet
     * 
     * TODO ability to gracefully handle non-presence packets
     */
    presencePacketListener: function ( packet ) {
        
        try {
            this.update( packet );
        } catch(e) {
            // a presence type that we don't care about (subscribe, unsubscribe, etc)
        }
    }
}

Xmpp4Js.Lang.extend(Xmpp4Js.Roster.PresenceManager, Xmpp4Js.Event.EventProvider, Xmpp4Js.Roster.PresenceManager.prototype);



/**
 * @constructor
 */
Xmpp4Js.Roster.PresenceManager.GetBestImpl  = function() {

}

Xmpp4Js.Roster.PresenceManager.GetBestImpl.prototype = {

    SHOW_WEIGHT: {
        chat: 6,
        normal: 5,
        away: 4,
        xa: 3,
        dnd: 2 // always higher than unavailable
    },
    TYPE_WEIGHT: {
        available: 5,
        unavailable: 1
    },

    /**
     * Finds the presence with the "best" presence based on availability followed by 
     * show followed by priority. Sets cache.
     * 
     * @param {String} jid
     * @return Xmpp4Js.Packet.Presence
     */
    getBest: function( presenceList ) {
        var bestPresence = undefined;
        var bestWeight = 0;
        
        for(var k in presenceList) {
            var presence = presenceList[k];
            
            // these return default values if empty.
            var show = presence.getShow();
            var type = presence.getType();
            var priority = presence.getPriority();

            // calculate the weight of the presence for getBest
            var weight = this.SHOW_WEIGHT[show] * this.TYPE_WEIGHT[type] * priority;
            
            //console.info( [show, type, priority]);
            //console.info( weight+" > "+bestWeight+"="+(weight > bestWeight) );
            
            // use the weight determined in .update()
            if( bestPresence == null || weight > bestWeight ) {
                bestPresence = presence;
                bestWeight = weight;
            }
        };
        
        return bestPresence;
    }
}
