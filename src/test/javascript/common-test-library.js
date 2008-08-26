// =========================================================================
//       Utils
// =========================================================================


var MockRequest = function(config) {
    this.options = {};
    this.transId = 1;
    
    this.addEvents({
        "beforerequest" : true,
        "requestcomplete" : true,
        "requestexception" : true
    });
    
    this.response = {
        responseText: "",
        responseXML: undefined,
        responseCode: 200,
        headers: []
    };
};

Xmpp4Js.Lang.extend( MockRequest, Xmpp4Js.Event.EventProvider, {
    request: function(options) {
            this.fireEvent( "beforerequest", this, options );
            
            return this.transId++;
    },
    
    // this is a method specific to the mock
    respond: function(doc, status, text ) {
        if( doc != null && doc.nodeType != 9 /* 9 = document */) {
            var realDoc = createDocument();
            var node = realDoc.importNode( doc, true );
            realDoc.appendChild( node );
            
            doc = realDoc;
        }
        
        var response = {
            status: status ? status : 200,
            responseText: text,
            responseXML: doc,
            readyState: 4
        };
        if( response.status == 200 ) {
            this.fireEvent( "requestcomplete", this, response, this.options );
        } else {
            this.fireEvent( "requestexception", this, response, this.options );
        }
    }
});


var MockBOSHTransport = function(){
    MockBOSHTransport.superclass.constructor.apply( this, arguments );
}

Xmpp4Js.Lang.extend(MockBOSHTransport, Xmpp4Js.Transport.BOSH, {
    
    /**
     * Overrides default functionality to create a MockRequest
     */
     createXhr: function() {
        return new MockRequest();
    },
    
    /**
     * Provides access to the protected xml http request
     */
    getXhr: function() {
        return this.xhr;
    },
    
    /**
     * Overrides default functionality to not start any tasks
     */
    startup: function() {
        this.isSessionOpen = true;
    },
    
    /**
     * Overrides default functionality to not stop any tasks
     */ 
    shutdown: function() {
        this.isSessionOpen = false;
    },
    
    /**
     * Overrides default functionality by calling super.send and then calling
     * sendQueue explicitly, since the sendQueueTask isn't running.
     */
    send: function() {
        MockBOSHTransport.superclass.send.call( this, arguments );
        this.sendQueue();
    },
    
    beginSession: function() {
        MockBOSHTransport.superclass.beginSession.call( this );
        
        var packetNode = DomBuilder.node( "body", {
            xmlns: "http://jabber.org/protocol/httpbind",
            sid: "1234",
            requests: "2",
            hold: "1",
            wait: "60"
        });

        this.onBeginSessionResponse( packetNode );
    }
});


function TestTransport(config) {
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
        endsession: true
    });
    
    TestTransport.superclass.constructor.call( this, config );
}

TestTransport.prototype = {
    beginSession: function() {
        this.fireEvent( "beginsession" );
    },
    
    endSession: function() {
        this.fireEvent( "endsession" );
    },
    
    send: function(node) {
        this.queue.push( node );
    },
    
    write: function(packetNode) {

    },
    
    createPacketNode: function() {
        var packetNode = DomBuilder.node( "body", {
                xmlns: "http://jabber.org/protocol/httpbind"
            }
        );
        
        return packetNode;
    },
    
    /**
     * This basically has BOSH onWriteResponse code wrapped up. It should be
     * refactored, I suppose.
     */
    respond: function(doc, status, text ) {
        if( doc != null && doc.nodeType != 9 /* 9 = document */) {
            var realDoc = createDocument();
            var node = realDoc.importNode( doc, true );
            realDoc.appendChild( node );
            
            doc = realDoc;
        }
        
        var response = {
            status: status ? status : 200,
            responseText: text,
            responseXML: doc,
            readyState: 4
        };
        

        var packetNode = null;
        if( response.responseXML != null ) {
            packetNode = response.responseXML.documentElement;
        }

        if( response.status != 200 ) {
            var condition = null;
            if( packetNode != null ) {
                condition = packetNode.getAttribute( "condition" ).toString();
            } else if( response.status != 200 ){
                condition = "status."+response.status;
            } else {
                condition = "undefined-condition";
            }
            
            var title = Xmpp4Js.PacketFilter.TerminalErrorPacketFilter.conditions[ condition ].title;
            var message = Xmpp4Js.PacketFilter.TerminalErrorPacketFilter.conditions[ condition ].message;

            this.fireEvent( "termerror", title, message, packetNode );
        } else if( packetNode.getAttribute("type").toString() == "error" ) {
            this.fireEvent( "error", packetNode );
        } else {
            this.fireEvent( "recv", packetNode );
        }
    }
}

Xmpp4Js.Lang.extend( TestTransport, Xmpp4Js.Event.EventProvider, TestTransport.prototype );



function loadTestPacket( file, filter ) {
        var xhreq = new XMLHttpRequest();
        xhreq.open("GET", file, false);
        xhreq.send(null);
        
        var doc = new DOMImplementation().loadXML( xhreq.responseText )
        
	var packet = doc.documentElement;
	
	if(filter) {
		filter(packet);
	}
	
	return packet;
}


function MockConnection() {
    this.addEvents({
        connect: true,
        close: true,
        error: true
    });
    
    this.id = Xmpp4Js.Lang.id();
    this.packetHelper = new Xmpp4Js.Packet.PacketHelper();
    this.connected = false;
    this.jid = null;
    this.sentPackets = [];

    this.stanzaProvider = new Xmpp4Js.Packet.StanzaProvider();
    this.stanzaProvider.registerDefaultProviders();

    this.packetListenerManager = new Xmpp4Js.PacketListenerManager({
        stanzaProvider: this.stanzaProvider
    });
}

MockConnection.prototype = {
    connect: function(domain, port, server) {
        this.jid = "test@test.com/test";
        this.fireEvent( "connect" );
    },

    close: function() {
        this.jid = null;
        this.fireEvent( "close" );
    },

    send: function(packet, callback) {
        this.sentPackets.push( packet );
    },

    isConnected: function() {
        return this.connected;
    },

    addPacketListener : function( listener, filter ) {
        return this.packetListenerManager.addPacketListener( listener, filter );
    },

    removePacketListener : function( listener ) {
        return this.packetListenerManager.removePacketListener( listener );
    },
    
    getPacketListenerManager : function() {
        return this.packetListenerManager;
    },

    onRecv: function(packetNode) {
        this.packetListenerManager.run( packetNode ); 
    },

    getPacketHelper: function() {
        return this.packetHelper;
    },
    getJid : function() {
        return new Xmpp4Js.Jid(this.jid);	
    }
}

function mapLength(map) {
    var length = 0;
    for(var k in map) {
        length++;
    }
    return length;
}

Xmpp4Js.Lang.extend( MockConnection, Xmpp4Js.Event.EventProvider, MockConnection.prototype );
