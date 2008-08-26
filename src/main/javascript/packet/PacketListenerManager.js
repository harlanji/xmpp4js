Xmpp4Js.Lang.namespace( "Xmpp4Js" );

Xmpp4Js.PacketListenerManager = function(config) {
    this.listeners = [];
    this.stanzaProvider = config.stanzaProvider;
}

Xmpp4Js.PacketListenerManager.logger = Xmpp4Js.createLogger("xmpp4js.packetlistener");

Xmpp4Js.PacketListenerManager.prototype = {
    /**
     * Add a listener for certain types of packets. All packets are
     * matched if no filter is specified.
     * @param listener {Function} A function that is called if filter matches. stanza as argument.
     * @param filter {Xmpp4Js.PacketFilter.PacketFilter} A filter instance that returns true or false. AllPacketFilter is used if unspecified.
     * @todo return a filter ID that can be used to remove it, so that the same
     * 	     function can be used with multiple filters. 
     */
    addPacketListener: function( listener, filter ) {
        if( filter === null || filter === undefined ) {
            filter = new Xmpp4Js.PacketFilter.AllPacketFilter();
        }
        var wrapper = {
            listener: listener, 
            filter: filter
        };
        this.listeners.push( wrapper );

        return wrapper;
    },
    
    /**
     * Remove a packet listener
     * @param listener {Function} The listener function (exact instance) to remove.
     */
    removePacketListener: function( listener ) {
        var removeIdx = -1;

        for( var i = 0; i < this.listeners.length; i++ ) {
            var wrapper = this.listeners[i];
            if( wrapper.listener === listener ) {
                removeIdx = i;
                break;
            }
        }

        if( removeIdx > -1 ) {
            this.listeners.splice( removeIdx, 1 );
        }
    },
    
    /**
     * Run all filters on a given packet node.
     * @param {Element} packetNode The body element to process packets on.
     */
    run: function(packetNode) {
        // get rid of whitespace
        packetNode.normalize();
        
        for( var i = 0; i < this.listeners.length; i++ ) {
            var wrapper = this.listeners[i];
            try {
                if( wrapper.filter instanceof Xmpp4Js.PacketFilter.RawPacketFilter ) {
                    if( wrapper.filter.accept(packetNode) ) {
                        wrapper.listener( packetNode );
                    }
                } else {
                    for( var j = 0; j < packetNode.childNodes.getLength(); j++ ) {
                        var node = packetNode.childNodes.item(j);
                        
                        // if it's not a normal element ignore it
                        if( node.nodeType != 1 /* ELEMENT - are there cross-browser constants? */) {
                            continue;
                        }

                        // FIXME this seems it should be jabber:client, but server impls differ
                        if( node.namespaceURI == "http://jabber.org/protocol/httpbind" 
                            || node.namespaceURI == "jabber:client" ) {
                        
                            var stanza = this.stanzaProvider.fromNode( node );

                            if( wrapper.filter.accept(stanza) ) {
                                wrapper.listener( stanza );
                            }
                        } else {
                        }
                    }	
                }
            } catch( e ) {
;;;           Xmpp4Js.PacketListenerManager.logger.error( "Error running packet listener");
                //	alert( "Exception executing filter: " + e +"\n" + e.fileName + "(" + e.lineNumber + ")");
                //	alert( e.stack );
            }
        }
    }
}
