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

Xmpp4Js.Packet._document = createDocument();
Xmpp4Js.Packet.getDocument = function() {
	return Xmpp4Js.Packet._document;
}

/**
 * Default constructor that takes a node to be created from.
 * 
 * @param {Element} node
 * @constructor
 */
Xmpp4Js.Packet.Base = function( node ) {
    this.extensions = [];
	this.elem = node;	
}

Xmpp4Js.Packet.Base.prototype = {
    setId : function( id ) {
    	this.elem.setAttribute( "id", id );
    },
    getId : function() {
    	var id = this.elem.getAttribute( "id" ).toString();
    	if( !id ) {
    		id = "id" + Math.random( 0,100 );
    		this.setId( id );
    	}
    	return id;
    },
    
    /**
     * 
     * @param {String} to
     */
    setTo : function( to ) {
    	this.elem.setAttribute( "to", to );
    },
    getTo : function() {
    	return this.elem.getAttribute( "to" ).toString();
    },
    
    /**
     * 
     * @param {String} from
     */
    setFrom : function( from ) {
    	this.elem.setAttribute( "from", from );
    },
    getFrom : function() {
    	return this.elem.getAttribute( "from" ).toString();
    },
    
    /**
     * 
     * @param {Jid} to
     */
    setToJid : function( to ) {
    	this.elem.setAttribute( "to", to.toString() );
    },
    getToJid : function() {
    	return new Xmpp4Js.Jid(this.elem.getAttribute( "to" ).toString());
    },
    
    /**
     * 
     * @param {Jid} from
     */
    setFromJid : function( from ) {
    	this.elem.setAttribute( "from", from.toString()  );
    },
    getFromJid : function() {
    	return new Xmpp4Js.Jid(this.elem.getAttribute( "from" ).toString());
    },
    
    
    
    setType : function( type ) {
    	this.elem.setAttribute( "type", type );
    },
    getType : function() {
    	return this.elem.getAttribute( "type" ).toString();
    },
    
    setNode : function(node) {
    	this.elem = node;
    },
    getNode : function() {
    	return this.elem;
    },
    
    getDoc : function() {
    	return this.elem.ownerDocument;
    },
    
    toString : function() {
    	var string = "Packet ["
    		+ "node (JSON)=" 
    		+ ", type=" + this.getType()
    		+ ", from=" + this.getFrom()
    		+ ", to=" + this.getTo()
    		+ ", toJid=" //+ this.getToJid().toString()
    		+ "]";
    	return string;
    },
    
    
    /**
     * Set text content or a node to a child element. 
     * Creates the element if it doesn't exist. 
     * FIXME if content is a node, it does not replace existing
     *       content by removing node of same name.
     */
    setChildElementContent : function( elemName, content ) {
        var childNode = this.getChildElementNode(elemName);
        if( !childNode ) {
            childNode = DomBuilder.node( elemName );
            childNode = this.elem.appendChild( childNode );
        }
        if( content instanceof DOMElement ) {
            var importedContent = this.elem.ownerDocument.importNode( content, true );
            childNode.appendChild( importedContent );
        } else {
            childNode.setTextContent( content );
        }
        
    },
    
    /**
     * Get a child element node if it exists.
     */
    getChildElementNode : function(elemName) {
        return this.elem.getElementsByTagName(elemName).item(0);
    },
    
    /**
     * Get the text content of a node.
     */
    getChildElementContent : function(elemName, defaultVal) {
        var node = this.getChildElementNode(elemName);
        var content = null;
        
        if( node ) {
            content = node.getStringValue();
        }
        
        if( content == null || content == "" ) {
            content = defaultVal;
        }
        
        return content;
    },
    
    /**
     * Removes a child element of given name.
     */
    removeChildElement : function( elemName ) {
        var node = this.getChildElementNode(elemName);
        node.parentNode.removeChild( node );
    },
    
    /**
     * There can only be one extension per namespace. Removes an existing 
     * extension of same namespace if there is one, and adds the new one.
     */
    addExtension : function( extension ) {
        if( this.getExtension( extension.getElementNS() ) ) {
            this.removeExtension( extension.getElementNS() );
        }
        
        this.extensions[ extension.getElementNS() ] = extension;
    },
    
    removeExtension : function( extensionNS ) {
        //if( this.extensions[ extensionNS ] ) {
            this.extensions[ extensionNS ].removeNode();
            delete this.extensions[ extensionNS ];
        //} else {
            // throw error?
        //}
    },
    
    getExtensions : function() {
        var extensions = [];
        for( var k in this.extensions ) {
            var ext = this.extensions[k];
            
            if( ext instanceof Xmpp4Js.Ext.PacketExtension ) {
                extensions.push( ext );
            }
        }
        
        return extensions;
    },
    
    getExtension : function(extensionNS) {
        return this.extensions[ extensionNS ];
    },
    
    /**
     * FIXME If there are multiple with the same namespace, there will be trouble.
     */
    loadExtensions : function(provider) {
        var extensions = provider.readAll( this );
        
        for( var i = 0; i < extensions.length; i++ ) {
            var ext = extensions[i];
            
            
            
            this.addExtension( ext );
        }
    }

};

/** @deprecated */
function createDocument() {
    return new DOMDocument(new DOMImplementation()); 
}

/** @deprecated */
function serializeNode(node) {
    return node.toString();
}

/** @deprecated */
function parseXmlToDoc(xml) {
    return (new DOMImplementation()).loadXML(xml);
}




