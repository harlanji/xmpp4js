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

/**
 * @constructor
 */
function ServiceDiscoManager( con ) { 
        this.addEvents({
            /**
             * @param {Jid} jid the originating JID
             * @param {String} node the originating node
             * @param {Array} identities
             * @param {Array} features
             */
            inforesponse: true,
            /**
             * @param {Jid} jid the originating JID
             * @param {String} node the originating node
             * @param {Array} items an array of items, each an object with
             *                      jid, name, action, node
             */
            itemresponse: true
        });
    
    
	this.con = con;
}

ServiceDiscoManager.prototype = {
    /**
     * 
     * @private
     */
    registerPacketListeners: function() {
        this.con.addPacketListener( this.onDiscoItemsRequest.bind(this), new Xmpp4Js.PacketFilter.IQQueryNSFilter("http://jabber.org/protocol/disco#items") );
        this.con.addPacketListener( this.onDiscoIInfoRequest.bind(this), new Xmpp4Js.PacketFilter.IQQueryNSFilter("http://jabber.org/protocol/disco#info") );
    },
    
    /**
     * Discovers information of a given XMPP entity addressed by 
     * its JID and note attribute. Use this message only when trying to query 
     * information which is not directly addressable. Information is
     * returned via the 'inforesponse' event.
     *
     * @param {Jid or String} jid the entity to discover information on
     * @param {String} node optional, the node on the entitiy to discover information about.
     */
    discoverInfo : function( jid, node ) {
            var packet = this.con.getPacketHelper().createIQ(jid, "get", "http://jabber.org/protocol/disco#info");
            packet.setId( "disco_info_"+jid );

            var query = packet.getQuery();

            if( node ) {
                    query.setAttribute( "node", node );
            }

            // TODO should this time out?
            this.con.send( packet, this.onDiscoInfoResponse.bind(this)); 
    },

    /**
     * Returns the discovered items of a given XMPP entity addressed by its 
     * JID and note attribute. Use this message only when trying to query 
     * information which is not directly addressable.
     */
    discoverItems : function( jid, node ) {
            var packet = this.con.getPacketHelper().createIQ(jid, "get", "http://jabber.org/protocol/disco#items");
            
            var query = packet.getQuery();

            if( node ) {
                    query.setAttribute( "node", node );
            }

            // TODO should this time out?
            this.con.send( packet, this.onDiscoItemsResponse.bind(this)); 
    },
    
    /**
     * @private
     */
    features : [],

    /**
     * Registers that a new feature is supported by this XMPP entity. When this 
     * client is queried for its information the registered features will be 
     * answered.
     *
     * Since no packet is actually sent to the server it is safe to perform this 
     * operation before logging to the server. In fact, you may want to configure 
     * the supported features before logging to the server so that the information 
     * is already available if it is required upon login. 
     *
     * @param {String} feature the feature to register as supported.
     */
    addFeature : function( feature ) {
        this.features[ feature ] = true;
    },

    /**
     * Returns true if the specified feature is registered in the ServiceDiscoveryManager.
     * @param {String} feature the feature to look for.
     * @return {Boolean} a boolean indicating if the specified featured is registered or not.
     */
    includesFeature : function( feature ) {
        return this.features[ feature ] != undefined;
    },

    /**
     * Removes the specified feature from the supported features by this XMPP entity.
     * 
     * Since no packet is actually sent to the server it is safe to perform this 
     * operation before logging to the server. 
     *
     * @param {String} feature the feature to remove from the supported features.
     */
    removeFeature : function( feature ) {
        delete this.features[ feature ];
    },

    /**
     * Returns the supported features by this XMPP entity.
     *
     * @return {Array} an array of strings, each feature.
     */
    getFeatures : function() {
        var features = [];

        for( var k in this.features ) {
            features.push(k);
        }

        return features;
    },
    
    
    /**
     * Respond to service discovery requests for items.
     * 
     * Currently no items are returned, but the future should bring a hook
     * or registry for items.
     * @param {Xmpp4Js.Packet.IQ} requestIq the request packet.
     * @private
     */
    onDiscoItemsRequest : function(requestIq) {
        var response = this.con.getPacketHelper().createIQ( requestIq.getFrom(), "result", "http://jabber.org/protocol/disco#items" );
        response.setId( requestIq.getId() );
        
        this.con.send( response );

    },
    
    /**
     * Respond to service discovery requests for info.
     * 
     * Features are registered by using the addFeature method.
     *
     * @param {Xmpp4Js.Packet.IQ} requestIq the request packet.
     * @private
     */
    onDiscoIInfoRequest : function(requestIq) {
        var response = this.con.getPacketHelper().createIQ( requestIq.getFrom(), "result", "http://jabber.org/protocol/disco#info" );
        response.setId( requestIq.getId() );
        
        var queryNode = response.getQuery();
        var doc = queryNode.ownerDocument;
        
        for( var i = 0; i < this.features.length; i++ ) {
            var feature = this.features[i];
            
            var featureNode = doc.createElement( "feature" );
            featureNode.setAttribute( "var", feature );
            queryNode.appendChild( featureNode );
        }
        
        this.con.send( response );
    },
    
    /**
     * @private
     */
    onDiscoItemsResponse: function(responsePacket) {
        if( responsePacket.getType() == "error" ) {
            // throw new eception: response.getError()
            return;
        }

        var items = [];

        var responseQuery = responsePacket.getQuery();
        if( responseQuery == null ) {
            return; // TODO are responses with no query allowed?
        } 
        
        var itemNodes = responseQuery.childNodes;
        for ( var i=0; i < itemNodes.getLength(); i++ ) {
            var item = itemNodes.item( i );
            if( item.nodeName == "item" ) {
                items.push({
                    jid: item.getAttribute( "jid" ),
                    name: item.getAttribute( "name" ),
                    action: item.getAttribute( "action" ),
                    node: item.getAttribute( "node" )
                });
            }
        }

        this.fireEvent( "itemresponse", new Jid(jid), node, items );
    },
    
    /**
     * @private
     */
    onDiscoInfoResponse: function(responsePacket) {
        if( responsePacket.getType() == "error" ) {
            // throw new eception: response.getError()	
            return;
        }

        var identities = []
        var features = [];

        var responseQuery = responsePacket.getQuery();
        if( responseQuery == null ) {
            return; // TODO are responses with no query allowed?
        } 
        var itemNodes = responseQuery.childNodes;

        for ( var i=0; i < itemNodes.getLength(); i++ ) {
            var item = itemNodes.item( i );

            if( item.nodeName == "identity" ) {
                identities.push({
                    category: item.getAttribute( "category" ),
                    name: item.getAttribute( "name" ),
                    type: item.getAttribute( "type" )
                });
            } else if( item.nodeName == "feature" ) {
                features.push( item.getAttribute( "var" ) );
            }
        }

        this.fireEvent( "inforesponse", new Jid(jid), node, identities, features );
    }

};


ServiceDiscoManager.instances = {};
ServiceDiscoManager.getInstanceFor = function(con) {
    var instances = ServiceDiscoManager.instances;
    
    if( instances[con.id] === undefined ) {
        instances[con.id] = new ServiceDiscoManager( con );
    }

    return instances[con.id];
};

Xmpp4Js.Lang.extend( ServiceDiscoManager, Xmpp4Js.Event.EventProvider, ServiceDiscoManager.prototype );






/**
 * @constructor
 */
function TransportHelper() {

}

/** Calls back with the identity of each gateway individually. 
TODO this can be more abstracted for general discovery tasks
*/
TransportHelper.discoverGateways = function( sdm, cb ) {


	var checkedJids = {};

	// recursively discovers AIM by first checking info,
	// then checking all items
	var discoverGateways = function( jid ) {
		if( checkedJids[ jid ] ) {
			return; // no need to query more than once
		}
		checkedJids[ jid ] = true;
		sdm.discoverInfo( jid, function( infoJid, identities, features ) {
			for( var i = 0; i < identities.length; i++ ) {
				var ident = identities[ i ];
				if( ident.category == "gateway" ) {
					cb( infoJid, ident );
				}
			}

			// if discoverInfo didn't find any results, then
			// recursively search items
			sdm.discoverItems( infoJid, function( itemsJid, items ) {
				for( var i = 0; i < items.length; i++ ) {
					var item = items[ i ];
					
					discoverGateways( item.jid );
				}
			} );

		} );   
	};

	// discover starting on the bare hostname
	discoverGateways( sdm.con.domain );

}

TransportHelper.registerForAim = function( con, gatewayJid, screenName, password ) {
/*
	var sdm = con.getServiceDisco();

	sdm.discoverInfo( gatewayJid, function( jid, identities, features ) {
		var canRegister = false; // check features

		for( var i = 0; i < features.length; i++ ) {
			var feat = features[ i ];
			if( feat == "jabber:iq:register" ) {
				canRegister = true;
			}
		}

		if( !canRegister ) { 
            throw new Error( "Can not register for transport on "+gatewayJid );
        }
*/
		// first get fields we will need to register
		var iq = con.getPacketHelper().createIQ(gatewayJid, "get", "jabber:iq:register");
		iq.setId( "get_aim_" + screenName );
	
        // FIXME once again this bug with listeners comes out. fuck.
		con.send( iq, function( packet ) {
			// then set the data TODO this ignores retreived field names
			var iq = con.getPacketHelper().createIQ(gatewayJid, "set", "jabber:iq:register");
			iq.setId( "set_aim_" + screenName );


			// reuse the incoming query form
			//var query = iq.getDoc().importNode( packet.getQuery(), true );
			//iq.appendChild( query );

			//var regForm = query.firstChild;	

			var query = iq.getQuery();
			
			query.appendChild( iq.getDoc().createElement( "username" ) ).setTextContent( screenName );
			query.appendChild( iq.getDoc().createElement( "password" ) ).setTextContent( password );

			con.send( iq, function( packet ) {
				if( packet.getType() == "error" ) {
					alert( "There was a problem trying to register the screen name " + screenName );
					return;
				}
				
				// on Openfire/PyAIMt this seems to be done auto
				con.getRoster().createEntry( gatewayJid );

				// explicitly send available packet to gateway... TODO is this needed?
				var pres = con.getPacketHelper().createPresence();
                pres.setTo( gatewayJid );
				con.send( pres );
			} );

		} );
	//} );
}
