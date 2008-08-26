Xmpp4Js.Lang.namespace( "Xmpp4Js.Ext" );

/**
 * Add an extension to a packet. It is currently unique per extension namespace
 * and has an extension instance bound to a packet instance, specifically because
 * of how the chat states extension is specified. The element name can change,
 * and thus it isn't predictable what the element name will be when it's time
 * to parse.
 * @constructor
 */
Xmpp4Js.Ext.PacketExtension = function(stanza) {
    this.stanza = stanza;
}

Xmpp4Js.Ext.PacketExtension.prototype = {
    getElementName : function() {
        return "x";
    },
    getElementNS : function() {
        throw new Error( "getElementNS is not defined" );
    },
    
    getNode : function() {
        return this.elem;
    },
    
    createNode : function() {
        var doc = this.stanza.getNode().ownerDocument;
        this.elem = this.stanza.getNode().appendChild( doc.createElementNS( this.getElementNS(), this.getElementName() ) );
    },
    
    readNode : function() {
        //this.elem = stanza.getNode().getElementsByTagNameNS( this.getElementNS(), this.getElementName() )[0];
        var nodes = this.stanza.getNode().childNodes;
        for( var i = 0; i < nodes.getLength(); i++ ) {
            var child = nodes.item(i);
            if( child.namespaceURI == this.getElementNS() ) {
                this.elem = child;
                break;
            }
        }
    },
    
    /**
     * sets internal node reference and updates packet document. this is only
     * needed in cases where the root element/ns changes, such as for the
     * chat states extensions--setState requires the root element to change.
     * In a case like message event, only a child of the root element
     * changes so this isn't necessary. ||| NOT Else, it should only be called in the
     * constructor.|||
     */
    setNode : function(node) {
        
        // TODO should try block be refactored to inside removeNode?
        try {
            this.removeNode();
        } catch(e) {
            // no big deal, node hasn't been added yet.
        }
        
        var stanzaNode = this.stanza.getNode();
        this.elem = stanzaNode.appendChild( node );
    },
    removeNode : function() {
        var parentNode = this.stanza.getNode();
        parentNode.removeChild( this.getNode() );
    }  
}

/**
 * @constructor
 */
Xmpp4Js.Ext.PacketExtensionProvider = function() {
    this.providers = [];
}

Xmpp4Js.Ext.PacketExtensionProvider.prototype = {
    register : function(elemNS, clazz) {
        this.providers.push( {
            ns: elemNS,
            clazz: clazz
        } );
    },
    create : function( elemNS, stanza ) {
        var clazz = this.get( elemNS );
        
        if( !clazz ) {
            throw new Error( "No class registered for NS: " + elemNS );
        }
        
        var ext = new clazz(stanza);
        var args = Array.prototype.slice.call(arguments);
        // knock the first two args off the beginning.
        args.shift();
        args.shift();
        
        ext.createNode.apply(ext, args);
        
        return ext;
    },
    read : function( elemNS, stanza ) {    
        var clazz = this.get( elemNS );
        
        if( !clazz ) {
            throw new Error( "No class registered for NS: " + elemNS );
        }
        
        var ext = new clazz(stanza);
        ext.readNode();
        
        return ext;
    },
    
    readAll : function(stanza) {
        var extensions = [];
        
        var children = stanza.getNode().childNodes;
        for( var i = 0; i < children.getLength(); i++ ) {
            var child = children.item(i);
            
            try {
                var ext = this.read( child.namespaceURI, stanza );
            
                extensions.push( ext );
            } catch(e) {
                // no such extension... no big deal.
            }
        }
        return extensions;
    },
    get : function( elemNS ) {
        for( var j = 0; j < this.providers.length; j++ ) {
            var prov = this.providers[j];
            
            if( prov.ns == elemNS ) {
                return prov.clazz;
            }
        }
    }
};

/**
 * @constructor
 * @extends Xmpp4Js.Ext.PacketExtension
 */
Xmpp4Js.Ext.ChatStates = function(stanza) {
    Xmpp4Js.Ext.ChatStates.superclass.constructor.call( this, stanza );
}

Xmpp4Js.Ext.ChatStates.XMLNS = "http://jabber.org/protocol/chatstates";

Xmpp4Js.Ext.ChatStates.prototype = {
    getElementNS : function() {
        return Xmpp4Js.Ext.ChatStates.XMLNS;
    },
    getElementName : function() {
        return this.state;
    },
    
    setState : function(state) {
        this.state = state;
        
        // add the new state
        var doc = this.getNode().ownerDocument;
        var node = doc.createElementNS( this.getElementNS(), this.getElementName() );

        this.setNode( node );
        
        
    },
    
    getState : function() {
        return this.state;
    },
    
    readNode : function() {
        Xmpp4Js.Ext.ChatStates.superclass.readNode.call( this );
        
        this.state = this.getNode().nodeName;
    },
    createNode : function(state) {
        // since getElementName returns this.state, and createNode creates
        // a node of name this.getElementName, we must provide state right now.
        if( !state ) {
            throw new Error( "state must be provided" );
        }
        
        this.state = state;
        Xmpp4Js.Ext.ChatStates.superclass.createNode.call(this);
        
        /*if( state ) {
            this.setState(state);
        }*/
    }
    
};

Xmpp4Js.Lang.extend( Xmpp4Js.Ext.ChatStates, Xmpp4Js.Ext.PacketExtension, Xmpp4Js.Ext.ChatStates.prototype);

/**
 * @constructor
 * @extends Xmpp4Js.Ext.PacketExtension
 */
Xmpp4Js.Ext.Error = function(stanza, code, type) {
    this.code = code;
    this.type = type;
    
    Xmpp4Js.Ext.Error.superclass.constructor.call( this, stanza );
}

Xmpp4Js.Ext.Error.XMLNS = "jabber:client";

Xmpp4Js.Ext.Error.prototype = {
    getElementNS : function() {
        return Xmpp4Js.Ext.Error.XMLNS;
    },
    getElementName : function() {
        return "error";
    },
    
    setCode : function(code) {
        this.code = code;
        
        // add the new state
        this.getNode().setAttribute( "code", this.code);
    },
    
    getCode : function() {
        return this.code;
    },
    
    setType : function(code) {
        this.type = type;
        
        // add the new state
        this.getNode().setAttribute( "type", this.type);
    },
    
    getType : function() {
        return this.type;
    },
    
    readNode : function() {
        Xmpp4Js.Ext.Error.superclass.readNode.call( this );
        
        this.code = this.getNode().getAttribute( "code").toString();
        this.type = this.getNode().getAttribute( "type").toString();
    },
    createNode : function(code, type) {
        // since getElementName returns this.state, and createNode creates
        // a node of name this.getElementName, we must provide state right now.
        if( !code ) {
            throw new Error( "code must be provided" );
        }
        
        if( !type ) {
            throw new Error( "type must be provided" );
        }
        
        this.code = code;
        this.type = type;
        Xmpp4Js.Ext.Error.superclass.createNode.call(this);
        
    }
    
}

Xmpp4Js.Lang.extend( Xmpp4Js.Ext.Error, Xmpp4Js.Ext.PacketExtension, Xmpp4Js.Ext.PacketExtension.prototype);

/**
 * @constructor
 * @extends Xmpp4Js.Ext.PacketExtension
 */
Xmpp4Js.Ext.MessageEvent = function(stanza, event) {
    Xmpp4Js.Ext.MessageEvent.superclass.constructor.call( this, stanza );

    if( event ) {
        this.setEvent( event );
    }
}

Xmpp4Js.Ext.MessageEvent.XMLNS = "jabber:x:event";

Xmpp4Js.Ext.MessageEvent.EVENT_EMPTY = null;

Xmpp4Js.Ext.MessageEvent.prototype = {
    
    getElementNS : function() {
        return Xmpp4Js.Ext.MessageEvent.XMLNS;
    },
    setEvent : function(event) {
        if( this.event ) {
            // remove the current event if not null / Xmpp4Js.Ext.MessageEvent.EVENT_EMPTY
            var node = this.elem.getElementsByTagName( this.event ).item(0);
            this.getNode().removeChild( node );
        } 
        
        // add the new state
        if( event ) {
            // append a new node if not empty
            this.getNode().appendChild( this.elem.ownerDocument.createElement( event ) );
        }
        
        this.event = event;       
    },
    
    getEvent : function() {
        return this.event;
    },
    
    readNode : function() {
        Xmpp4Js.Ext.MessageEvent.superclass.readNode.call( this );
        
        // FIXME this is potentially flaky... if there are text nodes, etc.
        var eventNode = this.getNode().firstChild;
        this.event = eventNode ? eventNode.nodeName : Xmpp4Js.Ext.MessageEvent.EVENT_EMPTY;
    },
    createNode : function(event) {
        Xmpp4Js.Ext.MessageEvent.superclass.createNode.call(this);
        
        if( !event ) {
            event = Xmpp4Js.Ext.MessageEvent.EVENT_EMPTY;
        }
        this.setEvent( event );
    }
};

Xmpp4Js.Lang.extend( Xmpp4Js.Ext.MessageEvent, Xmpp4Js.Ext.PacketExtension, Xmpp4Js.Ext.MessageEvent.prototype );

