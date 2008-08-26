Xmpp4Js.Lang.namespace( "Xmpp4Js.Roster" );

/** 
 *Protected constructor should only be called by Roster 
 * @constructor
 */
Xmpp4Js.Roster.RosterGroup = function(name, roster) {
      this.name = name;
      this.roster = roster;
    }
         
Xmpp4Js.Roster.RosterGroup.prototype = {
	getEntries: function() {
		var retEntries = [];
	
		for(var k in this.roster.map) {
			var entry = this.roster.map[k];
			
			var groups = entry.groups;
			for( var j = 0; j < groups.length; j++ ) {
				var group = groups[j];
				if( group == this.name ) {
					retEntries.push( entry );
				}
			}
		};
		
		return retEntries;
	},
        getEntry: function(jid) {
            var entries = this.getEntries();
            var retEntry = undefined;
            for(var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if( entry.jid == jid ) {
                    retEntry = entry;
                }
            };

            return retEntry;

        }
}
