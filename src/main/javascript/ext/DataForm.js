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
 * This class is implemented in a rather procedural way, but
 * it works for now.
 *
 * TODO this does not currently support 'result' forms with 'reported' data.
 * @constructor
 */
function DataForm() {
	this.node = null;
}

/**
 * Clones the given node and returns a reference to it
 */
DataForm.prototype.read = function(node) {
	if( node.nodeName != "x" || node.namespaceURI != "jabber:x:data" ) {
		//parentNode = node;

		alert( "nothin" );
		return; // TODO throw error
	} else if(node.getAttribute("type") == "result" && node.getElementsByTagName("reported").length > 0 ) {
		alert( "does not support 'result' forms with 'reported' elements." );
		return; // TODO throw error
	}
	
	this.node = node.cloneNode( true );
	
	return this.node;
}

/**
 * Writes to the given node. If it is jabber:x:data, it is replaced.
 * Else, jabber:x:data is appended.
 * @param node {Element} The parent node to append to.
 */
DataForm.prototype.write = function(node) {
	var newNode = this.node.cloneNode(true);
	newNode = importNode( node.ownerDocument, newNode, true );
	
	if( node.nodeName == "x" && node.namespanamespaceURI == "jabber:x:data" ) {
		var parentNode = node.parentNode;
		newNode = parentNode.replaceChild( newNode, node );
	} else {
		newNode = node.appendChild( newNode );
	}
	
	return newNode;
}

/**
 * Returna an array of field names
 */
DataForm.prototype.getFieldNames = function() {
	var fields = [];
	
	var res = this.node.getElementsByTagName("field");
	for( var i = 0; i < res.length; i++ ) {
		var field = res[i];
		fields.push( field.getAttribute("var") );
	}
	
	return fields;
}

/**
 * Returns a DOM Element for a field name. Mostly for internal
 * use, but by no means not public.
 */
DataForm.prototype.getFieldElem = function(fieldName) {
	var res = $A(this.node.getElementsByTagName("field")).findAll(function(elem){
		return elem.getAttribute("var") == fieldName;
	});
	return res.length > 0 ? res[0] : null;
}

/**
 * Set a field value, either singular or array. Will always
 * be stored/returned as an array.
 */
DataForm.prototype.setFieldValues = function(fieldName, value, saveExisting) {
	var field = this.getFieldElem(fieldName);
	if( field == null ) { return; }
	
	if( value == null ) { value = []; }
	
	if( !(value instanceof Array) ) {
		value = [ value ];
	}
	
	if( !saveExisting ) {
		var elems = field.getElementsByTagName("value");
		for( var i = 0; i < elems.length; i++ ) {
			var valueElem = elems[i];
			valueElem.parentNode.removeChild( valueElem );
		}
	}
	
	for( var i = 0; i < value.length; i++ ) {
		var valueElem = field.ownerDocument.createElement("value");
		valueElem = field.appendChild( valueElem );
		
		valueElem.textContent = value[i];
	}
}

/**
 * Returns an array of values.
 * TODO this could be intelligent based on field type.
 */
DataForm.prototype.getFieldValues = function(fieldName) {
	var field = this.getFieldElem(fieldName);
	if( field == null ) { return; }

	var values = [];

	var elems = field.getElementsByTagName("value");
	for( var i = 0; i < elems.length; i++ ) {
		var valueElem = elems[i];
		values.push( valueElem.textContent );
	}
	
	return values;
}

/**
 * Gets the type of a given field ( as defined in XEP-0004 )-
 */
DataForm.prototype.getFieldType = function(fieldName) {
	var field = this.getFieldElem(fieldName);
	if( field == null ) { return; }

	return field.getAttribute("type");
}

/**
 * Gets the label of a field, as returned by the server
 * @todo does language need to be implemented?
 */
DataForm.prototype.getFieldLabel = function(fieldName) {
	var field = this.getFieldElem(fieldName);
	if( field == null ) { return; }

	return field.getAttribute("label");
}

/**
 * Returns the natural language description for a field
 *
 * TODO the schema allows 0 to unbounded, see if that's ever used in practice.
 */
DataForm.prototype.getFieldDescription = function(fieldName) {
	var field = this.getFieldElem(fieldName);
	if( field == null ) { return; }

	var res = field.getElementsByTagName("desc");
	return res.length > 0 ? res[0].textContent : null;
}

/**
 * Returns whether a field is required or not.
 */
DataForm.prototype.isFieldRequired = function(fieldName) {
	var field = this.getFieldElem(fieldName);
	if( field == null ) { return; }

	var res = field.getElementsByTagName("required");
	return res.length > 0;
}

/**
 * Returns an array of options for a given radio field, in an array of { label, value }
 */
DataForm.prototype.getFieldOptions = function(fieldName) {
	var field = this.getFieldElem(fieldName);
	if( field == null ) { return; }

	var options = [];

	var elems = field.getElementsByTagName("option");
	for( var i = 0; i < elems.length; i++ ) {
		var optionElem = elems[i];
		options.push( {
			label: optionElem.getAttribute("label"),
			value: optionElem.getElementsByTagName("value")[0] 
		});
	}
}

/**
 * Returns the content of the first instruction node.
 *
 * TODO the schema allows 0 to unbounded, see if that's ever used in practice.
 */
DataForm.prototype.getInstructions = function() {
	var res = this.node.getElementsByTagName("instructions");
	return res.length > 0 ? res[0].textContent : null;
}

/**
 * Returns the title of the form
 *
 * TODO the schema allows 0 to unbounded, see if that's ever used in practice.
 */
DataForm.prototype.getTitle = function() {
	var res = this.node.getElementsByTagName("title");
	return res.length > 0 ? res[0].textContent : null;
}

/**
 * Returns the type of form action.
 */
DataForm.prototype.getType = function() {
	var res = this.node.getAttribute("type");
}


/**
 * Emulates a dataform using a given mapping. Reads and writes raw elements.
 * @constructor
 * @extends DataForm
 */
function DataFormEmulator( mapping ) {
    this.mapping = mapping;

}

DataFormEmulator.prototype = {
    /**
     * Builds a dataform based on the given element and
     * mapping that was passed to the constructor.
     *
     * Returns the created node.
     *
     * @param node {Element} The parent node read from.
     */
    read : function(elem) {
        var doc = elem.ownerDocument;
        
        var newRoot = doc.createElementNS( "jabber:x:data", "x" );
        newRoot.setAttribute( "type", "form" );

        for( var elemName in this.mapping ) {
            var fieldElem = elem.getElementsByTagName( elemName )[0];
            
            var fieldInfo = this.mapping[ elemName ];
            var fieldName = fieldInfo.name;
            var label = fieldInfo.label;
            var type = fieldInfo.type;
            var value = fieldInfo.value;
            var desc = fieldInfo.desc;
            var required = fieldInfo.required;
            var options = fieldInfo.options;
            
            var newFieldElem = newRoot.appendChild( doc.createElement( "field" ) );
            var valueElem = newFieldElem.appendChild( doc.createElement( "value" ) );
            
            newFieldElem.setAttribute( "var", fieldName );
            if( label ) {
                newFieldElem.setAttribute( "label", label );
            }
            if( desc ) {
                newFieldElem.setAttribute( "desc", desc );
            }
            if( required ) {
                newFieldElem.setAttribute( "required", required );
            }
            
            if( options ) {
                // TODO
            }
            
            
            if( fieldInfo.value) {
                valueElem.textContent = fieldInfo.value;
            }
            
        }

        return DataFormEmulator.superclass.read.call( this, newRoot );
    }, 
    
    /**
     * Writes to the given node, using the mapping provided to the constructor.
     *
     * @param node {Element} The parent node to append to.
     */
    write : function(node) {
        var doc = node.ownerDocument;
        //var newNode = this.node.cloneNode(true);
        //newNode = node.ownerDocument.importNode( newNode, true );
        

        for( var elemName in this.mapping ) {
            var fieldElem = node.appendChild( doc.createElement( elemName ) );
            var fieldInfo = this.mapping[ elemName ];
            
            fieldElem.textContent = this.getFieldValues( fieldInfo.name )[0];
        }
        
        return node;
    }

}

Xmpp4Js.Lang.extend( DataFormEmulator, DataForm, DataFormEmulator.prototype);


/**
 * Creates dynamic forms based on a DataForm element. 
 * 
 * @class DataFormView
 * @param dataForm {DataForm} The dataform to bind to
 * @param formId {String} The ID for this form (unique in the document)
 * @param template {String} Optional. The path to an HTML or XSL sheet to represent the form.
 * @todo extend BoxComponent instead.
 * @constructor
 */
function DataFormView( config ) {
    
    // dataForm, formId, template
    if( arguments.length > 1 ) {
//;;;        console.warn( "Using deprecated ctor for DataFormView" );
        
        config = {
          dataForm: arguments[0],
          formId: arguments[1],
          template: arguments[2]
        };
    };

    if( !config.template ) {
            config.template = DataFormView.DEFAULT_TEMPLATE;
    }
    this.dataForm = config.dataForm;
    this.formId = config.formId;
    this.template = config.template;

    this.addEvents( {
        /**
         * Called when the submit button is clicked. 
         * @event submit
         * @param dataFormView {DataFormView} this
         */
        submit : true,
        /**
         * Called when the reset button is clicked. 
         * @event submit
         * @param dataFormView {DataFormView} this
         */
        reset : true,
        /**
         * Called when the cancel button is clicked. 
         * @event cancel
         * @param dataFormView {DataFormView} this
         */
        cancel : true
    });
    
    this.dfvContainerId = Xmpp4Js.Lang.id();
    
    var superConfig = Ext.apply( config, {
        layout: 'fit',
        deferredRender: false,
        
        items: {
            id: this.dfvContainerId
        },
        buttons: [{
            text: "Cancel",
            scope: this,
            handler: this.cancelClicked
        },
        {
            text: "Reset",
            scope: this,
            handler: this.resetClicked
        },
        {
            text: "Save",
            scope: this,
            handler: this.saveClicked
        }]
    });
    
    DataFormView.superclass.constructor.call( this, superConfig );
    
}

DataFormView.DEFAULT_TEMPLATE = "resources/xmpp4js/DataForm-to-HTML.xsl";

DataFormView.prototype = {
    
    /**
     * @deprecated in favor of renderAndReturn
     */
    getRenderedNode: function() {
//;;;        console.warn( "renderAndReturn is deprecated." );
        return this.renderAndReturn();
    },
    
    /**
     * Returns an HTML element (dom) that is the result of the 
     * rendered node bound with the data form.
     * @return {Element}
     */
    renderAndReturn : function() {
    	
    	var resultDoc = null;
    	
    	// TODO make a template adapter instead of this if/else
    	if( this.template.endsWith(".xsl") ) {
    	
    		// create a temp document to transform
    		var xmlDoc = document.implementation.createDocument("", "", null);
    		// clone and import our node to the new document
    		var node = importNode( xmlDoc, this.dataForm.node.cloneNode(true), true );
    		xmlDoc.appendChild( node );
    		
    		// get the dataform xsl sheet
    		var xhreq = new XMLHttpRequest();
    		xhreq.open("GET", this.template, false);
    		xhreq.send(null);
    		var xslDoc = xhreq.responseXML;
    		
    		// setup the xsl processor
    		var xslProc = new XSLTProcessor();
    		xslProc.setParameter( null, "formId", this.formId );
    		xslProc.importStylesheet(xslDoc);
    		
    		// run the transformation
    		resultDoc = xslProc.transformToDocument(xmlDoc);
    		
    	} else {
    		// get the dataform template
    		var xhreq = new XMLHttpRequest();
    		xhreq.open("GET", this.template, false);
    		xhreq.send(null);
    
            if( xhreq.responseXML != null ) {
    		  resultDoc = xhreq.responseXML;
            } else {
                // TODO parse responseText fragment into document
                throw new Error( "non-XML response. cannot parse fragments at this time" );
            }
    	}
    	
    	// return the result
    	return resultDoc;
    },
    
    /**
     * Renders the form and appends it to parentNode
     * @param parentNode {Element} The element to append the form to.
     */
    onRender : function(ct, position) {
    	var dfvContainer = Ext.ComponentMgr.get( this.dfvContainerId );
         
    	var doc = this.renderAndReturn();
        
        if( doc == null ) {
            throw new Error( "Error rendering DataForm with template: " + this.template );
        }
/*    	
    	var serializer = new XMLSerializer();
    	var xml = serializer.serializeToString(doc);
*/
        var importedNode = document.importNode( doc.documentElement, true );
        //dfvContainer.body.dom.appendChild( importedNode );
    	ct.body.dom.appendChild( importedNode );
         
    	this.bindToForm();
    },
    
    
    /**
     * Bind to a form that exists within the document and has this.formId.
     */
    bindToForm : function() {
    	var formElem = document.getElementById("form-" + this.formId);
    	if(formElem==null) { return; }
    	
    	
    	var submitButton = document.getElementById(this.formId + "-submit");
        var cancelButton = document.getElementById(this.formId + "-cancel");
    	
        if( cancelButton != null ) {
            Ext.EventManager.on(cancelButton, "click", this.cancelClicked, this);
    	}
        
        if( submitButton != null ) {
            Ext.EventManager.on(submitButton, "click", this.submitClicked, this);
        }
    },
    /**
     * Returns an instance of the dataForm being bound to.
     * @return {DataForm}
     */ 
    getDataForm : function() {
        return this.dataForm;
    },
    /**
     * The handler for when the submit button is clicked. Fires the "submit" event.
     */
    submitClicked : function() {
    	var fields = this.dataForm.getFieldNames();
    	for( var i = 0; i < fields.length; i++ ) {
    		var fieldName = fields[i];
    		var fieldType = this.dataForm.getFieldType( fieldName );
    		
    		switch( fieldType ) {
    			case 'boolean':
    				var value = null;
    			
    				var elem = document.getElementById( this.formId + "-" + fieldName + "-0" );
    				if( elem.checked ) {
    					value = "0";
    				}
    				elem = document.getElementById( this.formId + "-" + fieldName + "-1" );
    				if( elem.checked ) {
    					value = "1";
    				}
    				
    				this.dataForm.setFieldValues( fieldName, value );
    				
    				break;
    			case 'list-multi':
    			case 'list-single':
    				var elem = document.getElementById( this.formId + "-" + fieldName );
    				
    				var values = [];
    				
    				for(var j = 0; j < elem.options.length; j++ ) {
    					var optionElem = elem.options[j];
    					if(optionElem.selected) {
    						values.push(optionElem.value);
    					}
    				}
    				
    				this.dataForm.setFieldValues( fieldName, values );
    				break;
    			default:
    				var elem = document.getElementById( this.formId + "-" + fieldName );
    				if(elem == null ) { continue; }
    				
    				this.dataForm.setFieldValues( fieldName, elem.value );
    		}
    	}
    	
    	this.fireEvent( "submit", this );
    },
    
    cancelClicked : function() {
        this.fireEvent( "cancel", this );
    },
    resetClicked : function() {
        this.fireEvent( "reset", this );
    }
}

Xmpp4Js.Lang.extend( DataFormView, Ext.Panel, DataFormView.prototype);

/*
Event.observe( window, "load", function(e) {
	var myXMLHTTPRequest = new XMLHttpRequest();
	myXMLHTTPRequest.open("GET", "javascripts/xmpp4js/ext/DataForm-to-HTML.xml", false);
	myXMLHTTPRequest.send(null);
	
	var testDataFormDoc = myXMLHTTPRequest.responseXML;
	
	var df = new DataForm();
	df.read( testDataFormDoc.documentElement );
	
	var dfw = new DataFormWindow( df, "myform123" );
	dfw.onSubmit = function(dfw) {
		var serializer = new XMLSerializer();
		var xml = serializer.serializeToString(dfw.dataForm.node);
		
		alert( "Res: " + xml );
	}
	
	dfw.show();
	
	//var resultNode = dfw.renderAndReturn();  
});
*/

