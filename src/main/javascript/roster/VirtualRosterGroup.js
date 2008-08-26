Xmpp4Js.Lang.namespace( "Xmpp4Js.Roster" );

/**
 * A virtual group that may or may not exist in the roster
 * item manager--manages its own list of entries rather than
 * referring to live data. See RosterEntry.getGroups
 * @constructor
 * @extends Xmpp4Js.Roster.RosterGroup
 */ 
Xmpp4Js.Roster.VirtualRosterGroup = function( groupName, entries, roster) {
        Xmpp4Js.Roster.VirtualRosterGroup.superclass.constructor.call( this, groupName, roster );
        this.entries = entries;	
}

Xmpp4Js.Roster.VirtualRosterGroup.prototype = {
	getEntries: function() {
		return this.entries;
	}
}

Xmpp4Js.Lang.extend( Xmpp4Js.Roster.VirtualRosterGroup, Xmpp4Js.Roster.RosterGroup, Xmpp4Js.Roster.VirtualRosterGroup.prototype);
