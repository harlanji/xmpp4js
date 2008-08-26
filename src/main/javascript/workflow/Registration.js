Xmpp4Js.Lang.namespace( "Xmpp4Js.Workflow" );

/**
 * @class Encapsulates the login process for a given connection. 
 *        TODO look into whether a connection may authenticate multuiple times
 *             and cleanly change credentials. If not, throw an error if we're
 *             already authenticated.
 * @param {Object} config Specify con.
 */
Xmpp4Js.Workflow.Registration = function(config) {
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
    
    /**
     * The address to send the request to. Default to JID of conn
     * @private
     */
    this.toJid = config.toJid || this.con.jid;

    this.addEvents({
        /**
         * @event success
         * The registration was successful.
         * TODO make more specific details be returned: jid, password, etc
         * @param {Xmpp4Js.Packet.IQ} responseIq
         */
        success: true,
        /**
         * @event failure
         * The registration failed.
         * TODO make more specific details be returned: code, message
         * @param {Xmpp4Js.Packet.IQ} responseIq
         */
        failure: true
    });
    
    Xmpp4Js.Workflow.Registration.superclass.constructor.call( this, config );
}

Xmpp4Js.Workflow.Registration.prototype = {
    /**
     * @param {Object} fields An object with username, password, etc.
     */
    start: function(fields) {
        var iq = new Xmpp4Js.Packet.Registration(this.toJid, fields );
        this.con.send( iq, this.onRegResponse.bind(this) );
    },
    
    /**
     * @private
     */
    onRegResponse: function(responseIq) {
        if( responseIq.getType() == "error" ) {
            this.fireEvent( "failure", responseIq );
        } else if( responseIq.getType() == "result" ) {
            this.fireEvent( "success", responseIq );
        }
    }
};

Xmpp4Js.Lang.extend( Xmpp4Js.Workflow.Registration, Xmpp4Js.Event.EventProvider, Xmpp4Js.Workflow.Registration.prototype );
