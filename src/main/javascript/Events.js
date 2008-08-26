// Copyright (C) 2007  Harlan Iverson <h.iverson at gmail.com>
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

/**
 * @constructor
 * @deprecated Ext.util.Observable is typically used.
 */
function DelegateManager() {
	this.map = {};
}

DelegateManager.prototype = {
	/**
	 * 
	 * @param {Function} func
	 * @return id to remove with
	 */
	add: function(func) {
		var id = "delegate_"+Math.random();
		this.map[id] = func;
		
		return id;
	
	},
	remove: function(id) {
		delete this.map[id];
	},
	/**
	 * Fire each delegate method with arguments that were passed to fire
	 */
	fire: function() {
		var fireArgs = Array.prototype.slice.call(arguments);
		for( var k in this.map) {
			try {
                            // scope doesn't matter, should have been set with bind()
                            this.map[k].apply(null,fireArgs); 
			} catch(e) {
				// TODO do something
			}
		}
	},
	// TODO test... even though it hardly needs it.
	getMap: function() {
		return this.map;
	}
}

/**
 * @constructor
 * @deprecated Ext.util.Observable is typically used.
 */
function EventListenerManager() {
	this.events = {};
	/** a map of event id => eventName */
	this.listenerEvents = {};
}

EventListenerManager.prototype.add = function(event, listener) {
	var dm = this.events[event];
	if( dm === undefined ) {
		this.events[event] = new DelegateManager();
		dm = this.events[event];
	}
	
	var id = dm.add( listener );
	this.listenerEvents[ id ] = event;
	
	return id;
}

EventListenerManager.prototype.remove = function(event, id) {
	// signature is changed to only take ID
	if( arguments.length == 1 ) {
		id = event;
		event = this.listenerEvents[ id ];
	}
	var dm = this.events[event];
	if( dm === undefined ) { return; }
	
	dm.remove( id );
}

EventListenerManager.prototype.getMap = function( event ) {
	var dm = this.events[event];
	if( dm === undefined ) { return; }
	
	return dm.getMap();
	
}

EventListenerManager.prototype.fireArgs = function( event, args ) {
	var callArgs = args.slice(0);
	// put event onto the beginning of the arg stack
	callArgs.unshift( event );
	
	this.fire.apply( this, callArgs );
}

EventListenerManager.prototype.fire = function( event ) {
	var dm = this.events[event];
	if( dm === undefined ) { return; }
	
	
	// get passed arguments and shift the first (event) off the front 
	var args = Array.prototype.slice.call(arguments);
	args.shift();
	
	dm.fire.apply( dm, args );
}

Xmpp4Js.Lang.namespace( "Xmpp4Js.Event" );

// TODO add test
Xmpp4Js.Event.EventProvider = function(config) {
    this.eventListenerManager = new EventListenerManager();

    if( config && config.listeners ) {
        this.on( config.listeners );
    }
}

Xmpp4Js.Event.EventProvider.prototype = {
    addEvents: function(events) {
        // do nothing, just here for compat with Observable
        if( !this.eventListenerManager ) {
            this.eventListenerManager = new EventListenerManager();
        }
    },
    
    /**
     * If doing multiple, should scope and options be passed? doesn't seem likely.
     */
    addListener: function(event, listener, scope, options) {
        if( typeof event == "object" ) {
            for( var e in event ) {
                if( e != "scope"  && e != "options" ) {
                    this.addListener( e, event[e], event.scope ? event.scope : undefined, event.options ? event.options : undefined );
                }
            }
            return;
        }

        // if scope is specified, run the listener funciton in that scope
        if( scope ) {
            listener = listener.bind(scope);
        }
        
        // immediately remove the listener and then call it.
        if( options && options["single"] == true ) {
            var eventProvider = this;
            var originalListener = listener; // prevent recursion
            
            listener = function() {
                eventProvider.removeListener( event, arguments.callee ); // remove this
                
                originalListener.apply(this, arguments); // use current this and arguments
            }
        }
        

        
        this.eventListenerManager.add( event, listener );
    },
    
    removeListener: function(event, listener) {
        if( typeof event == "object" ) {
            for( var e in event ) {
                this.removeListener( e, event[e] );
            }
        }
        
        // TODO this code could probably be refactored to eventListenerManager
        var removeId;
        var delegateMap = this.eventListenerManager.getMap( event );
        for( var id in delegateMap ) {
            var delegateListener = delegateMap[id];
            if( delegateListener === listener ) {
                removeId = id;
            }
        }
        
        this.eventListenerManager.remove( event, id );
    },
    
    fireEvent: function(event, args) {
        var callArgs = Array.prototype.slice.call(arguments);
        callArgs.shift(); // pull off the event
        
        this.eventListenerManager.fireArgs( event, callArgs );
    },
    
    hasListener: function() {
        alert( "hasListener not implemented" );
    },
    
    purgeListeners: function() {
        alert( "hasListener not implemented" );
    },
    
    relayEvents: function() {
        alert( "relayEvents not implemented" );
    },
    
    resumeEvents: function() {
        alert( "resumeEvents not implemented" );
    },
    
    suspendEvents: function() {
        alert( "suspendEvents not implemented" );
    }
    
    
}

Xmpp4Js.Event.EventProvider.prototype.on = Xmpp4Js.Event.EventProvider.prototype.addListener;
Xmpp4Js.Event.EventProvider.prototype.un = Xmpp4Js.Event.EventProvider.prototype.removeListener;
