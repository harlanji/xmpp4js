Xmpp4Js.Lang.namespace( "Xmpp4Js.Roster" );

/** 
 *Protected constructor should only be used by Roster
 * @constructor
 */
Xmpp4Js.Roster.RosterEntry = function(jid, alias, subscription, ask, groups, roster) {
        this.jid = jid;
        this.alias = alias;
        this.subscription = subscription;
        this.ask = ask;
        this.groups = groups;
        this.roster = roster;
}

Xmpp4Js.Roster.RosterEntry.prototype = {
	

	/** @deprecated new model doesn't keep the same entry around */
	update: function( alias, subscription, ask, groups ) {
		this.alias = alias;
		this.subscription = subscription;
		this.ask = ask;
		this.groups = groups;
	},
	/** references to all groups this entry belongs to. 0 or more. */
	getGroups: function() {
            var retGroups = [];
            // TODO possibly refactor this to roster.getGroups and make use of that... for each group, if contains this jid, add to list
            // gets groups off of con.roster
            if( this.groups.length == 0 ) {
                retGroups.push( this.roster.getUnfiledContacts() );
            } else {
                for(var i = 0; i < this.groups.length; i++) {
                    var groupName = this.groups[i];
                    var group = this.roster.getGroup(groupName);
                    // if group is undefined, that means that this entry is not associated with 
                    // an existing group--perhaps it was just removed.
                    // TODO make a test for this case.
                    if( group == undefined ) {
                        group = new Xmpp4Js.Roster.VirtualRosterGroup( groupName, [this], this.roster );
                    }
                    retGroups.push( group );
                };
            }
		return retGroups;
            }

}
