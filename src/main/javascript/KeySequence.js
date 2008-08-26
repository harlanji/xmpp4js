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
 * Implements a key sequence as described by XEP-0124, section 15.
 * @see #_initKeys
 * @constructor
 */
function KeySequence(length) {
    this._keys = [];
    this._idx = null;
    this._seed = null;
    
	this._initKeys( length );	
}

KeySequence.prototype = {
	/**
	 * Get the next key in the sequence, or throw an error if there are 
	 * none left (since keys are pre-generated).
	 * @return {String} 
	 */
	getNextKey: function() { 
		if( this._idx < 0 ) {
			// TODO throw some kind of error
			return null;
		}
		return this._keys[this._idx--]; 
	},
	
	/**
	 * Returns true if this is the last key in the sequence. A new
	 * sequence will need to be generated. This is the responsibility
	 * of the user of the class at this point.
	 */
	isLastKey: function() { 
		return (this._idx == 0); 
	},
	
	/**
	 * Returns true if this is the first key in a new sequence.
	 */
	isFirstKey: function() {
		return (this._idx == this.getSize() - 1);
	},
	
	/**
	 * Get the size of the key sequence.
	 */
	getSize: function() { 
		return this._keys.length; 
	},
	
	reset: function() {
		this._initKeys( this.getSize() );
	},

    /**
     * Initialize a list of keys to use for requests.
     */
	_initKeys: function(length) {
		this._keys = [];
		this._seed = this._createNewSeed();
		this._idx = length - 1;
	
		var prevKey = this._seed;
		for (var i = 0; i < length; i++) {
			this._keys[i] = this._hash(prevKey);
			prevKey = this._keys[i];
		}
	},

	/**
	 * Return a seed to use for generating a new sequence of keys.
	 * Currently implemented to use Math.random().
	 */
	_createNewSeed: function() {
		return Math.random();
	},
	
	/**
	 * Used to hash the value of each key. Spec says it must be sha1-hex,
	 * so that's what it used.
	 */
	_hash: function( value ) {
		return hex_sha1( value );
	}
}
