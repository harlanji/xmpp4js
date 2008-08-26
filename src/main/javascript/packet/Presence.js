Xmpp4Js.Lang.namespace( "Xmpp4Js.Packet" );

/**
 * Constructs a Presence packet if the Xmpp4Js.Packet.Base constructor doesn't
 * handle it.
 * 
 * @constructor
 * @extends Xmpp4Js.Packet.Base
 * @param {Object} type
 */
Xmpp4Js.Packet.Presence = function( type, to, status, show, priority ) {
    var doc = Xmpp4Js.Packet.getDocument();
    
    var node = doc.createElement( "presence" );
    Xmpp4Js.Packet.Presence.superclass.constructor.call( this, node )
    
    if( to ) { this.setTo( to ); }
    if( type ) { this.setType( type ); }
    this.setPresence( show, status, priority );
}

Xmpp4Js.Packet.Presence.prototype = {
    
    getType : function() {
    	var type = this.elem.getAttribute( "type" ).toString();
        return type ? type : "available";
    },
    
    /**
     * 
     * @param {String} status
     */
    setStatus : function( content ) {
        this.setChildElementContent( "status", content );
    },
    
    getStatus : function() {
        return this.getChildElementContent( "status" );
    },
    
    /**
     * 
     * @param {String} show
     */
    setShow : function( content ) {
        this.setChildElementContent( "show", content );
    },
    
    getShow : function() {
        return this.getChildElementContent( "show", "normal" );
    },
    
    setPriority : function( content ) {
        this.setChildElementContent( "priority", content );
    },
    
    getPriority : function() {
        return this.getChildElementContent( "priority", "5" );
    },
    
    /**
     * Legacy from JSJaC
     * @param {String} show
     * @param {String} status
     * @param {String} priority
     * @deprecated
     */
    setPresence : function( show, status, priority ) {
        if( show != null ) { this.setShow(show); }
        if( status != null ) { this.setStatus(status); }
        if( priority != null ) { this.setPriority(priority); }
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Packet.Presence, Xmpp4Js.Packet.Base, Xmpp4Js.Packet.Presence.prototype);
