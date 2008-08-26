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
 * @constructor
 */
Xmpp4Js.Packet.PacketHelper = function( doc ) {
	if( doc == null ) {
		// TODO this refers to old class...
		doc = this.createDocument();
	}
	this.doc = doc;
	//this.streamNode = this.createPacket();
} 

Xmpp4Js.Packet.PacketHelper.prototype.createDocument = function() {
	return createDocument();
}

Xmpp4Js.Packet.PacketHelper.prototype.createPacket = function() {
	var packetNode = this.doc.createElement( "body" );
	packetNode.setAttribute( "xmlns", "http://jabber.org/protocol/httpbind" );

	return packetNode;
}

Xmpp4Js.Packet.PacketHelper.prototype.createIQ = function(to, type, queryNS ) {
	return new Xmpp4Js.Packet.IQ( to, type, queryNS );
}

Xmpp4Js.Packet.PacketHelper.prototype.createMessage = function( to, type, body, subject ) {
	return new Xmpp4Js.Packet.Message( to, type, body, subject );
}

Xmpp4Js.Packet.PacketHelper.prototype.createPresence = function( to, type, status, show, priority ) {
	return new Xmpp4Js.Packet.Presence( type, to, status, show, priority );
}

Xmpp4Js.Packet.PacketHelper.prototype.createAuthPlaintext = function( username, password, resource ) {
	return new Xmpp4Js.Packet.AuthPlainText( username, password, resource );
}
