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
 * A manager for loading and destroying plugins on a given connection.
 * This is not currently used, and is only a proof of concept.
 *
 */
function PluginManager(con) {
	this.con = con;
	this.baseUrl = "/scripts/xmpp4js";
	this.plugins = {};

	this.addEvents({
		/**
		 *
		 * @event register
		 * @param {Xmpp4Js.JabberConnection} con
		 * @param {Plugin} plugin
		 */
		register: true,
		/**
		 *
		 * @event unregister
		 * @param {Xmpp4Js.JabberConnection} con
		 * @param {Plugin} plugin
		 */
		 unregister: true
	});
}

PluginManager.prototype = {
	/**
	 * Load a script if needed, create an instance of plugin by name, and call
	 * init on it with connection.
	 */
	register: function( name ) {
		this._loadJs( this.baseUrl + "/ext/" + name + ".js" );
	
		var plugin = eval("new " + name + "();");
		this.plugins[ name ] = plugin;
		
		plugin.init( this.con );
		
		this.fireEvent( "register", plugin );
		
	},
	
	/**
	 * Call destroy on a previously loaded plugin with connection.
	 */
	unregister: function( name ) {
		this.fireEvent( "unregister", name );
	
		var plugin = this.plugins[ name ];
		
		plugin.destroy( this.con );
	
		delete this.plugins[ name ];
	},
	
	/**
	 * Get a Plugin object
	 * @return {Plugin}
	 */
	get: function( name ) {
		return this.plugins[ name ];
	},
	
	/**
	 * See if a Plugin is loaded.
	 * @return {Boolean}
	 */
	has: function( name ) {
		return this.get( name ) != null;
	},
	
	_loadJs: function () {
	}
}

Xmpp4Js.Lang.extend( PluginManager, Xmpp4Js.Event.EventProvider, PluginManager.prototype );



/**
 * Should plugins be stateful or stateless? bound to a single connection?
 */
function Plugin() {
}

Plugin.prototype = {	
	init: function(con) {
	
	},
	
	destroy: function(con) {
	
	}
}