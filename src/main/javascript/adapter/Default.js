var Xmpp4Js = {};



Xmpp4Js.logLevel = Log4js.Level.ALL;
Xmpp4Js.appender = new Log4js.ConsoleAppender();
Xmpp4Js.loggers = [];

Xmpp4Js.createLogger = function(logId) {
    var logger = Log4js.getLogger( logId ); 
    logger.setLevel( Xmpp4Js.logLevel ); 
    logger.addAppender( Xmpp4Js.appender );

    Xmpp4Js.loggers.push( logger );
    
    return logger;
}
//javascript:Xmpp4Js.setLogLevel( Log4js.Level.OFF );
Xmpp4Js.setLogLevel = function(level) {
    Xmpp4Js.logLevel = level;
    
    for(var i = 0; i < Xmpp4Js.loggers.length; i++ ) {
        Xmpp4Js.loggers[i].setLevel( level );
    }
}


/**
 * Do not fork for a browser if it can be avoided.  Use feature detection when
 * you can.  Use the user agent as a last resort.  YAHOO.env.ua stores a version
 * number for the browser engine, 0 otherwise.  This value may or may not map
 * to the version number of the browser using the engine.  The value is 
 * presented as a float so that it can easily be used for boolean evaluation 
 * as well as for looking for a particular range of versions.  Because of this, 
 * some of the granularity of the version info may be lost (e.g., Gecko 1.8.0.9 
 * reports 1.8).
 * @class YAHOO.env.ua
 * @static
 */
Xmpp4Js.UA = function() {
    var o={

        /**
         * Internet Explorer version number or 0.  Example: 6
         * @property ie
         * @type float
         */
        ie:0,

        /**
         * Opera version number or 0.  Example: 9.2
         * @property opera
         * @type float
         */
        opera:0,

        /**
         * Gecko engine revision number.  Will evaluate to 1 if Gecko 
         * is detected but the revision could not be found. Other browsers
         * will be 0.  Example: 1.8
         * <pre>
         * Firefox 1.0.0.4: 1.7.8   <-- Reports 1.7
         * Firefox 1.5.0.9: 1.8.0.9 <-- Reports 1.8
         * Firefox 2.0.0.3: 1.8.1.3 <-- Reports 1.8
         * Firefox 3 alpha: 1.9a4   <-- Reports 1.9
         * </pre>
         * @property gecko
         * @type float
         */
        gecko:0,

        /**
         * AppleWebKit version.  KHTML browsers that are not WebKit browsers 
         * will evaluate to 1, other browsers 0.  Example: 418.9.1
         * <pre>
         * Safari 1.3.2 (312.6): 312.8.1 <-- Reports 312.8 -- currently the 
         *                                   latest available for Mac OSX 10.3.
         * Safari 2.0.2:         416     <-- hasOwnProperty introduced
         * Safari 2.0.4:         418     <-- preventDefault fixed
         * Safari 2.0.4 (419.3): 418.9.1 <-- One version of Safari may run
         *                                   different versions of webkit
         * Safari 2.0.4 (419.3): 419     <-- Tiger installations that have been
         *                                   updated, but not updated
         *                                   to the latest patch.
         * Webkit 212 nightly:   522+    <-- Safari 3.0 precursor (with native SVG
         *                                   and many major issues fixed).  
         * 3.x yahoo.com, flickr:422     <-- Safari 3.x hacks the user agent
         *                                   string when hitting yahoo.com and 
         *                                   flickr.com.
         * Safari 3.0.4 (523.12):523.12  <-- First Tiger release - automatic update
         *                                   from 2.x via the 10.4.11 OS patch
         * Webkit nightly 1/2008:525+    <-- Supports DOMContentLoaded event.
         *                                   yahoo.com user agent hack removed.
         *                                   
         * </pre>
         * http://developer.apple.com/internet/safari/uamatrix.html
         * @property webkit
         * @type float
         */
        webkit: 0,

        /**
         * The mobile property will be set to a string containing any relevant
         * user agent information when a modern mobile browser is detected.
         * Currently limited to Safari on the iPhone/iPod Touch, Nokia N-series
         * devices with the WebKit-based browser, and Opera Mini.  
         * @property mobile 
         * @type string
         */
        mobile: null,

        /**
         * Adobe AIR version number or 0.  Only populated if webkit is detected.
         * Example: 1.0
         * @property air
         * @type float
         */
        air: 0

    };

    var ua=navigator.userAgent, m;

    // Modern KHTML browsers should qualify as Safari X-Grade
    if ((/KHTML/).test(ua)) {
        o.webkit=1;
    }
    // Modern WebKit browsers are at least X-Grade
    m=ua.match(/AppleWebKit\/([^\s]*)/);
    if (m&&m[1]) {
        o.webkit=parseFloat(m[1]);

        // Mobile browser check
        if (/ Mobile\//.test(ua)) {
            o.mobile = "Apple"; // iPhone or iPod Touch
        } else {
            m=ua.match(/NokiaN[^\/]*/);
            if (m) {
                o.mobile = m[0]; // Nokia N-series, ex: NokiaN95
            }
        }

        m=ua.match(/AdobeAIR\/([^\s]*)/);
        if (m) {
            o.air = m[0]; // Adobe AIR 1.0 or better
        }

    }

    if (!o.webkit) { // not webkit
        // @todo check Opera/8.01 (J2ME/MIDP; Opera Mini/2.0.4509/1316; fi; U; ssr)
        m=ua.match(/Opera[\s\/]([^\s]*)/);
        if (m&&m[1]) {
            o.opera=parseFloat(m[1]);
            m=ua.match(/Opera Mini[^;]*/);
            if (m) {
                o.mobile = m[0]; // ex: Opera Mini/2.0.4509/1316
            }
        } else { // not opera or webkit
            m=ua.match(/MSIE\s([^;]*)/);
            if (m&&m[1]) {
                o.ie=parseFloat(m[1]);
            } else { // not opera, webkit, or ie
                m=ua.match(/Gecko\/([^\s]*)/);
                if (m) {
                    o.gecko=1; // Gecko detected, look for revision
                    m=ua.match(/rv:([^\s\)]*)/);
                    if (m&&m[1]) {
                        o.gecko=parseFloat(m[1]);
                    }
                }
            }
        }
    }
    
    return o;
}();

Xmpp4Js.Lang = {
    logger: Xmpp4Js.createLogger("xmpp4js.lang"),
    
    /**
     * Determines whether or not the property was added
     * to the object instance.  Returns false if the property is not present
     * in the object, or was inherited from the prototype.
     * This abstraction is provided to enable hasOwnProperty for Safari 1.3.x.
     * There is a discrepancy between YAHOO.lang.hasOwnProperty and
     * Object.prototype.hasOwnProperty when the property is a primitive added to
     * both the instance AND prototype with the same value:
     * <pre>
     * var A = function() {};
     * A.prototype.foo = 'foo';
     * var a = new A();
     * a.foo = 'foo';
     * alert(a.hasOwnProperty('foo')); // true
     * alert(YAHOO.lang.hasOwnProperty(a, 'foo')); // false when using fallback
     * </pre>
     * @method hasOwnProperty
     * @param {any} o The object being testing
     * @param prop {string} the name of the property to test
     * @return {boolean} the result
     */
    hasOwnProperty : (Object.prototype.hasOwnProperty) ?
      function(o, prop) {
          return o && o.hasOwnProperty(prop);
      } : function(o, prop) {
          return !Xmpp4Js.Lang.isUndefined(o[prop]) && 
                  o.constructor.prototype[prop] !== o[prop];
      },
    
    namespace: function(namespace, root) {
        if( !root ) { root = window; }
        var splitNS = namespace.split(/\./);
        
        var ctx = root;
        for( var i = 0; i < splitNS.length; i++ ) {
            var nsPiece = splitNS[i];
            
            if( ctx[nsPiece] === undefined ) {
                ctx[nsPiece] = {};
            }
            
            ctx = ctx[nsPiece];
        }
        
        return ctx;
    },
    
    /**
     * IE will not enumerate native functions in a derived object even if the
     * function was overridden.  This is a workaround for specific functions 
     * we care about on the Object prototype. 
     * @property _IEEnumFix
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @static
     * @private
     */
    _IEEnumFix: (Xmpp4Js.UA.ie) ? function(r, s) {
        
            // ADD = ["toString", "valueOf", "hasOwnProperty"],
            var ADD = ["toString", "valueOf"];
        
            for (var i=0;i<ADD.length;i=i+1) {
                var fname=ADD[i],f=s[fname];
                if (Xmpp4Js.Lang.isFunction(f) && f!=Object.prototype[fname]) {
                    r[fname]=f;
                }
            }
    } : function(){},
    
    /**
     * Determines whether or not the provided object is a function
     * @method isFunction
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isFunction: function(o) {
        return typeof o === 'function';
    },
    
    /**
     * Determines whether or not the provided object is undefined
     * @method isUndefined
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isUndefined: function(o) {
        return typeof o === 'undefined';
    },
    
    /**
     * Utility to set up the prototype, constructor and superclass properties to
     * support an inheritance strategy that can chain constructors and methods.
     * Static members will not be inherited.
     *
     * @method extend
     * @static
     * @param {Function} subc   the object to modify
     * @param {Function} superc the object to inherit
     * @param {Object} overrides  additional properties/methods to add to the
     *                              subclass prototype.  These will override the
     *                              matching items obtained from the superclass 
     *                              if present.
     */
    extend: function(subc, superc, overrides) {
        if (!superc||!subc) {
            throw new Error("extend failed, please check that " +
                            "all dependencies are included.");
        }
        var F = function() {};
        F.prototype=superc.prototype;
        subc.prototype=new F();
        subc.prototype.constructor=subc;
        subc.superclass=superc.prototype;
        if (superc.prototype.constructor == Object.prototype.constructor) {
            superc.prototype.constructor=superc;
        }
    
        if (overrides) {
            for (var i in overrides) {
                if (Xmpp4Js.Lang.hasOwnProperty(overrides, i)) {
                    subc.prototype[i]=overrides[i];
                }
            }

            Xmpp4Js.Lang._IEEnumFix(subc.prototype, overrides);
        }
    },
    
    id: function(prefix) {
        if(!prefix) { prefix = "soashable-"; }
        
        return prefix+Math.random(0, 50000);
    },
    
    /**
     * Applies all properties in the supplier to the receiver if the
     * receiver does not have these properties yet.  Optionally, one or 
     * more methods/properties can be specified (as additional 
     * parameters).  This option will overwrite the property if receiver 
     * has it already.  If true is passed as the third parameter, all 
     * properties will be applied and _will_ overwrite properties in 
     * the receiver.
     *
     * @method augmentObject
     * @static
     * @since 2.3.0
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @param {String*|boolean}  arguments zero or more properties methods 
     *        to augment the receiver with.  If none specified, everything
     *        in the supplier will be used unless it would
     *        overwrite an existing property in the receiver. If true
     *        is specified as the third parameter, all properties will
     *        be applied and will overwrite an existing property in
     *        the receiver
     */
    augmentObject: function(r, s) {
        if (!s||!r) {
            throw new Error("Absorb failed, verify dependencies.");
        }
        var a=arguments, i, p, override=a[2];
        if (override && override!==true) { // only absorb the specified properties
            for (i=2; i<a.length; i=i+1) {
                r[a[i]] = s[a[i]];
            }
        } else { // take everything, overwriting only if the third parameter is true
            for (p in s) { 
                if (override || !(p in r)) {
                    r[p] = s[p];
                }
            }
            
            Xmpp4Js.Lang._IEEnumFix(r, s);
        }
    },
    
    asyncRequest: function(request) {
      var xhr = Xmpp4Js.Lang.createXhr();
      
      xhr.open(request.method, request.url, request.async != undefined ? request.async : true);
      for( var header in request.headers ) {
          xhr.setRequestHeader( header, request.headers[ header ] );
      }
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 ) {
          var success = xhr.status == 200;
          
              request.callback.call( request.scope, request, success, xhr );
        }
      };
      
      var xml = request.xmlNode.toString();
      
      xhr.send(xml);
    },
    
    createXhr : function () {
        var xhr = false;
        if(window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
            if(xhr.overrideMimeType) {
                xhr.overrideMimeType('text/xml');
            }
        } else if(window.ActiveXObject) {
            try {
                xhr = new ActiveXObject('Msxml2.XMLHTTP');
            } catch(e) {
                try {
                    xhr = new ActiveXObject('Microsoft.XMLHTTP');
                } catch(e) {
                    xhr = false;
                }
            }
        }
        return xhr;
    },
    
    urlEncode: function (clearString) {
      var output = '';
      var x = 0;
      clearString = clearString.toString();
      var regex = /(^[a-zA-Z0-9_.]*)/;
      while (x < clearString.length) {
        var match = regex.exec(clearString.substr(x));
        if (match != null && match.length > 1 && match[1] != '') {
          output += match[1];
          x += match[1].length;
        } else {
          if (clearString[x] == ' ') {
            output += '+';
          } else {
            var charCode = clearString.charCodeAt(x);
            var hexVal = charCode.toString(16);
            output += '%' + ( hexVal.length < 2 ? '0' : '' ) + hexVal.toUpperCase();
          }
         x++;
        }
      }
      return output;
    },

    noOp: function(){},
    
    bind: function( fn, scope ) {
        var args = Array.prototype.slice.call(arguments);
        args.shift(); args.shift(); // remove fn and scope

        return function() {
            var fnArgs = Array.prototype.slice.call(arguments)
            return fn.apply(scope, args.concat(fnArgs));
        }
    }
}

Function.prototype.bind = function(scope) {
//;;;   Xmpp4Js.Lang.logger.warn( "Using Function.prototype.bind" );
    var args = Array.prototype.slice.call(arguments);
    args.unshift( this ); // add fn argument to the beginning
    return Xmpp4Js.Lang.bind.apply( this, args );
}


Xmpp4Js.Lang.TaskRunner = function(interval) {
    this.interval = interval;
    this.tasks = [];
    
    this.intervalId = setInterval(this.onInterval.bind(this), this.interval);
}

Xmpp4Js.Lang.TaskRunner.prototype = {
    start: function(task) {
        this.tasks.push( task );
    },
    
    stop: function(task) {
        var removeIdxs = [];
        
        for( var i = 0; i < this.tasks.length; i++ ) {
            if( this.tasks[i] === task ) {
                removeIdxs.push( i );
            }
        }
        
        this.removeTasks( removeIdxs );
    },
    
    removeTasks: function( removeIdxs ) {
        // JS is single threaded, so this shouldn't have concurrency issues
        for( var i = 0; i < removeIdxs.length; i++ ) {
            var task = this.tasks[i];
            
            // fire a stop event if present
            if( task.onStop ) {
                task.onStop.apply( task.scope ? task.scope : task );
            }
            
            this.tasks.splice( i, 1 );
        }
    },
    
    stopAll: function() {
        var removeIdxs = [];
        
        // this is kind of stupid...
        for( var i = 0; i < this.tasks.length; i++ ) {
            removeIdxs.push(i);
        }
        
        this.removeTasks( removeIdxs );
    },
    
    onInterval: function() {
        for( var i = 0; i < this.tasks.length; i++ ) {
            var task = this.tasks[i];
            
            task.run.apply( task.scope ? task.scope : task );
        }
    }
    
}




