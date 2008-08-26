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
Xmpp4Js.Transport.BOSH = function(config) {
    /**
     * @private
     * @type String
     */
    this.endpoint = config.endpoint;
    
    var superConfig = config;
    
    Xmpp4Js.Transport.BOSH.superclass.constructor.call( this, superConfig );

}

Xmpp4Js.Transport.BOSH.logger = Xmpp4Js.createLogger("xmpp4js.transport.bosh");
    
    
Xmpp4Js.Transport.BOSH.prototype = {

    
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
        this.prepareWrite( packetNode );
        
;;;     Xmpp4Js.Transport.BOSH.logger.debug( "Writing packet." );

        
        Xmpp4Js.Lang.asyncRequest({
            xmlNode: packetNode, // this isn't a real option... but it's needed for testing.
            scope: this,
            callback: this.onWriteResponse,
            /*async: !this.isPausing, // use synchronous requests if we're pausing
                                    // because it's generally called from onunload
                                    // which will cut off async requests.
            */
            url: this.endpoint,
            method: "POST",
            // FIXME this.wait is sent by initial response. Change this timeout
            //       when this.wait is changed. For now it's always at whatever
            //       this.wait is initialized to.
            timeout: this.wait * 1000,
            disableCaching: true,
            headers: { 'content-type': 'text/xml' }
        });
    },
    
    /**
     * Handles the response to a write call.
     *
     * Decrements the openRequestCount that was incremented in write.
     * @private
     */
    onWriteResponse: function(options, success, response) {
        this.openRequestCount--;
        
;;;     Xmpp4Js.Transport.BOSH.logger.debug( "Got write response." );
        
                // 17.4 XML Stanza Conditions?
                // this condition would be true if we closed the connection
                // before a response was received
                //
                // TODO setting xhr.timeout to a higher value than wait would
                //      eliminate this issue, unless there was a network 
                //      inturruption before the server responded. figure out
                //      how to handle this. 

        
        /*
            TODO - 17.1
            A legacy client (or connection manager) is a client (or 
            connection manager) that did not include a 'ver' attribute 
            in its session creation request (or response). A legacy 
            client (or connection manager) will interpret (or respond 
            with) HTTP error codes according to the table below. 
            Non-legacy connection managers SHOULD NOT send HTTP error 
            codes unless they are communicating with a legacy client. 
            Upon receiving an HTTP error (400, 403, 404), a legacy 
            client or any client that is communicating with a legacy 
            connection manager MUST consider the HTTP session to be 
            null and void. A non-legacy client that is communicating 
            with a non-legacy connection manager MAY consider that the 
            session is still active.
        */
        if( response.status == -1 ) {
            // we aborted the connection, do nothing. close?
        } else if( !success || response.status != 200 ) {
            // Deprecated HTTP error conditions
;;;         Xmpp4Js.Transport.BOSH.logger.warn( "Deprecated HTTP code error" );

            var condition = null;
            if( !response.status ) {
                condition = "undefined-condition";
            } else if( response.status != 200 ){
                condition = "status."+response.status;
            } else {
                condition = "undefined-condition";
            }

            var title = "Unknown Error";
            var message = "There was an unknown error with the connection.";

            var errorPacketNode = this.createPacketNode();
            errorPacketNode.setAttribute( "type", "terminate" );
            errorPacketNode.setAttribute( "condition", condition );

            try {
                this.handleErrors( errorPacketNode );
            } catch(e) {
                this.shutdown();
            }
        } else {
          try {

              var packetNode = new DOMImplementation().loadXML( response.responseText ).documentElement;

                
              // this will throw an exception if there is an error.
              this.handleErrors( packetNode );

              this.fireEvent( "recv", packetNode );
          } catch(e) {
              this.shutdown();
          }
        }
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Transport.BOSH, Xmpp4Js.Transport.Base, Xmpp4Js.Transport.BOSH.prototype );
