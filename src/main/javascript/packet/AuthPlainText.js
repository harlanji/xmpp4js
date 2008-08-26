Xmpp4Js.Lang.namespace( "Xmpp4Js.Packet" );

/**
 * Constructs a Presence packet if the Packet.Base constructor doesn't
 * handle it.
 * 
 * @param {Object} username
 * @param {Object} password
 * @param {Object} resource
 * @constructor
 * @extends Xmpp4Js.Packet.IQ
 */
Xmpp4Js.Packet.AuthPlainText = function( username, password, resource ) {
    var doc = Xmpp4Js.Packet.getDocument();
    
    Xmpp4Js.Packet.AuthPlainText.superclass.constructor.call( this, null, "set", "jabber:iq:auth" );
    
    var query = this.getQuery();
    // FIXME see if Prototype can make this easier...
    query.appendChild( doc.createElement( "username" ) ).appendChild( doc.createTextNode(username) );
    query.appendChild( doc.createElement( "password" ) ).appendChild( doc.createTextNode(password) );
    query.appendChild( doc.createElement( "resource" ) ).appendChild( doc.createTextNode(resource) );
    query.appendChild( doc.createElement( "plaintext" ) );
}

Xmpp4Js.Packet.AuthPlainText.prototype = {
    /**
     * @deprecated see Xmpp4Js.Workflow.Login
     */
    send : function( con ) {
        this.setTo( con.domain );
        con.send( this, function( responseIq ) {
            if( responseIq.getType() == 'error' ) {
                con.fireEvent( "autherror" );
            } else { 
                //alert( "plaintext auth succes with packet, evens" );
                con.jid = responseIq.getTo();
                // FIXME this is legacy for JSJaC... onconnect should happen on connect
                con.fireEvent( "onconnect" );
                con.fireEvent( "onauth" );
            }
        } );
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.Packet.AuthPlainText, Xmpp4Js.Packet.IQ, Xmpp4Js.Packet.AuthPlainText.prototype);
