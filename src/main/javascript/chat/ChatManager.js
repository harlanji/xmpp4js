Xmpp4Js.Lang.namespace( "Xmpp4Js.Chat" );

/**
 * Automatically registers events on connection.
 * @class Manages chat conversations for a given connection.
 * @constructor
 * @param {Xmpp4Js.JabberConnection} con The connection object to associate with.
 */
Xmpp4Js.Chat.ChatManager = function(con) {
    /** @private @type Xmpp4Js.JabberConnection */
    this.con = con;
    /** @private @type Map */
    this.threads = {};
    /** An array of Chat objects. @private @type Xmpp4Js.Chat.Chat */
    this.chats = [];
    
    this.addEvents({
        /**
        * Fires when a chat has been created. Does not include the message,
        * but gives GUI managers an opportunity to setup a listener before
        * the first messageReceived is called on the chat object.
        * 
        * @event chatStarted
        * @param chat {Xmpp4Js.Chat.Chat} The chat that was created
        */
        "chatStarted" : true,
        
        
        /**
        * Fires when a chat message was received (including first).
        * It is safe to assume that chatStarted will be invoked before this.
        * 
        * @event messageReceived
        * @param {Xmpp4Js.Chat.Chat} chat the chat window
        * @param {Xmpp4Js.Packet.Message} message The incoming message
        */
        "messageReceived" : true, 
        
        /**
        * Fires when a chat is closed. At this point it only happens locally, with
        * a call to close(). If a new chat from the same user or with the same threadId
        * comes, it will be considered a new conversation and the chatStarted event
        * will be fired.
        */
        "chatClosed" : true
    });	
    
    this._registerEvents();
}

/**
 * Options able to be set.
 */
Xmpp4Js.Chat.ChatManager.prototype = {
    options : {
        /** 
         * only applies to finding chats. internally they're still stored (option may change) 
         * @type boolean
         */
        ignoreResource: false,
        /** 
         * only applies to finding chats. internally they're still stored (option may change)
         * @type boolean
         */
        ignoreThread: false
    },

    /**
     * Register a packet listener on the connection associated with this ChatManager.
     * @private
     */
    _registerEvents : function() {
        this.con.addPacketListener( function(stanza) {			
            this._handleMessageReceived( stanza );
        }.bind(this), new Xmpp4Js.PacketFilter.PacketClassFilter( Xmpp4Js.Packet.Message ));		
    },

    /**
     * Handles raising events including chatStarted and messageReceived. 
     * Only watches for normal and chat message types.
     * @param {Xmpp4Js.Packet.Message} messagePacket The message packet
     * @private
     */
    _handleMessageReceived : function( messagePacket ) {

        if( messagePacket.getType() != "" && messagePacket.getType() != "normal" && messagePacket.getType() != "chat" ) {
            return;
        }

        var chat = null;
        var jid = messagePacket.getFromJid();
        var thread = messagePacket.getThread();

        try {
            chat = this.findBestChat( jid, thread );	
        } catch(e) {
            // couldn't find chat exception...
            // TODO check
            chat = this.createChat( jid, thread );
        }

        this.fireEvent( "messageReceived", chat, messagePacket );
        chat.fireEvent( "messageReceived", chat, messagePacket );
    },

    /**
     * Creates a new chat and returns it, and fires the chatStarted event.
     *
     * @param {Jid} jid
     * @param {Function} listener
     * @param (String) thread
     * @return Xmpp4Js.Chat.Chat
     */
    createChat : function (jid, thread, listener) {
        var chat = new Xmpp4Js.Chat.Chat( this, jid, thread );
        this.threads[ chat.getThread() ] = chat;
        this.chats.push( chat );

        this.fireEvent("chatStarted", chat);

        if( listener instanceof Function ) {
            chat.on( "messageReceived", listener );
        }

        return chat;
    },
    
    /**
     * Closes a given chat, and sends events. The chat will no longer be
     * available from getUserChat or getThreadChat. If a new chat from the 
     * same user or with the same threadId comes, it will be considered a 
     * new conversation and the chatStarted event will be fired.
     *
     * @param {Xmpp4Js.Chat.Chat} chat The chat object to close
     */
    closeChat : function(chat) {
        // assumes that the chat only exists once
        for( var i = 0; i < this.chats.length; i++ ) {
            if( chat == this.chats[i] ) {
                this.chats = this.chats.slice( i, i );
                break;
            }
        }
        
        delete this.threads[ chat.getThread() ];
        
        chat.fireEvent( "close", chat );
        this.fireEvent( "chatClosed", chat);
    },

    /**
     * Returns a chat by thread ID
     * @param {String} thread
     * @return Xmpp4Js.Chat.Chat
     */
    getThreadChat : function (thread) {
        return this.threads[ thread ];
    },

    /**
     * Gets a chat by Jid
     * @param {Xmpp4Js.Jid} jid Jid object or string.
     * @return Xmpp4Js.Chat.Chat
     */
    getUserChat : function (jid) {
        for( var i = 0; i < this.chats.length; i++ ) {
            var chat = this.chats[i];
            if( chat.getParticipant().equals( jid, this.options.ignoreResource ) ) {
                return chat;
            }
        }
    },

    /**
     * Get or return a Chat object using a given message.
     * This implementation checks thread -> jid (no resource) -> create.
     * @todo write test
     * @param msg {Xmpp4Js.Packet.Message} A message stanza to determine.
     * @param isOutgoing {Boolean} If true use toJid, else fromJid
     * @param ignoreResource {Boolean} Resort to ignoring the resource if needed (last attempt).
     * @return {Xmpp4Js.Chat.Chat} The end result of the chat finding.
     */
    findBestChat : function (jid, thread) {
        var chat = null;
        var forJid = new Xmpp4Js.Jid(jid);

        if( thread && !this.options.ignoreThread ) {
            chat = this.getThreadChat( thread );
        } else {
            chat = this.getUserChat( forJid );
        }

        if( chat == null ) {

            throw new Error( "Could not find best chat for user/thread combination." );
        }

        return chat;
    },

    /**
     * Set options. 
     * FIXME Currently overwrites all existing options
     * @param {Map} options
     * @see #options
     */
    setOptions : function(options) {
        this.options = options;
    },

    /**
     * Get options associated with this ChatManager.
     * @return Map
     * @see #options
     */
    getOptions : function() {
        return this.options;
    },

    /**
     * The connection that this ChatManager is associated with.
     * @return Xmpp4Js.JabberConnection
     */
    getConnection : function() {
        return this.con;
    }
};

Xmpp4Js.Chat.ChatManager.instances = {};
Xmpp4Js.Chat.ChatManager.getInstanceFor = function(con) {
    var instances = Xmpp4Js.Chat.ChatManager.instances;
    
    if( instances[con.id] === undefined ) {
        instances[con.id] = new Xmpp4Js.Chat.ChatManager( con );
    }

    return instances[con.id];
};


Xmpp4Js.Lang.extend(Xmpp4Js.Chat.ChatManager, Xmpp4Js.Event.EventProvider, Xmpp4Js.Chat.ChatManager.prototype);
