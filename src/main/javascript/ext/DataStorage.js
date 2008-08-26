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
 * Implementation of XEP-0049 - Private XML Storage
 * @constructor
 */
function DataStorage(con) {
	this.con = con;
}

DataStorage.prototype.set = function( xmlns, data, elementName ) {
	if( !elementName ) { elementName = "element"; }

	var iq = this.con.getPacketHelper().createIQ( null, "set", "jabber:iq:private" );
	var contentNode = iq.getQuery().appendChild( iq.getDoc().createElement( elementName ) );
	contentNode.setAttribute( "xmlns", xmlns );	

	if( typeof(data) == 'string' ) {
		contentNode.setTextContent( data );
	} else {
		contentNode.appendChild( data );
	}

	this.con.send( iq, function(packet) {
		if( packet.getType() == "error" ) {
			alert( "Error storing IQ: "+xmlns + ", " + elementName );
			return;
		}
	});

}

DataStorage.prototype.get = function( xmlns, cb, elementName ) {
	if( !elementName ) { elementName = "element"; }

	var iq = this.con.getPacketHelper().createIQ( null, "get", "jabber:iq:private" );
	var contentNode = iq.getQuery().appendChild( iq.getDoc().createElement( elementName ) );
	contentNode.setAttribute( "xmlns", xmlns );	


	this.con.send( iq, function(packet) {
		if( packet.getType() == "error" ) {
			alert( "Error retreiving IQ: "+xmlns + ", " + elementName );
			return;
		}
		var responseNodes = packet.getQuery().getElementsByTagNameNS( xmlns, elementName );
		cb( responseNodes );
	});
	
}


DataStorage.prototype.setString = function setData(xmlns, data, elementName ) {
	this.set( xmlns, data, elementName );
}

DataStorage.prototype.getString = function getData(xmlns, cb, elementName ) {
	this.get( xmlns, function(responseNodes) {
		var value = "";
		// don't take the response node itself, but use everything inside it.
		$A( responseNodes[0].childNodes ).each( function( node ) {
			value += node.xml;
		});
		cb( value );
	}, elementName );
}
