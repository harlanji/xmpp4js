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

Xmpp4Js.Lang.namespace( "Xmpp4Js.Packet" );

/**
 * A registry of stanza qualifiers and mappings to classes to create from elements.
 * Does not register default providers automatically; explicitly call 
 * registerDefaultProviders.
 * @constructor
 */
Xmpp4Js.Packet.StanzaProvider = function() {
	this.providers = [];
}

Xmpp4Js.Packet.StanzaProvider.prototype = {
	/**
	 * Registers a provider with a qualifier function, class, and priority.
	 * @param qualifier {Function} The function to use to qualify the packet
	 * @param clazz {Class} The class to create an instance of and setNode.
	 * @param priority {Number} The priority of the provider. Higher gets more weight.
	 */
	register: function( qualifier, clazz, priority ) {
		this.providers.push( {qualifier: qualifier, clazz: clazz, priority: priority} );
	},
	/**
	 * Uses registered providers to figure out which Stanza class to use for
	 * a given packet node. 
	 * @param stanzaNode {Element} A stanza node
	 * @return {Xmpp4Js.Packet.Base} A packet object representing the node. 
	 */
	fromNode: function( stanzaNode ) {
		if( !(stanzaNode instanceof DOMElement) ) {
			// TODO throw error or something.
			return undefined;
		}
	
		var bestProvider = undefined;
		
		for( var i = 0; i < this.providers.length; i++ ) {
			var provider = this.providers[i];

			if( provider.qualifier( stanzaNode ) 
				&& (bestProvider === undefined || provider.priority > bestProvider.priority)) {
				bestProvider = provider;
			}
		}
		if( bestProvider === undefined ) {
			throw new NoProviderError( stanzaNode );
		}
		
		var stanza = new bestProvider.clazz();
		stanza.setNode( stanzaNode );
		
		return stanza;
	},
	/**
	 * Registers a provider for all unmatched packets with priority 0,
	 * and for message, iq, and message with priority 1.
	 */
	registerDefaultProviders: function() {
		// match all packets, priority 0, and make a Packet.Base
		this.register(
			Xmpp4Js.Packet.StanzaProvider.BaseProvider,
			Xmpp4Js.Packet.Base,
			0
		);
		
		// match all packets with elem name message, priority 1, and make a Packet.Message
		this.register(
			Xmpp4Js.Packet.StanzaProvider.MessageProvider,
			Xmpp4Js.Packet.Message,
			1
		);
		// match all packets with elem name presence, priority 1, and make a Packet.Presence
		this.register(
			Xmpp4Js.Packet.StanzaProvider.PresenceProvider,
			Xmpp4Js.Packet.Presence,
			1
		);
		// match all packets with elem name iq, priority 1, and make a Packet.IQ
		this.register(
			Xmpp4Js.Packet.StanzaProvider.IQProvider,
			Xmpp4Js.Packet.IQ,
			1
		);
	}
}


Xmpp4Js.Packet.StanzaProvider.BaseProvider = function( stanzaNode ) {
	return true;
}

Xmpp4Js.Packet.StanzaProvider._ElemNameProvider = function( stanzaNode, packetType ) {
	return stanzaNode.nodeName.toLowerCase() == packetType.toLowerCase();
}

Xmpp4Js.Packet.StanzaProvider.IQProvider = function( stanzaNode ) {
	return Xmpp4Js.Packet.StanzaProvider._ElemNameProvider( stanzaNode, "iq" );
}

Xmpp4Js.Packet.StanzaProvider.PresenceProvider = function( stanzaNode ) {
	return Xmpp4Js.Packet.StanzaProvider._ElemNameProvider( stanzaNode, "presence" );
}

Xmpp4Js.Packet.StanzaProvider.MessageProvider = function( stanzaNode ) {
	return Xmpp4Js.Packet.StanzaProvider._ElemNameProvider( stanzaNode, "message" );
}

/**
 * @constructor
 * @extends Error
 */
function NoProviderError(stanzaNode) {
	this.stanzaNode = stanzaNode
}

NoProviderError.prototype = {
	getStanzaNode: function() {
		return this.stanzaNode;
	}
}

Xmpp4Js.Lang.extend( NoProviderError, Error, NoProviderError.prototype );
