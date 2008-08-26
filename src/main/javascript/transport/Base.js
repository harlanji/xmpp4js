Xmpp4Js.Lang.namespace( "Xmpp4Js.Transport" );

/**
 * Functionality that needs testing:
 *  write:  
 *   sid 
 *     no sid on first request
 *    always present after session has started
 *   rid
 *    always present
 *    starts random
 *    sequential
 *    rollover at int limit
 *   key
 *    present / not present if it should be
 *    first, middle, last, first (init with length 3)
 *
 *  beginSession:
 *   rid, no sid, correct attributes
 *   error if called when open
 *   event is raised
 *
 *  endSession:
 *   terminate type and correct attributes are present
 *   error if called while not open
 *   event is raised
 *
 *  send:
 *   error before beginSession or after endSession
 *   multible nodes are combined to make one request
 *   number of open requests > max open requets
 *
 *  polling:
 *   doesn't send if there is an open request
 *   doesn't send if there are items in the queue
 *   sends empty body if both are empty
 */
Xmpp4Js.Transport.Base = function(config) {
    
    /**
     * The domain of the server you're connecting to.
     * @private
     */
    this.domain = config.domain;
    /**
     * The hostname or IP of the server to route to. defaults to domain.
     * @private
     */
    this.server = config.server || config.domain;
    /**
     * The port to route to. defaults to 5222
     * @private
     */
    this.port = config.port || 5222;
    /**
     * The time to wait for a response from the server, in seconds. defaults to 45 and can be adjusted by server.
     * This is 45 because Safari has a 60 second timeout and it's problematic. - 7/2008
     * @private
     */
    this.wait = config.wait || 45; 
    
    /**
     * Picked up by Observable.
     * @private
     */
    this.listeners = config.listeners;
    
    
    /**
     * This is set to true when the session creation response is 
     * received and it was successful.
     *
     * @private
     */
    this.isSessionOpen = false;
    
    /**
     * @type Ext.util.TaskRunner
     * @private
     */
    this.taskRunner = new Xmpp4Js.Lang.TaskRunner(500);
    
    /**
     * @private
     */
    this.sendQueueTask = {
        scope: this,
        run: this.sendQueue
    };
    
    /**
     * @private
     */
    this.sendPollTask = {
        scope: this,
        run: this.sendPoll
    };
    
    /**
     * @private
     */
    this.queue = [];
    
    /**
     * The session ID sent by the server.
     * @private
     */
    this.sid = null;
    
    /**
     * The request ID set in beginSession, and cleared in endSession
     * @private
     */
    this.rid = null;
    
    /**
     * The keysequence object
     * @private
     */
    this.keySeq = config.useKeys ? new KeySequence(25): null;
    
    /**
     * The max number of requests that can be open at once, sent by the server
     * @private
     */
    this.maxRequests = null;
    
    /**
     * The max number of requests that the server will keep open, sent by the server.
     * Typically this is maxRequests - 1.
     * @private
     */
    this.hold = null;
    
    /**
     * 
     * @private
     */
    this.polling = 5;
    
    /** 
     * The number of open XHR requests. Used for polling.
     * @private
     */
    this.openRequestCount = 0;
    
    var superConfig = config;
    
    
    this.addEvents({
        /**
         * @event recv
         * @param {DomElement} the body element of the node received.
         *
         * A packet node has been received. Typically cline code will register
         * its recv handlers in response to the sessionStarted event and remove
         * them in response to the sessionEnded and termerror events.
         */
        recv : true,
        
        
        /**
         * @event write
         * @param {DomElement} the body element of the node about to be written.
         *
         * A packet node is about to be written. It includes all frame data, but 
         * the event is fired just before the open request count is incremented.
         */
        write : true,
        
        
        /**
         * @event error
         * @param {DomElement} the body element of the node received.
         *
         * A non-terminal error has occured. Connection is not necisarily closed.
         */
        error : true,
        
        /**
         * @event termerror
         * @param {String} title
         * @param {String} message
         * @param {DomElement} the body element of the node received.
         *
         * Raised when the session is been forcibly closed due to an error. 
         * Client code should remove any recv handlers here (should we remove?)
         */
        termerror : true,
        
        
        streamerror : true,
        
        /**
         * @event sessionStarted
         *
         * Raised when the session has successfully be started. Clients should
         * register recv handlers here.
         */
        beginsession : true,
        
        /**
         * @event sessionEnded
         *
         * Raised when the session has been closed (voluntarily). Client code
         * should remove any recv handlers here (should we forcibly remove all?).
         */
        endsession: true,
        
        beforepause: true,
        
        pause: true,
        
        resume: true
    });
    
    Xmpp4Js.Transport.Base.superclass.constructor.call( this, superConfig );

}

Xmpp4Js.Transport.Base.logger = Xmpp4Js.createLogger("xmpp4js.transport.base");

Xmpp4Js.Transport.Base.prototype = {
    
    
    /**
     * Send a session creation request, and if it is successfully responded to
     * then mark the session open and start the sendQueueTask.
     */
    beginSession: function() {
        this.isPausing = false;
        
        this.rid = this.createInitialRid();
        
        var packetNode = this.createPacketNode();
        packetNode.setAttribute( "wait", this.wait );
        packetNode.setAttribute( "to", this.domain );
        packetNode.setAttribute( "route", "xmpp:" + this.server + ":" + this.port);
        packetNode.setAttribute( "ver", "1.6");
        packetNode.setAttribute( "xml:lang", "en");
        packetNode.setAttribute( "xmlns:xmpp", "urn:xmpp:xbosh");
        packetNode.setAttribute( "xmpp:version", "1.0" );

        
        this.on("recv", this.onBeginSessionResponse, this, {single:true});
  
        this.write( packetNode );
    },
    
    /** 
     * Callback to the beginSession packet (recv event).
     *
     * @param {DomElement} packetNode
     * @private
     */
    onBeginSessionResponse: function(packetNode) {
        // HACK single doesn't seem to work...
        //this.un("recv", arguments.callee /* the current function */, this );


        this.sid = packetNode.getAttribute( "sid" ).toString();
        this.maxRequests = packetNode.getAttribute( "requests" ).toString();
        
        if( packetNode.hasAttribute("hold") ) {
            this.hold = packetNode.getAttribute("hold").toString();
        } else {
            // sensible default
            this.hold = packetNode.maxRequests - 1;
        }
        
        if( packetNode.hasAttribute("wait") ) {
            // FIXME ideally xhr's timeout should be updated
            this.wait = packetNode.getAttribute("wait").toString();
        }
        
        if( packetNode.hasAttribute("polling") ) {
            this.polling = packetNode.getAttribute("polling").toString();
        }
        
;;;     Xmpp4Js.Transport.Base.logger.debug( "Get beginSession response. Session ID="+this.sid+", hold="+this.hold+", wait="+this.wait+", polling="+this.polling );

        this.startup();

        this.fireEvent( "beginsession" );
    },
    
    /**
     * Set isSessionOpen to true and start sendQueue and sendPoll tasks
     * @private
     */
    startup: function() {
;;;     Xmpp4Js.Transport.Base.logger.info( "Starting up transport" );
        this.isSessionOpen = true;
        this.taskRunner.start( this.sendQueueTask );
        this.taskRunner.start( this.sendPollTask );
        
    },
    
    /**
     * Send a terminate message, mark the sesion as closed, and stop the polling task.
     */
    endSession: function() {
;;;     Xmpp4Js.Transport.Base.logger.info( "End Session. Session ID="+this.sid );
        var packetNode = this.createPacketNode();
        packetNode.setAttribute( "type", "terminate" );
        
        // TODO we could be civil and append any remaining packets in the queue here.
        
        this.shutdown();

        this.write( packetNode );
        
        this.fireEvent( "endsession" );
    },
    
    /**
     * Set isSessionOpen to false and stop sendQueue and sendPoll tasks
     * @private
     */
    shutdown: function() {
;;;     Xmpp4Js.Transport.Base.logger.info( "Transport Shutdown (stopping tasks)" );
        this.isSessionOpen = false;
        this.taskRunner.stop( this.sendQueueTask );
        this.taskRunner.stop( this.sendPollTask );
    },
    
    /**
     * Send a packet as soon as possible. If the session is not currently open,
     * packets will queue up until it is.
     * 
     * Should it throw an error if not currently open?
     *
     * @param {DomElement} node
     */
    send: function(node) {
;;;     Xmpp4Js.Transport.Base.logger.debug( "Sending packet." );
        this.queue.push( node );
    },
    
    prepareWrite: function(packetNode) {
        this.addFrameData( packetNode );
        this.fireEvent( "write", packetNode );

        this.openRequestCount++;
    },
    
    /**
     * Immediately write a raw packet node to the wire. Adds frame data including
     * RID, SID and Key if they are present.
     *
     * Also increments the openRequestCount, which is then decremented in the
     * onWriteResponse method.
     *
     * A possible addition could be to add a "no headers" flag.
     *
     * @param {DomElement} packetNode
     */
    write: function(packetNode) {
;;;     Xmpp4Js.Transport.Base.logger.error( "write: Not Implemented" );
    },
    
    /**
     * Handles the response to a write call.
     *
     * Decrements the openRequestCount that was incremented in write.
     * @private
     */
    onWriteResponse: function() {
;;;     Xmpp4Js.Transport.Base.logger.error( "onWriteResponse: Not Implemented" );
    },
    
    /**
     * Create an empty packet node in the httpbind namespace.
     * @private
     * @return {DomElement} a body element with the correct namespace and basic attributes
     */ 
    createPacketNode: function() {
        var packetNode = DomBuilder.node( "body", {
                xmlns: "http://jabber.org/protocol/httpbind"
            }
        );
        
        return packetNode;
    },
    
    /**
     * Write a blank node if there is no data waiting and no requests open.
     * @private
     */
    sendPoll: function() {
        
        // if we're trying to poll too frequently
        /*var now = new Date().getTime();
        if( this.lastPoll != undefined && this.polling != 0 && (now - this.lastPoll < (this.polling * 1000)) ) {
            return;
        }
        this.lastPoll = now;
        */

        if( this.openRequestCount == 0 && this.queue.length == 0 ) {
;;;         Xmpp4Js.Transport.Base.logger.debug( "Send Poll." );
            var packetNode = this.createPacketNode();
            this.write( packetNode );
        }
    },
    
    /**
     * Pull all packets off the queue; first-in, first-out; and send them
     * within the body of a single packet. Don't send if # open requests
     * is greater than max requests.
     *
     * @private
     */
    sendQueue: function() {
        // don't send anything if there is no work to do.
        if( this.queue.length == 0 || this.openRequestCount > this.maxRequests ) {
            return;
        }
        
;;;     Xmpp4Js.Transport.Base.logger.debug( "sendQueue with "+this.queue.length+" waiting stanzas." );
        
        var packetNode = this.createPacketNode();

        while( this.queue.length > 0 ) {
            var node = this.queue.shift();
            var importedNode = packetNode.ownerDocument.importNode( node, true );

            packetNode.appendChild( importedNode );
        }
        
        this.write( packetNode );
    },

    /**
     * Add sid attribute to a packet, if there is one.
     * @param {Element} packetNode
     * @private
     */
    addSid: function( packetNode ) {
        if( this.sid !== null ) {
            packetNode.setAttribute( "sid", this.sid );
        }
    },
    
    /**
     * Add rid attribute to a packet, if there is one.
     * @param {Element} packetNode
     * @private
     */
    addRid: function( packetNode ) {   
        if( this.rid !== null ) {
            packetNode.setAttribute( "rid", ++this.rid );
        }
    },
    
    /**
     * Add the key attribute to the request, and if needed,
     * generate a new sequence and add the newkey attribute.
     * @param {Element} packetNode
     * @private
     */
    addKey: function( packetNode ) {
        if( this.keySeq instanceof KeySequence ) {
            var keySeq = this.keySeq;
            
            var isFirstKey = keySeq.isFirstKey();
            var isLastKey = keySeq.isLastKey();
            var key = keySeq.getNextKey();
            
            // if it's the first key, use ONLY the newkey attribute.
            if( isFirstKey ) {
                packetNode.setAttribute( "newkey", key );
            } else {
                packetNode.setAttribute( "key", key );
            }
            
            // if it's the last key, reset the KeySequence and add a newkey attribute.
            if( isLastKey ) {
;;;     Xmpp4Js.Transport.Base.logger.debug( "Resetting key sequence." );
                keySeq.reset();
    
                var newKey = keySeq.getNextKey();
                packetNode.setAttribute( "newkey", newKey );
            }
        }
        
    },
    
    /**
     * Add RID, SID and Key to a packet node. Calls each respective function.
     * @private
     */
    addFrameData: function(packetNode) {
        this.addRid( packetNode );
        this.addSid( packetNode );
        this.addKey( packetNode );
    },
    
    /**
     * Generate a random number to be used as the initial request ID.
     * @private
     */
    createInitialRid: function() {
        return Math.floor( Math.random() * 10000 ); 
    },
    
    isPausing: false,
    
    pause: function(time) {
        this.isPausing = true;
        
;;;     Xmpp4Js.Transport.Base.logger.info( "Pausing session." );

        this.fireEvent( "beforepause", time );
        
        var pauseNode = this.createPacketNode();
        pauseNode.setAttribute( "pause", time );

        /*
         * the connection manager SHOULD respond immediately to all pending
         * requests (including the pause request) and temporarily increase 
         * the maximum inactivity period to the requested time.

        this.on("recv", function(packet) {
          this.fireEvent( "pause", pauseStruct );
        }, this, {single:true});
        */
        this.sendQueue();
        
        this.write( pauseNode );
        
        this.shutdown();
        
        var pauseStruct = this.serializeState();
        
        // give others an opportunity to serialize proprties
        this.fireEvent( "pause", pauseStruct );
        
        return pauseStruct;
    },
    
    serializeState: function() {
        var pauseStruct = {
            maxpause: 120, // TODO not hard code me
            maxRequests: this.maxRequests,
            hold: this.hold,
            polling: this.polling,
            server: this.server,
            port: this.port,
            domain: this.domain,
            wait: this.wait,
            sid: this.sid,
            rid: this.rid,
            endpoint: this.endpoint, // TODO subclass implementations should handle this
            keysSeqKeys : this.keySeq._keys, 
            keySeqIdx: this.keySeq._idx
        };
        
        return pauseStruct;
    },
    
    deserializeState: function(pauseStruct) {
        // this.maxpause = pauseStruct.maxpause;
        this.maxpause = pauseStruct.maxpause;
        this.hold = pauseStruct.hold;
        this.polling = pauseStruct.polling;
        this.server = pauseStruct.server;
        this.port = pauseStruct.port;
        this.wait = pauseStruct.wait;
        this.sid = pauseStruct.sid;
        this.rid = pauseStruct.rid;
        this.domain = pauseStruct.domain;
        this.endpoint = pauseStruct.endpoint;
        this.maxRequests = pauseStruct.maxRequests;
        
        this.keySeq._keys = pauseStruct.keysSeqKeys;
        this.keySeq._idx = pauseStruct.keySeqIdx;
    },
    
    resume: function(pauseStruct) {
        this.isPausing = false;
        
;;;     Xmpp4Js.Transport.Base.logger.info( "Resume session. Session ID="+pauseStruct.sid+", Request ID="+pauseStruct.rid );
        
        this.deserializeState(pauseStruct);
        
        this.startup();
        
        // give others an opportunity to deserialize properties
        this.fireEvent( "resume", pauseStruct );
    },
    
    handleErrors: function(packetNode) {
        // TODO add log messages here
        var errorNode = packetNode.getElementsByTagNameNS("http://etherx.jabber.org/streams","error");
        errorNode = errorNode.getLength() > 0 ? errorNode.item(0) : null;
        
        // HACK these errors should be given with terminate / remote-stream-error but in Openfire they are not.
        if( errorNode == null && (packetNode.getAttribute("type").toString() == "terminate" ||
          packetNode.getAttribute("type").toString() == "terminal")) { // HACK openfire uses terminal?
            var condition = packetNode.getAttribute( "condition" ).toString();
            
            var title = Xmpp4Js.PacketFilter.TerminalErrorPacketFilter.conditions[ condition ].title;
            var message = Xmpp4Js.PacketFilter.TerminalErrorPacketFilter.conditions[ condition ].message;
            
            this.fireEvent( "termerror", packetNode, title, message );
            throw new Error( "Error in packet" );
        } else if( packetNode.getAttribute("type").toString() == "error" ) {
          // 17.3 Recoverable Binding Conditions

          // TODO this should attempt to resend all packets back
          //      to the one that created the error. This could be
          //        implemented by putting each sent packet into a queue
          //        and removing it upon a successful response.
          //
          //        Ideally this error event would not even be visible beyond
          //        the the BOSH transport.

          this.fireEvent( "error", packetNode );  
          throw new Error( "Error in packet" );
        } else if(errorNode != null) {
            // loop through stream nodes to find the condition and
            // optionally text
            var childNodes = errorNode.getChildNodes();
            for( var i = 0; i < childNodes.getLength(); i++ ) {
                var node = childNodes.item(i);
                if( node.getNamespaceURI() == "urn:ietf:params:xml:ns:xmpp-streams" ) {
                    if( node.getLocalName() == "text" ) {
                        var text = node.getText();
                    } else {
                        var errorCode = node.getLocalName();
                    }
                }
            }
            
            this.fireEvent( "streamerror", packetNode, errorNode, errorCode, text );
            throw new Error( "Error in packet" );
        }
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Transport.Base, Xmpp4Js.Event.EventProvider, Xmpp4Js.Transport.Base.prototype );
