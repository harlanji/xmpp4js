Xmpp4Js.Lang.namespace( "Xmpp4Js.Roster" );

/**
 * @constructor
 * @extends Xmpp4Js.Roster.VirtualRosterGroup
 */
Xmpp4Js.Roster.UnfiledEntriesRosterGroup = function(roster) {
        Xmpp4Js.Roster.VirtualRosterGroup.superclass.constructor.call( this, "Unfiled Contacts", [], roster );	
}
         
Xmpp4Js.Roster.UnfiledEntriesRosterGroup.prototype = {
    getEntries: function() {
        var retEntries = [];

        for(var k in this.roster.map) {
                var entry = this.roster.map[k];
                var groups = entry.groups;

                if( !groups || groups.length == 0 ) {
                        retEntries.push( entry );
                }
        }

        return retEntries;
    }
}
         
Xmpp4Js.Lang.extend( Xmpp4Js.Roster.UnfiledEntriesRosterGroup, Xmpp4Js.Roster.VirtualRosterGroup, Xmpp4Js.Roster.UnfiledEntriesRosterGroup.prototype);
