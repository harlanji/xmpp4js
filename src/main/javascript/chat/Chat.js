Xmpp4Js.Lang.namespace( "Xmpp4Js.Chat" );

/**
* @class A chat is a series of messages sent between two users. 
* Each chat has a unique thread ID, which is used to 
* track which messages are part of a particular 
* conversation. Some messages are sent without a 
* thread ID, and some clients don't send thread IDs 
* at all. Therefore, if a message without a thread 
* ID arrives it is routed to the most recently 
* created Chat with the message sender.
*
* @param {Xmpp4Js.Chat.ChatManager} chatMan
* @param {Xmpp4Js.Jid} jid
* @param {String} thread
*
* @constructor
*/
Xmpp4Js.Chat.Chat = function(chatMan, jid, thread) {
    jid = new Xmpp4Js.Jid( jid );
    
    /**
     * @type Xmpp4Js.Chat.ChatManager
     * @private
     */
    this.chatMan = chatMan;
    /**
     * @type Xmpp4Js.Jid
     * @private
     */
    this.participant = jid;
    /**
     * @type String
     * @private
     */
    this.thread = thread;
    
    this.addEvents({
        /**
        * @event messageReceived
        * Fires when a message is received.
        * @param {Xmpp4Js.Chat.Chat} chat the chat window
        * @param {Xmpp4Js.Packet.Message} message The incoming message
        */
        "messageReceived" : true,
        
        /**
        * @event messageSent
        * Fires when a message is sent.
        * @param {Xmpp4Js.Chat.Chat} chat the chat window
        * @param {Xmpp4Js.Packet.Message} message The incoming message
        */
        "messageSent" : true,

        /**
        * Fires when a chat is closed. At this point it only happens locally, with
        * a call to close(). If a new chat from the same user or with the same threadId
        * comes, it will be considered a new conversation and the chatStarted event
        * will be fired.
        */
        "close" : true
    });
}

Xmpp4Js.Chat.Chat.prototype = {
    /**
     * Send a message to the party in this message. Always to Jid and thread.
     * @param {Xmpp4Js.Packet.Message} msg
     */
    sendMessage : function( msg ) {
        if( !(msg instanceof Xmpp4Js.Packet.Message) ) {
            msg = this.createMessage( msg );
        }

        var toJid = this.getParticipant().withoutResource();

        // always set to and thread, no matter what the object says.
        msg.setToJid( toJid );
        msg.setThread( this.getThread() );

        this.chatMan.getConnection().send( msg );

        //hack
        //	this.con.stream.pw.flush();

        var messageText = msg.getBody();
        this.fireEvent("messageSent", this, msg);
    },

    /**
     * Returns the Jid of the message sender--obtained from the connection.
     * @see Xmpp4Js.JabberConnection#getJid
     * @return {Xmpp4Js.Jid}
     */
    getOutgoingJid : function() {
        return this.chatMan.getConnection().getJid();
    },

    /**
     * Creates a message associated with this chat session, including thread and to.
     * @param {String} message
     * @return Xmpp4Js.Packet.Message
     */
    createMessage : function( msg ) {
        var packetHelper = this.chatMan.getConnection().getPacketHelper();
        var msg = packetHelper.createMessage( this.participant, "chat", msg );
        msg.setThread( this.getThread() );

        return msg;
    },

    /**
     * Returns the Jid of the user the chat is with.
     * @return {Xmpp4Js.Jid} 
     */
    getParticipant : function() {
        return this.participant;
    },

    /**
     * Returns the thread ID of the current chat. Lazilly sets a thread if none exists
     * @return {String} The thread ID 
     */
    getThread : function() {
        if( !this.thread ) {
            this.thread = Math.random();
        }
        return this.thread;
    },
    
    /**
     * Closes a conversation. See ChatManager.closeChat for more info.
     * @see Xmpp4Js.Chat.ChatMan#closeChat
     */
    close : function() {
        this.chatMan.closeChat( this );
    }
};

Xmpp4Js.Lang.extend(Xmpp4Js.Chat.Chat, Xmpp4Js.Event.EventProvider, Xmpp4Js.Chat.Chat.prototype);
