Xmpp4Js.Lang.namespace( "Xmpp4Js.Workflow" );

/**
 * @class Encapsulates the login process for a given connection. 
 *        TODO look into whether a connection may authenticate multuiple times
 *             and cleanly change credentials. If not, throw an error if we're
 *             already authenticated.
 * @param {Object} config Specify con.
 */
Xmpp4Js.Workflow.Login = function(config) {
    /**
     * @private
     * @type Xmpp4Js.Connection
     */
    this.con = config.con;
         
    /**
     * Picked up by Observable.
     * @private
     */
    this.listeners = config.listeners;

    this.addEvents({
        /**
         * @event success
         * The login was successful.
         * TODO make more specific details be returned: jid
         * @param {Xmpp4Js.Packet.IQ} responseIq
         */
        success: true,
        /**
         * @event failure
         * The login failed.
         * TODO make more specific details be returned: code, message
         * @param {Xmpp4Js.Packet.IQ} responseIq
         */
        failure: true
    });
    
    Xmpp4Js.Workflow.Login.superclass.constructor.call( this, config );
}

Xmpp4Js.Workflow.Login.prototype = {
    /**
     * Sent an AuthPlainText packet constructed with passed arguments (resource 
     * is xmpp4js if none is specified). Intercept the response and fire 'success'
     * or 'failure' events accordingly.
     */
    start: function(type, username, password, resource) {
        if( !resource ) { resource = 'xmpp4js'; };
        
        if( type=="plaintext" ) {
            this.authPlaintext( username, password, resource );
        } else if( type == "anon" ) {
            this.authAnon();
        }

    },
    
    authPlaintext: function( username, password, resource ) {
        var iq = new Xmpp4Js.Packet.AuthPlainText( username, password, resource );


        iq.setTo( this.con.domain /* FIXME getDomain */ );
        this.con.send( iq, function( responseIq ) {
            if( responseIq.getType() == "error" ) {
                this.fireEvent( "failure", responseIq );
            } else {
                // FIXME this is borderline between belonging here and
                //       belonging as a listener in Connection. we surely
                //         should at least have a setJid or setCredentials method.
                this.con.jid = responseIq.getTo();
                
                this.fireEvent( "success", responseIq );
            }
        }.bind(this) );
    },
    
    authAnon: function() {
        var iq = new Xmpp4Js.Packet.IQ( this.domain, "set", "jabber:iq:auth" );

        this.con.send( iq, function( responseIq ) {
            if( responseIq.getType() == 'error' ) {
                this.fireEvent( "failure", responseIq );
            } else { 
                // FIXME this is borderline between belonging here and
                //       belonging as a listener in Connection. we surely
                //         should at least have a setJid or setCredentials method.
                this.con.jid = responseIq.getTo();
                
                this.fireEvent( "success", responseIq );
            }
        }.bind(this) );
    }
};

Xmpp4Js.Lang.extend( Xmpp4Js.Workflow.Login, Xmpp4Js.Event.EventProvider, Xmpp4Js.Workflow.Login.prototype );
