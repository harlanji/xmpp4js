/*
Certain Portions: 
Copyright (c) 2008, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 2.5.2
*/

Xmpp4Js.Lang.namespace( "Xmpp4Js");

/**
 * <pre>var con = new Xmpp4Js.Connection({
 *     boshEndpoint: "/http-bind/"
 * });</pre>
 */
Xmpp4Js.Connection = function(config) {
    /** @private */
    this.transport = null;
    
    /**
     * Used for getInstanceFor as a substitute for hashCode, since I can't 
     * find one in JS.
     * @type String
     */
    this.id = Xmpp4Js.Lang.id();
    
    this.stanzaProvider = config.stanzaProvider;
    
    this.transportConfig = config.transport;
    
    var superConfig = config;
    
    this.addEvents({
        /**
         * The connection is open and ready for normal packets to be exchanged.
         */
        connect: true,
        /**
         * The connection was clsoed either forcibly or voluntarily. error
         * will be fired preceeding close if it was an forced termination.
         */
        close: true,
        /**
         * An error was received from the server. If the error is terminal,
         * the close event will be fired in succession
         *
         * TODO I don't like changing the order of the last three params
         *      from termerror, or that regular error doesn't have them. Then
         *      again, the goal is to not propagate recoverable error this far 
         *      anyway.
         * 
         * @param {Boolean} terminal
         * @param {DomElement} packetNode
         * @param {String} title
         * @param {String} message
         */
        error: true,
        
        beforepause: true,
        
        pause: true,
        
        resume: true
    });
    
    /**
     * Picked up by Observable.
     * @private
     */
    this.listeners = config.listeners;
    
    this.domain = null;
    this.connected = false;
    this.packetHelper = new Xmpp4Js.Packet.PacketHelper();
    
    /** 
     * @private
     * @type Xmpp4Js.PacketListenerManager
     */
    this.packetListenerManager = new Xmpp4Js.PacketListenerManager({
        stanzaProvider: this.stanzaProvider
    });
    
    this.setupTransport();
    
    
    Xmpp4Js.Connection.superclass.constructor.call( this, superConfig );
    
    if( config.pauseStruct != undefined ) {
        this.resume( config.pauseStruct );
    }
    
}

Xmpp4Js.Connection.logger = Xmpp4Js.createLogger( "xmpp4js.connection" );

Xmpp4Js.Connection.prototype = {
    
    setupTransport: function(server, port) {
        var transportClass = this.transportConfig.clazz;
        
        if( typeof transportClass != 'function' ) {
            throw new Error( "transportClass is not valid." );
        }
        
        
        var transportConfig = {};
        Xmpp4Js.Lang.augmentObject( transportConfig, this.transportConfig );
        Xmpp4Js.Lang.augmentObject( transportConfig, {
            domain: this.domain,
            port: port,
            server: server,
            listeners: {
                scope: this,
                termerror: this.onTerminalError,
                error: this.onError,
                streamerror: this.onStreamError,
                beginsession: this.onBeginSession,
                endsession: this.onEndSession,
                beforepause: this.onBeforePause,
                pause: this.onPause,
                resume: this.onResume
                // recv will be added in beginSession.
            }
        });

        this.transport = new transportClass(transportConfig);
    },
        
    /**
     * Connect to a given domain, port and server. Only domain is required.
     */
    connect: function(domain, server, port) {
        // TODO it would be nice to be able to give a connect
        //      event as a parameter, that registers on this and 
        //      unregisters right after it's called.
;;;     Xmpp4Js.Connection.logger.info( "Connecting to "+domain+", server="+server+", port="+port );
    
        if( this.isConnected() ) {
            throw new Xmpp4Js.Error( "Already Connected" );
        }
        this.domain = domain;

        this.setupTransport( server, port );
        this.transport.beginSession();
    },
    
    /**
     * Close the connection.
     */
    close: function() {
;;;     Xmpp4Js.Connection.logger.info( "Closing connection to "+this.domain );
        if( !this.isConnected() ) {
            throw new Xmpp4Js.Error( "Not Connected" );
        }
        
        this.transport.endSession();
    },
    
    /**
     * Send a packet across the wire, and register a PacketIdListener if a callback
     * is supplied
     * 
     * @param {Xmpp4Js.Packet.Base} packet
     * @param {function} callback The callback to be invoked when the server sends a response with same ID.
     * @see Xmpp4Js.PacketFilter.PacketIdFilter
     */
    send: function(packet, callback) {
;;;     Xmpp4Js.Connection.logger.debug( "Sending packet. Callback? "+(callback!=null) );
        if( !this.isConnected() ) {
            throw new Xmpp4Js.Error( "Not Connected" );
        }
        
        if( callback ) {
            var id = packet.getId();

            var pf = new Xmpp4Js.PacketFilter.PacketIdFilter( id );
            // TODO can this be abstracted to a OneTimePacketFilter that wraps
            //      any other PacketFilter?
            var listener = function( node ) {
                this.removePacketListener( listener );

                callback( node );
            }.bind(this);

            this.addPacketListener( listener, pf );    
        }
        
        this.transport.send( packet.getNode() );
    },
    
    /**
     * Returns whether or not er are connected.
     */
    isConnected: function() {
        return this.connected;
    },
    
    /**
     * Adds a packet listener and returns its function. See PacketReader.
     * @return Function
     * @see Xmpp4Js.PacketListenerManager#addPacketListener
     */
    addPacketListener : function( listener, filter ) {
        return this.packetListenerManager.addPacketListener( listener, filter );
    },

    /**
     * Removes a packet listener by function. See PacketReader.
     * @param {Function} listener The listener returned by addPacketListener
     * @see Xmpp4Js.PacketListenerManager#removePacketListener
     */
    removePacketListener : function( listener ) {
        return this.packetListenerManager.removePacketListener( listener );
    },
    
    /**
     * Called whenever an incoming packet comes. Handles dispatching
     * packet listeners / filters.
     *
     * @param {DomElement} packetNode
     * @private
     */
    onRecv: function(packetNode) {
;;;     Xmpp4Js.Connection.logger.debug( "Received a packet" );
        this.packetListenerManager.run( packetNode ); 
    },
    /**
     * Shutdown before firing error event to give the listener an opportunity
     * to reconnect.
     * @private
     */
    onTerminalError: function(title, message, packetNode) {
;;;     Xmpp4Js.Connection.logger.error( "Terminal error. title="+title+", message="+message );
        this.shutdown();
        this.fireEvent( "error", true, packetNode, title, message );
    },
    
    /**
     * Shutdown before firing error event to give the listener an opportunity
     * to reconnect.
     * @private
     */
    onStreamError: function(packetNode, errorNode, errorCode, text) {
;;;     Xmpp4Js.Connection.logger.error("Stream error. code="+errorCode+", text="+text );
        this.shutdown();
        this.fireEvent( "error", true, packetNode, errorCode, text );
    },
    
    /**
     * Handle non-terminal errors
     * @param {DomElement} packetNode
     * @private
     */
    onError: function(packetNode) {
;;;     Xmpp4Js.Connection.logger.warn("Recoverable error.");
        this.fireEvent( "error", false, packetNode );
    },
    
    /**
     * Sets connected to true and sets up the onRecv listener.
     * @private
     */
    onBeginSession: function() {
;;;     Xmpp4Js.Connection.logger.info( "Begin session. Session ID="+this.transport.sid );
        this.startup();
        this.fireEvent( "connect" );
    },
    
    /**
     * Sets connected to false and removes the onRecv listener.
     * @private
     */
    onEndSession: function() {
;;;     Xmpp4Js.Connection.logger.info( "End session. Session ID="+this.transport.sid );
        this.shutdown();
        this.fireEvent( "close" );
    },
    
    onBeforePause: function(time) {
        this.fireEvent( "beforepause", time );
    },
    
    /**
     * Event handler for when the transport session is paused. Bubbles the event 
     * through to listeners on this connection.
     * 
     * @param {Object} pauseStruct the r/w object containing info about the pause.
     * @private
     */
    onPause: function(pauseStruct) {
        // serialize our junk (domain is covered by transport) 
        pauseStruct.jid = this.jid;
        this.fireEvent( "pause", pauseStruct );
        this.shutdown();
    },
    
    /**
     * Event handler for when the transport session is resumed. Bubbles the event 
     * through to listeners on this connection.
     * 
     * @param {Object} pauseStruct the r/w object containing info about the pause.
     * @private
     */
    onResume: function(pauseStruct) {
;;;     Xmpp4Js.Connection.logger.info( "Connection resumed. Session ID="+this.transport.sid );
        // deserialize our junk
        this.domain = pauseStruct.domain;
        this.jid = pauseStruct.jid;

        this.startup();
        this.fireEvent( "resume", pauseStruct );
    },
    
    /**
     * Set connected to false, fire the close event, and remove the recv listener.
     * @private
     */
    shutdown: function() {
;;;     Xmpp4Js.Connection.logger.info( "Shutting down connection" );
        this.transport.un("recv", this.onRecv, this );

        this.connected = false;
    },
       
    /**
     * Set connected to true, fire the connect event, and add the recv listener.
     * @private
     */
    startup: function() {
;;;     Xmpp4Js.Connection.logger.info( "Starting up connection" );
        this.connected = true;
        
        this.transport.on({
            scope: this,
            recv: this.onRecv
        });
    },
    
    /**
     * @deprecated
     */
    getPacketHelper: function() {
        return this.packetHelper;
    },
    
    /**
     * Returns the Jid of the currently connected user, if any.
     * @type Xmpp4Js.Jid
     */
    getJid : function() {
        return new Xmpp4Js.Jid(this.jid);	
    },
    
    /**
     * Sends a pause command to the server and returns a struct that may be 
     * serialized and passed to resume.
     * @param {Number} time Time in seconds to allow inactivity. No longer than maxpause.
     * @public
     */
    pause: function(time) {
;;;     Xmpp4Js.Connection.logger.debug( "Requesting session pause. time="+time+" seconds, Session ID="+this.transport.sid );
        
        // serialize transport's junk
        var pauseStruct = this.transport.pause(time);
        
        return pauseStruct;
    },

    /**
     * Sends a pause command to the server and returns a struct that may be 
     * serialized and passed to resume.
     * @param {Number} time Time in seconds to allow inactivity. No longer than maxpause.
     * @public
     */
    resume: function(pauseStruct) {
;;;     Xmpp4Js.Connection.logger.debug( "Resuming session. Session ID="+this.transport.sid );
        this.setupTransport( pauseStruct.server, pauseStruct.port );
        
        // deserialize transport's junk
        this.transport.resume(pauseStruct);
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Connection, Xmpp4Js.Event.EventProvider, Xmpp4Js.Connection.prototype );

