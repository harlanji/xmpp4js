Xmpp4Js.Lang.namespace( "Xmpp4Js.Muc" );

/**
 * Base for any muc related error
 * @constructor
 */
Xmpp4Js.Muc.MucError = function(code) {
    this.code = code
}

/**
 * MUC join error
 * @constructor
 * @extends Xmpp4Js.Muc.MucError
 */
Xmpp4Js.Muc.JoinError = function(code) {
    Xmpp4Js.Muc.JoinError.superclass.constructor.call( this, code );
}

Xmpp4Js.Muc.JoinError.prototype = {};

Xmpp4Js.Lang.extend( Xmpp4Js.Muc.JoinError, Xmpp4Js.Muc.MucError, Xmpp4Js.Muc.JoinError.prototype);
