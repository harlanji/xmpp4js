Xmpp4Js.Lang.namespace( "Xmpp4Js.Packet" );

/**
 * Constructs a Registration packet given a username, password, etc.
 * 
 * @constructor
 * @extends Xmpp4Js.Packet.IQ
 */
Xmpp4Js.Packet.Registration = function( to, fields ) {
    Xmpp4Js.Packet.Registration.superclass.constructor.call( this, to, "set", "jabber:iq:register" );

	var queryNode = this.getQuery();
	
	for( var k in fields ) {
	    var child = queryNode.ownerDocument.createElement( k );
	    child.setTextContent( fields[k] );
	
	    queryNode.appendChild( child );
	}
	
	// in addition to fields, add a plaintext element
	queryNode.appendChild( queryNode.ownerDocument.createElement( "plaintext" ) );
}

Xmpp4Js.Packet.Registration.prototype = {
	// TODO a programatic way to modify fields should be built, and also
	// a way to get result if this is a result packet (registered with stanza provider).
}

Xmpp4Js.Lang.extend( Xmpp4Js.Packet.Registration, Xmpp4Js.Packet.IQ, Xmpp4Js.Packet.Registration.prototype);
