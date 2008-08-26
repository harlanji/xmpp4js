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
 * An improved version of Scriptaculous DomBuilder that doesn't do any mapping, and allowed you
 * to specify parent document. 
 * 
 * Namespace can be specified with xmlns attribute, but there might be a better way to do it. It
 * works for my purposes.
 * @constructor
 */
var DomBuilder = function() {}

/**
 * Create a dom node on given document with given attributes, child elements, and content.
 * @param attributes {Hash} A hash of attributes to add to the element.
 * @param childElements {Array} An array of child nodes to append to the element, in order.
 * @param content {Element|Object} Content to append. If it's not an Element, its string representation will be put into a text node. Appended as last element if other child nodes are set.
 * @param parentDoc {Document} The parent doc to create nodes on; defaults to Packet.getDocument()
 */
DomBuilder.node = function( elementName, attributes, childElements, content, parentDoc ) {
        /* TODO do we want to do this?
        if(childElements && content) {
                throw new Error( "Can not create a node with both content and child elements.");
        }
        */

        // if attributes isn't set, make it a new hash
        if(!attributes) {
                attributes = {};
        }
        // if childElements isn't set, make it a new Array
        if(!childElements) {
                childElements = [];
        }
        // if parentDoc isn't set, use the default packet document.
        if(!parentDoc) {
                parentDoc = Xmpp4Js.Packet.getDocument();
        }

        // if content is set, append it to childElements
        if(content) {
                // if content isn't an element, create a text node for it
                if( !(content instanceof DOMElement) ) {
                        content = parentDoc.createTextNode( content );	
                }

                childElements.push( content );
        }

        // create the element

        var elem;
        if( attributes["xmlns"] !== undefined ) {
                elem = parentDoc.createElementNS( attributes["xmlns"], elementName );
        } else if( elementName.indexOf(":") > -1 ) {
                var prefix = elementName.substring( 0, elementName.indexOf(":") );
                var xmlns = attributes[ "xmlns:" + prefix ];

                if( xmlns ) {
                        elem = parentDoc.createElementNS( xmlns, elementName );

                } else {
                        elem = parentDoc.createElement( elementName );
                }
        } else {
                elem = parentDoc.createElement( elementName );
        }

        // add attributes
        for( var k in attributes ) {
                try {
                    elem.setAttribute( k, attributes[k] );
                } catch(e) {
                }
        }
        // add childElements
        for( var i = 0; i < childElements.length; i++ ) {
                elem.appendChild( childElements[i] );
        }

        // return newly created element
        return elem;
}
