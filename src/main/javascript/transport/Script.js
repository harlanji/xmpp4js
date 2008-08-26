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
Xmpp4Js.Transport.Script = function(config) {
    
    // support wild card hosts to get around the 2 connection
    // limit
    if( config.endpoint.indexOf('*') > -1 ) {
        var rand = parseInt(Math.random() * 10000); // 4 digits of random
        config.endpoint = config.endpoint.replace('*', rand);
    }
    
    /**
     * @private
     * @type String
     */
    this.endpoint = config.endpoint;
    
    var superConfig = config;
    
        // TODO handle multiple connections...
        window._BOSH_ = function(xml) {
            this.onWriteResponse(xml);
        }.bind(this);
        
    
    Xmpp4Js.Transport.Script.superclass.constructor.call( this, config );
}

Xmpp4Js.Transport.Script.logger = Xmpp4Js.createLogger( "xmpp4js.transport.script" );    
    
Xmpp4Js.Transport.Script.prototype = {

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
;;;     Xmpp4Js.Transport.Script.logger.debug( "Writing packet. rid="+packetNode.getAttribute("rid") );

        var xml = packetNode.toString();
        
        // TODO check for max length constraints in browsers
        // HACK substr(5) takes out body=; there should be a method to
        //      only encode the right-hand side of the params.
        var requestUrl = this.endpoint+"?"+Xmpp4Js.Lang.urlEncode(xml);
        
        var scriptElem = document.createElement( "script" );
        scriptElem.setAttribute( "type", "text/javascript" );
        scriptElem.setAttribute( "src", requestUrl );
        scriptElem.setAttribute( "id", "xmpp4js"+"."+this.sid+"."+packetNode.getAttribute("rid") );

        // remove the script element when it's been loaded.
        if(scriptElem.addEventListener) {
            scriptElem.addEventListener("load", this.onScriptLoad.bind(this, scriptElem), false );
            scriptElem.addEventListener("error", this.onScriptError.bind(this, scriptElem), false );
        } else {
            scriptElem.onreadystatechange = function() {
                if(scriptElem.readyState == 4 || scriptElem.readyState == "loaded") {
                    this.onScriptLoad( scriptElem );
                }
                // TODO add error...
            }.bind(this);
        }

        document.body.appendChild( scriptElem );
    },
    
    onScriptLoad: function(scriptElem) {
            document.body.removeChild( scriptElem );
    },
    
    onScriptError: function(scriptElem) {
        if( this.isPausing ) { 
;;;         Xmpp4Js.Transport.Script.logger.debug( "Script error while pausing. Ignoring error." );
            return;     
        } 
;;;     Xmpp4Js.Transport.Script.logger.error( "Deprecated HTTP code script error." );

        document.body.removeChild( scriptElem );

        // we can't find out anything about what the error is. 
        var condition = "undefined-condition";

        var title = "Unknown Error";
        var message = "There was an unknown error with the connection.";

        var packetNode = this.createPacketNode();
        packetNode.setAttribute( "type", "terminate" );
        packetNode.setAttribute( "condition", condition );

        try {
          this.handleErrors( packetNode );
        } catch(e) {
            this.shutdown();
        }
    },
    
    /**
     * Handles the response to a write call.
     *
     * Decrements the openRequestCount that was incremented in write.
     * @private
     */
    onWriteResponse: function( xml ) {
;;;     Xmpp4Js.Transport.Script.logger.debug( "Got write response." );
        this.openRequestCount--;
        
        // TODO character replacement (18.3)?
        var packetNode = new DOMImplementation().loadXML( xml ).documentElement;
        
        try {
            // this will throw an exception if there is an error.
            this.handleErrors( packetNode );
            
            this.fireEvent( "recv", packetNode );
        } catch(e) {
            this.shutdown();
        }
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Transport.Script, Xmpp4Js.Transport.Base, Xmpp4Js.Transport.Script.prototype );
