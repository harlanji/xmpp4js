Xmpp4Js.Lang.namespace( "Xmpp4Js.PacketFilter" );

/**
 * Filter for XEP-0124 17.2 Terminal Binding Conditions
 * @constructor
 * @extends Xmpp4Js.PacketFilter.RawPacketFilter
 */
Xmpp4Js.PacketFilter.TerminalErrorPacketFilter = function() {

}
/**
 * 17.2, Table 3: Terminal Binding Error Conditions
 */
Xmpp4Js.PacketFilter.TerminalErrorPacketFilter.conditions = {
    "bad-request" : {
        title: "bad-request",
        message : "The format of an HTTP header or binding element received from the client is unacceptable (e.g., syntax error), or Script Syntax is not supported." 
    },
    "status.400" : {
        title: "bad-request",
        message : "The format of an HTTP header or binding element received from the client is unacceptable (e.g., syntax error), or Script Syntax is not supported." 
    },
    "host-gone" : {
        title: "host-gone",
        message : "The target domain specified in the 'to' attribute or the target host or port specified in the 'route' attribute is no longer serviced by the connection manager." 
    },
    "host-unknown" : {
        title: "host-unknown",
        message : "The target domain specified in the 'to' attribute or the target host or port specified in the 'route' attribute is unknown to the connection manager." 
    },
    "improper-addressing" : {
        title: "improper-addressing",
        message : "The initialization element lacks a 'to' or 'route' attribute (or the attribute has no value) but the connection manager requires one." 
    },
    "internal-server-error" : {
        title: "internal-server-error",
        message : "The connection manager has experienced an internal error that prevents it from servicing the request." 
    },
    "item-not-found" : {
        title: "item-not-found*",
        message : "(1) 'sid' is not valid, (2) 'stream' is not valid, (3) 'rid' is larger than the upper limit of the expected window, (4) connection manager is unable to resend response, (5) 'key' sequence is invalid" 
    },
    "status.404" : {
        title: "item-not-found*",
        message : "(1) 'sid' is not valid, (2) 'stream' is not valid, (3) 'rid' is larger than the upper limit of the expected window, (4) connection manager is unable to resend response, (5) 'key' sequence is invalid" 
    },
    "other-request" : {
        title: "other-request",
        message : "Another request being processed at the same time as this request caused the session to terminate." 
    },
    "policy-violation" : {
        title: "policy-violation",
        message : "The client has broken the session rules (polling too frequently, requesting too frequently, too many simultaneous requests)." 
    },
    "status.403" : {
        title: "policy-violation",
        message : "The client has broken the session rules (polling too frequently, requesting too frequently, too many simultaneous requests)." 
    },
    "remote-connection-failed" : {
        title: "remote-connection-failed",
        message : "The connection manager was unable to connect to, or unable to connect securely to, or has lost its connection to, the server." 
    },
    "remote-stream-error" : {
        title: "remote-stream-error",
        message : "Encapsulates an error in the protocol being transported." 
    },
    "see-other-uri" : {
        title: "see-other-uri",
        message : "The connection manager does not operate at this URI (e.g., the connection manager accepts only SSL or TLS connections at some https: URI rather than the http: URI requested by the client). The client may try POSTing to the URI in the content of the <uri/> child element." 
    },
    "system-shutdown" : {
        title: "system-shutdown",
        message : "The connection manager is being shut down. All active HTTP sessions are being terminated. No new sessions can be created." 
    },
    "undefined-condition" : {
        title: "undefined-condition",
        message : "The error is not one of those defined herein; the connection manager SHOULD include application-specific information in the content of the <body/> wrapper." 
    }
}

Xmpp4Js.PacketFilter.TerminalErrorPacketFilter.prototype = {
    accept : function(bodyElement) {
        return bodyElement.getAttribute( "type" ).toString() == "terminate" && Xmpp4Js.PacketFilter.TerminalErrorPacketFilter.conditions[ bodyElement.getAttribute("condition").toString() ] != undefined;
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.PacketFilter.TerminalErrorPacketFilter, Xmpp4Js.PacketFilter.RawPacketFilter, Xmpp4Js.PacketFilter.TerminalErrorPacketFilter.prototype);

/**
 * Filter for XEP-0124 17.3 Recoverable Binding Conditions
 *
 * In any response it sends to the client, the connection manager MAY return a 
 * recoverable error by setting a 'type' attribute of the <body/> element to 
 * "error". These errors do not imply that the HTTP session is terminated.

 * If it decides to recover from the error, then the client MUST repeat the 
 * HTTP request and all the preceding HTTP requests that have not received 
 * responses. The content of these requests MUST be identical to the 
 * <body/> elements of the original requests. This allows the 
 * connection manager to recover a session after the previous 
 * request was lost due to a communication failure.
 * @constructor
 * @extends Xmpp4Js.PacketFilter.RawPacketFilter
 */
Xmpp4Js.PacketFilter.RecoverableErrorPacketFilter = function() {

}

Xmpp4Js.PacketFilter.RecoverableErrorPacketFilter.prototype = {
    accept : function(bodyElement) {
        return bodyElement.getAttribute( "type" ).toString() == "error";
    }
}

Xmpp4Js.Lang.extend( Xmpp4Js.PacketFilter.RecoverableErrorPacketFilter, Xmpp4Js.PacketFilter.RawPacketFilter, Xmpp4Js.PacketFilter.RecoverableErrorPacketFilter.prototype);
