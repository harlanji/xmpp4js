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

Xmpp4Js.Lang.namespace( "Xmpp4Js.PacketFilter" );

/**
 * Base class for a packet filter. Accepts all.
 * @constructor
 */
Xmpp4Js.PacketFilter.PacketFilter = function() {}

Xmpp4Js.PacketFilter.PacketFilter.prototype = {
	accept: function(packet) {
		return true;
	}
}



/**
 * A special type of filter, makes the listener receive the DOM body element
 * rather than a packet object.
 * @constructor
 * @extends Xmpp4Js.PacketFilter.PacketFilter
 */
Xmpp4Js.PacketFilter.RawPacketFilter = function() {}

Xmpp4Js.PacketFilter.RawPacketFilter.prototype = {
	accept: function(bodyElement) {
		return true;
	}
}

Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.RawPacketFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.PacketFilter.RawPacketFilter.prototype);


/**
 * Implements functionality common to And/Or filters, and possibly others in the future.
 * @param ... list of packet filters
 * @constructor
 * @extends Xmpp4Js.PacketFilter.PacketFilter
 */
Xmpp4Js.PacketFilter.CompositeFilter = function() {
		this.filters = [];
		
		for( var i = 0; i < arguments.length; i++ ) {
			this.filters.push( arguments[i] );
		}
}
Xmpp4Js.PacketFilter.CompositeFilter.prototype = {
	accept: function(packet) {
		return false;
	}
};

Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.CompositeFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.PacketFilter.CompositeFilter.prototype);

/**
 * Implements the logical AND operation over two or more packet 
 * filters. In other words, packets pass this filter if they pass ALL of the filters.
 * @constructor
 * @extends Xmpp4Js.PacketFilter.CompositeFilter
 */
Xmpp4Js.PacketFilter.AndFilter = function() {
	Xmpp4Js.PacketFilter.AndFilter.superclass.constructor.apply(this, arguments);
}
Xmpp4Js.PacketFilter.AndFilter.prototype = {
	accept: function(packet) {
		var accept = true;
		for( var i = 0; i < this.filters.length; i++ ) {
			// if accept is false, filter.accept() will never run
			accept = accept && this.filters[i].accept(packet);
		}
		return accept;
	}
}

Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.AndFilter, Xmpp4Js.PacketFilter.CompositeFilter, Xmpp4Js.PacketFilter.AndFilter.prototype);

/**
 * Implements the logical OR operation over two or more packet filters. In other words, 
 * packets pass this filter if they pass ANY of the filters.
 * @constructor
 * @extends Xmpp4Js.PacketFilter.CompositeFilter
 */
Xmpp4Js.PacketFilter.OrFilter = function() {
	Xmpp4Js.PacketFilter.OrFilter.superclass.constructor.apply(this, arguments);
}
	
Xmpp4Js.PacketFilter.OrFilter.prototype = {
	accept: function(packet) {
		var accept = false;
		for( var i = 0; i < this.filters.length; i++ ) {
			// if accept is true, filter.accept() will never run
			accept = accept || this.filters[i].accept(packet);
		}
		return accept;
	}
	
}

Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.OrFilter, Xmpp4Js.PacketFilter.CompositeFilter, Xmpp4Js.PacketFilter.OrFilter.prototype);

/**
 * Always returns true.
 * @constructor
 * @extends Xmpp4Js.PacketFilter.PacketFilter
 */
Xmpp4Js.PacketFilter.AllPacketFilter = function() {
	Xmpp4Js.PacketFilter.AllPacketFilter.superclass.constructor.apply(this, arguments);
}

Xmpp4Js.PacketFilter.AllPacketFilter.prototype = {
	accept: function(packet) {
		return true;
	}
};

Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.AllPacketFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.PacketFilter.AllPacketFilter.prototype);

/**
 * Filters for packets of a particular class. The given should be a constructor, so example types would:
 *     * Packet.Message
 *     * Packet.IQ
 *     * Packet.Presence
 * @constructor
 * @extends Xmpp4Js.PacketFilter.PacketFilter
 */
Xmpp4Js.PacketFilter.PacketClassFilter = function(type) {
	Xmpp4Js.PacketFilter.PacketClassFilter.superclass.constructor.apply(this, arguments);
	
	this.type = type;
}
	
Xmpp4Js.PacketFilter.PacketClassFilter.prototype = {
	accept: function(packet) {
		return packet instanceof (this.type);
	}
};


Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.PacketClassFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.PacketFilter.PacketClassFilter.prototype);

    /**
 * Filters for packets of a particular type. The type is given as a string.
 * This can be used for any packet class.
 * 
 * @constructor
 * @extends Xmpp4Js.PacketFilter.PacketFilter
 */
Xmpp4Js.PacketFilter.PacketTypeFilter = function(type) {
	Xmpp4Js.PacketFilter.PacketTypeFilter.superclass.constructor.apply(this, arguments);
	
	this.type = type;
}

Xmpp4Js.PacketFilter.PacketTypeFilter.prototype = {
	accept: function(packet) {
		return packet.getType() == this.type;
	}
};


Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.PacketTypeFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.PacketFilter.PacketTypeFilter.prototype);

    
/**
 * Filters for packets with a particular packet ID.
 * @constructor
 * @extends Xmpp4Js.PacketFilter.PacketFilter
 */
Xmpp4Js.PacketFilter.PacketIdFilter = function(id) {
	Xmpp4Js.PacketFilter.PacketIdFilter.superclass.constructor.apply(this, arguments);
	
	this.id = id;
}

Xmpp4Js.PacketFilter.PacketIdFilter.prototype = {
	accept: function(packet) {
		return packet.getId() == this.id;
	}
};


Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.PacketIdFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.PacketFilter.PacketIdFilter.prototype );

/**
 * Filters for packets with a particular packet ID.
 * @constructor
 * @extends Xmpp4Js.PacketFilter.PacketFilter
 */
Xmpp4Js.PacketFilter.FromContainsFilter = function(match) {
	Xmpp4Js.PacketFilter.FromContainsFilter.superclass.constructor.apply(this, arguments);
	
	this.match = match;
}
	
	
Xmpp4Js.PacketFilter.FromContainsFilter.prototype = {
	accept: function(packet) {
		return packet.getFrom().match( this.match );
	}
};

Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.FromContainsFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.PacketFilter.FromContainsFilter.prototype);

/**
 * Filters for IQ packets with a particular query namespace. Ensures that
 * the packet is indeed IQ as well.
 * @constructor
 * @extends Xmpp4Js.PacketFilter.PacketFilter
 */
Xmpp4Js.PacketFilter.IQQueryNSFilter = function(namespace) {
	Xmpp4Js.PacketFilter.IQQueryNSFilter.superclass.constructor.apply(this, arguments);
	
    this.iqFilter = new Xmpp4Js.PacketFilter.PacketClassFilter( Xmpp4Js.Packet.IQ );
	this.namespace = namespace;
}
	
Xmpp4Js.PacketFilter.IQQueryNSFilter.prototype = {
	accept: function(packet) {
		return this.iqFilter.accept(packet) && packet.getQuery() != null && packet.getQuery().namespaceURI == this.namespace;
	}
};

Xmpp4Js.Lang.extend(Xmpp4Js.PacketFilter.IQQueryNSFilter, Xmpp4Js.PacketFilter.PacketFilter, Xmpp4Js.PacketFilter.IQQueryNSFilter.prototype);
