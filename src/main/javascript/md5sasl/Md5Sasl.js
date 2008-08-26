/**
 * Computes challenge response for md5 auth. Truth be told, I don't 
 * understand why this stuff is like this, and can't be bothered to
 * spend more than the 30 minutes I spent looking for the spec.
 *
 * Anyone who knows more about this than me, feel free to point
 * me to it, or make this more elegant. 
 *
 * Thanks to Stefan Strigler for reference impl in JSJaC.
 *
 * @author Harlan Iverson <h.iverson at gmail dot com>
 * @constructor
 */
function Md5Sasl(username, password, domain) {
    this._username = username;
    this._password = password;
    this._domain = domain;

    this.reset();
}

Md5Sasl.prototype = {

    reset: function() {
        this._nc = null;
        this._nonce = null;
        this._cnonce = null;
        this._digestUri = null;
        this._qop = "auth";
        this._charset = "utf-8";
        this._realm = null;
    },

    decodeChallenge : function(challenge) {
        return atob( challenge );
    },
    
    encodeResponse : function( response ) {
        return binb2b64(str2binb( response ));
    },

    computeChallengeResponse : function(challenge) {
        var fields = this.deserializeFields( this.decodeChallenge( challenge ) );
        
        this._nc = "00000001";
        this._nonce = fields.nonce;
        this._cnonce = this._generateCnonce();
        this._digestUri = "xmpp/" + this._domain;
        this._realm = fields.realm || this._domain;
        
        var response = this._computeResponse( false );

        var resp = {
            username: this._username,
            realm: this._realm,
            nonce: this._nonce,
            cnonce: this._cnonce,
            nc: this._nc,
            qop: this._qop,
            "digest-uri": this._digestUri,
            response: response,
            charset: this._charset
        };

        return this.encodeResponse( this.serializeFields(resp) );   
    },
    
    /**
     * Returns true if the server sent back the response that it should have,
     * false otherwise.
     */
    checkResponse : function( challenge ) {
        var fields = this.deserializeFields( this.decodeChallenge( challenge ) );
        
        var expected = this._computeResponse( true );
        return ( expected == fields.rspauth );
    },
    
    /**
     * Deserializes a="b",cd=ef,ghi="jkl", but will choke if a comma
     * is quoted. I don't know if quoted commas are possible or not,
     * and again, can't be bothered to find a spec. Feel free to yell 
     * if I'm wrong.
     */
    deserializeFields : function(fieldsStr) {
        var fields = {};
    
        var fieldRegex = /\s*([^\=]+)\=\"?([^\"\,]*)\"?\,?\s*/g;
    
        var regexRes = fieldsStr.split(fieldRegex);
        // TODO fixure out the exta whitespace matching.
        // it starts with whitespace, there is whitespace between each, and it ends in whitespace...
        // that is why it increments by 3, starts at 1 rather than 0, and ends -1.
        for( var i = 0; i < regexRes.length - 1; i+=3 ) {
            var k = regexRes[i+1];
            var v = regexRes[i+2];
            
            fields[k] = v;
        }
        
        return fields;
    },
    
    serializeFields : function(fields) {
        var ret = [];
        
        for( var k in fields ) {
            var v = fields[k];
            
            // TODO some kind of encoding on v?
            ret.push( k + '="' + v + '"' );
        }
        
        return ret.join( "," );
    },
    
    /**
     * According to JSJaC's impl, this is exacly the same except having AUTHENTICATE
     * before the outgoing challenge, and not in the incoming response. I 
     * have no idea why, but it gives expected output. 
     *
     * Expected to be called after the state is populated by computeChallengeResponse.
     */
    _computeResponse : function( isCheck ) {
        var A = [this._username, 
            this._domain, 
            this._password].join(":");
        
        var A1 = [str_md5(A), 
        this._nonce, 
        this._cnonce].join(":");
        
        var A2 = (isCheck?"":"AUTHENTICATE") + ":" + this._digestUri;
        var response = hex_md5([hex_md5(A1), this._nonce, this._nc, this._cnonce, this._qop, hex_md5(A2)].join(":"));
      
        return response;
    },
    
    _generateCnonce : function() {
        return cnonce(14);
    }
};