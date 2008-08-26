Xmpp4Js.Lang.namespace( "Xmpp4Js.Packet" );

/**
 * Constructs a Presence packet if the Packet.Base constructor doesn't
 * handle it.
 * 
 * @constructor
 * @extends Xmpp4Js.Packet.Base
 * @param {Object} to
 * @param {Object} type
 * @param {Object} body
 */
Xmpp4Js.Packet.Message = function( to, type, body, subject ) {
    var doc = Xmpp4Js.Packet.getDocument();
    
    var node = doc.createElement( "message" );
    Xmpp4Js.Packet.Message.superclass.constructor.call( this, node );

    if( to ) { this.setTo( to ); }
    if( type ) { this.setType( type ); }
    if( body != null ) { this.setBody( body ); }
    if( subject != null ) { this.setSubject( subject ); }
}

Xmpp4Js.Packet.Message.prototype = {
    /**
     * 
     * @param {Object} Element or string containing body content.
     */
    setBody : function( content ) {
        this.setChildElementContent( "body", content );
        
    },
    getBodyNode : function() {
        return this.getChildElementNode("body");
    },
    getBody : function() {
        return this.getChildElementContent("body");
    },
    
    /**
     * 
     * @param {String} subject
     */
    setSubject : function( content ) {
        this.setChildElementContent( "subject", content );
    },
    getSubjectNode : function() {
        return this.getChildElementNode("subject");
    },
    getSubject : function() {
        return this.getChildElementContent("subject");
    },
    
    
    /**
     * 
     * @param {String} subject
     */
    setThread : function( content ) {
        this.setChildElementContent( "thread", content );
        
    },
    getThreadNode : function() {
        return this.getChildElementNode("thread");
    },
    getThread : function() {
        return this.getChildElementContent("thread");
    },
    
    hasContent : function() {
        var messageText = this.getBody();
        return messageText != null && messageText != undefined;
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Packet.Message, Xmpp4Js.Packet.Base, Xmpp4Js.Packet.Message.prototype);
