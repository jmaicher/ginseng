(function(global) {
/**
 * almond 0.1.1 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice,
        main, req;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {},
            nameParts, nameSegment, mapValue, foundMap, i, j, part;

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; (part = name[i]); i++) {
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            return true;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                break;
                            }
                        }
                    }
                }

                foundMap = foundMap || starMap[nameSegment];

                if (foundMap) {
                    nameParts.splice(0, i, foundMap);
                    name = nameParts.join('/');
                    break;
                }
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    main = function (name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, ret, map, i;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i++) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name],
                        config: makeConfig(name)
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else if (!defining[depName]) {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                    cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());

define("../vendor/almond", function(){});

// Underscore.js 1.3.1
// (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore is freely distributable under the MIT license.
// Portions of Underscore are inspired or borrowed from Prototype,
// Oliver Steele's Functional, and John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore
(function(){function q(a,c,d){if(a===c)return 0!==a||1/a==1/c;if(null==a||null==c)return a===c;a._chain&&(a=a._wrapped);c._chain&&(c=c._wrapped);if(a.isEqual&&b.isFunction(a.isEqual))return a.isEqual(c);if(c.isEqual&&b.isFunction(c.isEqual))return c.isEqual(a);var e=l.call(a);if(e!=l.call(c))return!1;switch(e){case "[object String]":return a==""+c;case "[object Number]":return a!=+a?c!=+c:0==a?1/a==1/c:a==+c;case "[object Date]":case "[object Boolean]":return+a==+c;case "[object RegExp]":return a.source==
c.source&&a.global==c.global&&a.multiline==c.multiline&&a.ignoreCase==c.ignoreCase}if("object"!=typeof a||"object"!=typeof c)return!1;for(var f=d.length;f--;)if(d[f]==a)return!0;d.push(a);var f=0,g=!0;if("[object Array]"==e){if(f=a.length,g=f==c.length)for(;f--&&(g=f in a==f in c&&q(a[f],c[f],d)););}else{if("constructor"in a!="constructor"in c||a.constructor!=c.constructor)return!1;for(var h in a)if(b.has(a,h)&&(f++,!(g=b.has(c,h)&&q(a[h],c[h],d))))break;if(g){for(h in c)if(b.has(c,h)&&!f--)break;
g=!f}}d.pop();return g}var r=this,G=r._,n={},k=Array.prototype,o=Object.prototype,i=k.slice,H=k.unshift,l=o.toString,I=o.hasOwnProperty,w=k.forEach,x=k.map,y=k.reduce,z=k.reduceRight,A=k.filter,B=k.every,C=k.some,p=k.indexOf,D=k.lastIndexOf,o=Array.isArray,J=Object.keys,s=Function.prototype.bind,b=function(a){return new m(a)};"undefined"!==typeof exports?("undefined"!==typeof module&&module.exports&&(exports=module.exports=b),exports._=b):r._=b;b.VERSION="1.3.1";var j=b.each=b.forEach=function(a,
c,d){if(a!=null)if(w&&a.forEach===w)a.forEach(c,d);else if(a.length===+a.length)for(var e=0,f=a.length;e<f;e++){if(e in a&&c.call(d,a[e],e,a)===n)break}else for(e in a)if(b.has(a,e)&&c.call(d,a[e],e,a)===n)break};b.map=b.collect=function(a,c,b){var e=[];if(a==null)return e;if(x&&a.map===x)return a.map(c,b);j(a,function(a,g,h){e[e.length]=c.call(b,a,g,h)});if(a.length===+a.length)e.length=a.length;return e};b.reduce=b.foldl=b.inject=function(a,c,d,e){var f=arguments.length>2;a==null&&(a=[]);if(y&&
a.reduce===y){e&&(c=b.bind(c,e));return f?a.reduce(c,d):a.reduce(c)}j(a,function(a,b,i){if(f)d=c.call(e,d,a,b,i);else{d=a;f=true}});if(!f)throw new TypeError("Reduce of empty array with no initial value");return d};b.reduceRight=b.foldr=function(a,c,d,e){var f=arguments.length>2;a==null&&(a=[]);if(z&&a.reduceRight===z){e&&(c=b.bind(c,e));return f?a.reduceRight(c,d):a.reduceRight(c)}var g=b.toArray(a).reverse();e&&!f&&(c=b.bind(c,e));return f?b.reduce(g,c,d,e):b.reduce(g,c)};b.find=b.detect=function(a,
c,b){var e;E(a,function(a,g,h){if(c.call(b,a,g,h)){e=a;return true}});return e};b.filter=b.select=function(a,c,b){var e=[];if(a==null)return e;if(A&&a.filter===A)return a.filter(c,b);j(a,function(a,g,h){c.call(b,a,g,h)&&(e[e.length]=a)});return e};b.reject=function(a,c,b){var e=[];if(a==null)return e;j(a,function(a,g,h){c.call(b,a,g,h)||(e[e.length]=a)});return e};b.every=b.all=function(a,c,b){var e=true;if(a==null)return e;if(B&&a.every===B)return a.every(c,b);j(a,function(a,g,h){if(!(e=e&&c.call(b,
a,g,h)))return n});return e};var E=b.some=b.any=function(a,c,d){c||(c=b.identity);var e=false;if(a==null)return e;if(C&&a.some===C)return a.some(c,d);j(a,function(a,b,h){if(e||(e=c.call(d,a,b,h)))return n});return!!e};b.include=b.contains=function(a,c){var b=false;if(a==null)return b;if(p&&a.indexOf===p)return a.indexOf(c)!=-1;return b=E(a,function(a){return a===c})};b.invoke=function(a,c){var d=i.call(arguments,2);return b.map(a,function(a){return(b.isFunction(c)?c||a:a[c]).apply(a,d)})};b.pluck=
function(a,c){return b.map(a,function(a){return a[c]})};b.max=function(a,c,d){if(!c&&b.isArray(a))return Math.max.apply(Math,a);if(!c&&b.isEmpty(a))return-Infinity;var e={computed:-Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b>=e.computed&&(e={value:a,computed:b})});return e.value};b.min=function(a,c,d){if(!c&&b.isArray(a))return Math.min.apply(Math,a);if(!c&&b.isEmpty(a))return Infinity;var e={computed:Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b<e.computed&&(e={value:a,computed:b})});
return e.value};b.shuffle=function(a){var b=[],d;j(a,function(a,f){if(f==0)b[0]=a;else{d=Math.floor(Math.random()*(f+1));b[f]=b[d];b[d]=a}});return b};b.sortBy=function(a,c,d){return b.pluck(b.map(a,function(a,b,g){return{value:a,criteria:c.call(d,a,b,g)}}).sort(function(a,b){var c=a.criteria,d=b.criteria;return c<d?-1:c>d?1:0}),"value")};b.groupBy=function(a,c){var d={},e=b.isFunction(c)?c:function(a){return a[c]};j(a,function(a,b){var c=e(a,b);(d[c]||(d[c]=[])).push(a)});return d};b.sortedIndex=
function(a,c,d){d||(d=b.identity);for(var e=0,f=a.length;e<f;){var g=e+f>>1;d(a[g])<d(c)?e=g+1:f=g}return e};b.toArray=function(a){return!a?[]:a.toArray?a.toArray():b.isArray(a)||b.isArguments(a)?i.call(a):b.values(a)};b.size=function(a){return b.toArray(a).length};b.first=b.head=function(a,b,d){return b!=null&&!d?i.call(a,0,b):a[0]};b.initial=function(a,b,d){return i.call(a,0,a.length-(b==null||d?1:b))};b.last=function(a,b,d){return b!=null&&!d?i.call(a,Math.max(a.length-b,0)):a[a.length-1]};b.rest=
b.tail=function(a,b,d){return i.call(a,b==null||d?1:b)};b.compact=function(a){return b.filter(a,function(a){return!!a})};b.flatten=function(a,c){return b.reduce(a,function(a,e){if(b.isArray(e))return a.concat(c?e:b.flatten(e));a[a.length]=e;return a},[])};b.without=function(a){return b.difference(a,i.call(arguments,1))};b.uniq=b.unique=function(a,c,d){var d=d?b.map(a,d):a,e=[];b.reduce(d,function(d,g,h){if(0==h||(c===true?b.last(d)!=g:!b.include(d,g))){d[d.length]=g;e[e.length]=a[h]}return d},[]);
return e};b.union=function(){return b.uniq(b.flatten(arguments,true))};b.intersection=b.intersect=function(a){var c=i.call(arguments,1);return b.filter(b.uniq(a),function(a){return b.every(c,function(c){return b.indexOf(c,a)>=0})})};b.difference=function(a){var c=b.flatten(i.call(arguments,1));return b.filter(a,function(a){return!b.include(c,a)})};b.zip=function(){for(var a=i.call(arguments),c=b.max(b.pluck(a,"length")),d=Array(c),e=0;e<c;e++)d[e]=b.pluck(a,""+e);return d};b.indexOf=function(a,c,
d){if(a==null)return-1;var e;if(d){d=b.sortedIndex(a,c);return a[d]===c?d:-1}if(p&&a.indexOf===p)return a.indexOf(c);d=0;for(e=a.length;d<e;d++)if(d in a&&a[d]===c)return d;return-1};b.lastIndexOf=function(a,b){if(a==null)return-1;if(D&&a.lastIndexOf===D)return a.lastIndexOf(b);for(var d=a.length;d--;)if(d in a&&a[d]===b)return d;return-1};b.range=function(a,b,d){if(arguments.length<=1){b=a||0;a=0}for(var d=arguments[2]||1,e=Math.max(Math.ceil((b-a)/d),0),f=0,g=Array(e);f<e;){g[f++]=a;a=a+d}return g};
var F=function(){};b.bind=function(a,c){var d,e;if(a.bind===s&&s)return s.apply(a,i.call(arguments,1));if(!b.isFunction(a))throw new TypeError;e=i.call(arguments,2);return d=function(){if(!(this instanceof d))return a.apply(c,e.concat(i.call(arguments)));F.prototype=a.prototype;var b=new F,g=a.apply(b,e.concat(i.call(arguments)));return Object(g)===g?g:b}};b.bindAll=function(a){var c=i.call(arguments,1);c.length==0&&(c=b.functions(a));j(c,function(c){a[c]=b.bind(a[c],a)});return a};b.memoize=function(a,
c){var d={};c||(c=b.identity);return function(){var e=c.apply(this,arguments);return b.has(d,e)?d[e]:d[e]=a.apply(this,arguments)}};b.delay=function(a,b){var d=i.call(arguments,2);return setTimeout(function(){return a.apply(a,d)},b)};b.defer=function(a){return b.delay.apply(b,[a,1].concat(i.call(arguments,1)))};b.throttle=function(a,c){var d,e,f,g,h,i=b.debounce(function(){h=g=false},c);return function(){d=this;e=arguments;f||(f=setTimeout(function(){f=null;h&&a.apply(d,e);i()},c));g?h=true:a.apply(d,
e);i();g=true}};b.debounce=function(a,b){var d;return function(){var e=this,f=arguments;clearTimeout(d);d=setTimeout(function(){d=null;a.apply(e,f)},b)}};b.once=function(a){var b=false,d;return function(){if(b)return d;b=true;return d=a.apply(this,arguments)}};b.wrap=function(a,b){return function(){var d=[a].concat(i.call(arguments,0));return b.apply(this,d)}};b.compose=function(){var a=arguments;return function(){for(var b=arguments,d=a.length-1;d>=0;d--)b=[a[d].apply(this,b)];return b[0]}};b.after=
function(a,b){return a<=0?b():function(){if(--a<1)return b.apply(this,arguments)}};b.keys=J||function(a){if(a!==Object(a))throw new TypeError("Invalid object");var c=[],d;for(d in a)b.has(a,d)&&(c[c.length]=d);return c};b.values=function(a){return b.map(a,b.identity)};b.functions=b.methods=function(a){var c=[],d;for(d in a)b.isFunction(a[d])&&c.push(d);return c.sort()};b.extend=function(a){j(i.call(arguments,1),function(b){for(var d in b)a[d]=b[d]});return a};b.defaults=function(a){j(i.call(arguments,
1),function(b){for(var d in b)a[d]==null&&(a[d]=b[d])});return a};b.clone=function(a){return!b.isObject(a)?a:b.isArray(a)?a.slice():b.extend({},a)};b.tap=function(a,b){b(a);return a};b.isEqual=function(a,b){return q(a,b,[])};b.isEmpty=function(a){if(b.isArray(a)||b.isString(a))return a.length===0;for(var c in a)if(b.has(a,c))return false;return true};b.isElement=function(a){return!!(a&&a.nodeType==1)};b.isArray=o||function(a){return l.call(a)=="[object Array]"};b.isObject=function(a){return a===Object(a)};
b.isArguments=function(a){return l.call(a)=="[object Arguments]"};b.isArguments(arguments)||(b.isArguments=function(a){return!(!a||!b.has(a,"callee"))});b.isFunction=function(a){return l.call(a)=="[object Function]"};b.isString=function(a){return l.call(a)=="[object String]"};b.isNumber=function(a){return l.call(a)=="[object Number]"};b.isNaN=function(a){return a!==a};b.isBoolean=function(a){return a===true||a===false||l.call(a)=="[object Boolean]"};b.isDate=function(a){return l.call(a)=="[object Date]"};
b.isRegExp=function(a){return l.call(a)=="[object RegExp]"};b.isNull=function(a){return a===null};b.isUndefined=function(a){return a===void 0};b.has=function(a,b){return I.call(a,b)};b.noConflict=function(){r._=G;return this};b.identity=function(a){return a};b.times=function(a,b,d){for(var e=0;e<a;e++)b.call(d,e)};b.escape=function(a){return(""+a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;")};b.mixin=function(a){j(b.functions(a),
function(c){K(c,b[c]=a[c])})};var L=0;b.uniqueId=function(a){var b=L++;return a?a+b:b};b.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var t=/.^/,u=function(a){return a.replace(/\\\\/g,"\\").replace(/\\'/g,"'")};b.template=function(a,c){var d=b.templateSettings,d="var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('"+a.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(d.escape||t,function(a,b){return"',_.escape("+
u(b)+"),'"}).replace(d.interpolate||t,function(a,b){return"',"+u(b)+",'"}).replace(d.evaluate||t,function(a,b){return"');"+u(b).replace(/[\r\n\t]/g," ")+";__p.push('"}).replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"');}return __p.join('');",e=new Function("obj","_",d);return c?e(c,b):function(a){return e.call(this,a,b)}};b.chain=function(a){return b(a).chain()};var m=function(a){this._wrapped=a};b.prototype=m.prototype;var v=function(a,c){return c?b(a).chain():a},K=function(a,c){m.prototype[a]=
function(){var a=i.call(arguments);H.call(a,this._wrapped);return v(c.apply(b,a),this._chain)}};b.mixin(b);j("pop,push,reverse,shift,sort,splice,unshift".split(","),function(a){var b=k[a];m.prototype[a]=function(){var d=this._wrapped;b.apply(d,arguments);var e=d.length;(a=="shift"||a=="splice")&&e===0&&delete d[0];return v(d,this._chain)}});j(["concat","join","slice"],function(a){var b=k[a];m.prototype[a]=function(){return v(b.apply(this._wrapped,arguments),this._chain)}});m.prototype.chain=function(){this._chain=
true;return this};m.prototype.value=function(){return this._wrapped};"function"===typeof define&&define.amd&&define("underscore",[],function(){return b})}).call(this);

// This module acts as jQuery adapter and returns the global
// jQuery object.
//
// This is a workaround to create builds without jQuery.
// The Backbone AMD module requires jQuery. If the jQuery module
// is excluded from the build, almond will throw an exception. 
// (See: https://github.com/jrburke/almond/issues/12)
define('jquery',[],function() {
  return jQuery;
});

// Backbone.js 0.9.2

// (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
// Backbone may be freely distributed under the MIT license.
// For all details and documentation:
// http://backbonejs.org
(function(h,g){"undefined"!==typeof exports?g(h,exports,require("underscore")):"function"===typeof define&&define.amd?define('backbone',["underscore","jquery","exports"],function(f,i,p){h.Backbone=g(h,p,f,i)}):h.Backbone=g(h,{},h._,h.jQuery||h.Zepto||h.ender)})(this,function(h,g,f,i){var p=h.Backbone,y=Array.prototype.slice,z=Array.prototype.splice;g.VERSION="0.9.2";g.setDomLibrary=function(a){i=a};g.noConflict=function(){h.Backbone=p;return g};g.emulateHTTP=!1;g.emulateJSON=!1;var q=/\s+/,l=g.Events={on:function(a,
b,c){var d,e,f,g,j;if(!b)return this;a=a.split(q);for(d=this._callbacks||(this._callbacks={});e=a.shift();)f=(j=d[e])?j.tail:{},f.next=g={},f.context=c,f.callback=b,d[e]={tail:g,next:j?j.next:f};return this},off:function(a,b,c){var d,e,k,g,j,h;if(e=this._callbacks){if(!a&&!b&&!c)return delete this._callbacks,this;for(a=a?a.split(q):f.keys(e);d=a.shift();)if(k=e[d],delete e[d],k&&(b||c))for(g=k.tail;(k=k.next)!==g;)if(j=k.callback,h=k.context,b&&j!==b||c&&h!==c)this.on(d,j,h);return this}},trigger:function(a){var b,
c,d,e,f,g;if(!(d=this._callbacks))return this;f=d.all;a=a.split(q);for(g=y.call(arguments,1);b=a.shift();){if(c=d[b])for(e=c.tail;(c=c.next)!==e;)c.callback.apply(c.context||this,g);if(c=f){e=c.tail;for(b=[b].concat(g);(c=c.next)!==e;)c.callback.apply(c.context||this,b)}}return this}};l.bind=l.on;l.unbind=l.off;var o=g.Model=function(a,b){var c;a||(a={});b&&b.parse&&(a=this.parse(a));if(c=n(this,"defaults"))a=f.extend({},c,a);b&&b.collection&&(this.collection=b.collection);this.attributes={};this._escapedAttributes=
{};this.cid=f.uniqueId("c");this.changed={};this._silent={};this._pending={};this.set(a,{silent:!0});this.changed={};this._silent={};this._pending={};this._previousAttributes=f.clone(this.attributes);this.initialize.apply(this,arguments)};f.extend(o.prototype,l,{changed:null,_silent:null,_pending:null,idAttribute:"id",initialize:function(){},toJSON:function(){return f.clone(this.attributes)},get:function(a){return this.attributes[a]},escape:function(a){var b;if(b=this._escapedAttributes[a])return b;
b=this.get(a);return this._escapedAttributes[a]=f.escape(null==b?"":""+b)},has:function(a){return null!=this.get(a)},set:function(a,b,c){var d,e;f.isObject(a)||null==a?(d=a,c=b):(d={},d[a]=b);c||(c={});if(!d)return this;d instanceof o&&(d=d.attributes);if(c.unset)for(e in d)d[e]=void 0;if(!this._validate(d,c))return!1;this.idAttribute in d&&(this.id=d[this.idAttribute]);var b=c.changes={},g=this.attributes,h=this._escapedAttributes,j=this._previousAttributes||{};for(e in d){a=d[e];if(!f.isEqual(g[e],
a)||c.unset&&f.has(g,e))delete h[e],(c.silent?this._silent:b)[e]=!0;c.unset?delete g[e]:g[e]=a;!f.isEqual(j[e],a)||f.has(g,e)!=f.has(j,e)?(this.changed[e]=a,c.silent||(this._pending[e]=!0)):(delete this.changed[e],delete this._pending[e])}c.silent||this.change(c);return this},unset:function(a,b){(b||(b={})).unset=!0;return this.set(a,null,b)},clear:function(a){(a||(a={})).unset=!0;return this.set(f.clone(this.attributes),a)},fetch:function(a){var a=a?f.clone(a):{},b=this,c=a.success;a.success=function(d,
e,f){if(!b.set(b.parse(d,f),a))return!1;c&&c(b,d)};a.error=g.wrapError(a.error,b,a);return(this.sync||g.sync).call(this,"read",this,a)},save:function(a,b,c){var d,e;f.isObject(a)||null==a?(d=a,c=b):(d={},d[a]=b);c=c?f.clone(c):{};if(c.wait){if(!this._validate(d,c))return!1;e=f.clone(this.attributes)}a=f.extend({},c,{silent:!0});if(d&&!this.set(d,c.wait?a:c))return!1;var k=this,h=c.success;c.success=function(a,b,e){b=k.parse(a,e);if(c.wait){delete c.wait;b=f.extend(d||{},b)}if(!k.set(b,c))return false;
h?h(k,a):k.trigger("sync",k,a,c)};c.error=g.wrapError(c.error,k,c);b=this.isNew()?"create":"update";b=(this.sync||g.sync).call(this,b,this,c);c.wait&&this.set(e,a);return b},destroy:function(a){var a=a?f.clone(a):{},b=this,c=a.success,d=function(){b.trigger("destroy",b,b.collection,a)};if(this.isNew())return d(),!1;a.success=function(e){a.wait&&d();c?c(b,e):b.trigger("sync",b,e,a)};a.error=g.wrapError(a.error,b,a);var e=(this.sync||g.sync).call(this,"delete",this,a);a.wait||d();return e},url:function(){var a=
n(this,"urlRoot")||n(this.collection,"url")||t();return this.isNew()?a:a+("/"==a.charAt(a.length-1)?"":"/")+encodeURIComponent(this.id)},parse:function(a){return a},clone:function(){return new this.constructor(this.attributes)},isNew:function(){return null==this.id},change:function(a){a||(a={});var b=this._changing;this._changing=!0;for(var c in this._silent)this._pending[c]=!0;var d=f.extend({},a.changes,this._silent);this._silent={};for(c in d)this.trigger("change:"+c,this,this.get(c),a);if(b)return this;
for(;!f.isEmpty(this._pending);){this._pending={};this.trigger("change",this,a);for(c in this.changed)!this._pending[c]&&!this._silent[c]&&delete this.changed[c];this._previousAttributes=f.clone(this.attributes)}this._changing=!1;return this},hasChanged:function(a){return!arguments.length?!f.isEmpty(this.changed):f.has(this.changed,a)},changedAttributes:function(a){if(!a)return this.hasChanged()?f.clone(this.changed):!1;var b,c=!1,d=this._previousAttributes,e;for(e in a)if(!f.isEqual(d[e],b=a[e]))(c||
(c={}))[e]=b;return c},previous:function(a){return!arguments.length||!this._previousAttributes?null:this._previousAttributes[a]},previousAttributes:function(){return f.clone(this._previousAttributes)},isValid:function(){return!this.validate(this.attributes)},_validate:function(a,b){if(b.silent||!this.validate)return!0;var a=f.extend({},this.attributes,a),c=this.validate(a,b);if(!c)return!0;b&&b.error?b.error(this,c,b):this.trigger("error",this,c,b);return!1}});var r=g.Collection=function(a,b){b||
(b={});b.model&&(this.model=b.model);b.comparator&&(this.comparator=b.comparator);this._reset();this.initialize.apply(this,arguments);a&&this.reset(a,{silent:!0,parse:b.parse})};f.extend(r.prototype,l,{model:o,initialize:function(){},toJSON:function(a){return this.map(function(b){return b.toJSON(a)})},add:function(a,b){var c,d,e,g,h,j={},i={},l=[];b||(b={});a=f.isArray(a)?a.slice():[a];c=0;for(d=a.length;c<d;c++){if(!(e=a[c]=this._prepareModel(a[c],b)))throw Error("Can't add an invalid model to a collection");
g=e.cid;h=e.id;j[g]||this._byCid[g]||null!=h&&(i[h]||this._byId[h])?l.push(c):j[g]=i[h]=e}for(c=l.length;c--;)a.splice(l[c],1);c=0;for(d=a.length;c<d;c++)(e=a[c]).on("all",this._onModelEvent,this),this._byCid[e.cid]=e,null!=e.id&&(this._byId[e.id]=e);this.length+=d;z.apply(this.models,[null!=b.at?b.at:this.models.length,0].concat(a));this.comparator&&this.sort({silent:!0});if(b.silent)return this;c=0;for(d=this.models.length;c<d;c++)if(j[(e=this.models[c]).cid])b.index=c,e.trigger("add",e,this,b);
return this},remove:function(a,b){var c,d,e,g;b||(b={});a=f.isArray(a)?a.slice():[a];c=0;for(d=a.length;c<d;c++)if(g=this.getByCid(a[c])||this.get(a[c]))delete this._byId[g.id],delete this._byCid[g.cid],e=this.indexOf(g),this.models.splice(e,1),this.length--,b.silent||(b.index=e,g.trigger("remove",g,this,b)),this._removeReference(g);return this},push:function(a,b){a=this._prepareModel(a,b);this.add(a,b);return a},pop:function(a){var b=this.at(this.length-1);this.remove(b,a);return b},unshift:function(a,
b){a=this._prepareModel(a,b);this.add(a,f.extend({at:0},b));return a},shift:function(a){var b=this.at(0);this.remove(b,a);return b},get:function(a){return null==a?void 0:this._byId[null!=a.id?a.id:a]},getByCid:function(a){return a&&this._byCid[a.cid||a]},at:function(a){return this.models[a]},where:function(a){return f.isEmpty(a)?[]:this.filter(function(b){for(var c in a)if(a[c]!==b.get(c))return!1;return!0})},sort:function(a){a||(a={});if(!this.comparator)throw Error("Cannot sort a set without a comparator");
var b=f.bind(this.comparator,this);1==this.comparator.length?this.models=this.sortBy(b):this.models.sort(b);a.silent||this.trigger("reset",this,a);return this},pluck:function(a){return f.map(this.models,function(b){return b.get(a)})},reset:function(a,b){a||(a=[]);b||(b={});for(var c=0,d=this.models.length;c<d;c++)this._removeReference(this.models[c]);this._reset();this.add(a,f.extend({silent:!0},b));b.silent||this.trigger("reset",this,b);return this},fetch:function(a){a=a?f.clone(a):{};void 0===a.parse&&
(a.parse=!0);var b=this,c=a.success;a.success=function(d,e,f){b[a.add?"add":"reset"](b.parse(d,f),a);c&&c(b,d)};a.error=g.wrapError(a.error,b,a);return(this.sync||g.sync).call(this,"read",this,a)},create:function(a,b){var c=this,b=b?f.clone(b):{},a=this._prepareModel(a,b);if(!a)return!1;b.wait||c.add(a,b);var d=b.success;b.success=function(e,f){b.wait&&c.add(e,b);d?d(e,f):e.trigger("sync",a,f,b)};a.save(null,b);return a},parse:function(a){return a},chain:function(){return f(this.models).chain()},
_reset:function(){this.length=0;this.models=[];this._byId={};this._byCid={}},_prepareModel:function(a,b){b||(b={});a instanceof o?a.collection||(a.collection=this):(b.collection=this,a=new this.model(a,b),a._validate(a.attributes,b)||(a=!1));return a},_removeReference:function(a){this==a.collection&&delete a.collection;a.off("all",this._onModelEvent,this)},_onModelEvent:function(a,b,c,d){("add"==a||"remove"==a)&&c!=this||("destroy"==a&&this.remove(b,d),b&&a==="change:"+b.idAttribute&&(delete this._byId[b.previous(b.idAttribute)],
this._byId[b.id]=b),this.trigger.apply(this,arguments))}});f.each("forEach,each,map,reduce,reduceRight,find,detect,filter,select,reject,every,all,some,any,include,contains,invoke,max,min,sortBy,sortedIndex,toArray,size,first,initial,rest,last,without,indexOf,shuffle,lastIndexOf,isEmpty,groupBy".split(","),function(a){r.prototype[a]=function(){return f[a].apply(f,[this.models].concat(f.toArray(arguments)))}});var u=g.Router=function(a){a||(a={});a.routes&&(this.routes=a.routes);this._bindRoutes();
this.initialize.apply(this,arguments)},A=/:\w+/g,B=/\*\w+/g,C=/[-[\]{}()+?.,\\^$|#\s]/g;f.extend(u.prototype,l,{initialize:function(){},route:function(a,b,c){g.history||(g.history=new m);f.isRegExp(a)||(a=this._routeToRegExp(a));c||(c=this[b]);g.history.route(a,f.bind(function(d){d=this._extractParameters(a,d);c&&c.apply(this,d);this.trigger.apply(this,["route:"+b].concat(d));g.history.trigger("route",this,b,d)},this));return this},navigate:function(a,b){g.history.navigate(a,b)},_bindRoutes:function(){if(this.routes){var a=
[],b;for(b in this.routes)a.unshift([b,this.routes[b]]);b=0;for(var c=a.length;b<c;b++)this.route(a[b][0],a[b][1],this[a[b][1]])}},_routeToRegExp:function(a){a=a.replace(C,"\\$&").replace(A,"([^/]+)").replace(B,"(.*?)");return RegExp("^"+a+"$")},_extractParameters:function(a,b){return a.exec(b).slice(1)}});var m=g.History=function(){this.handlers=[];f.bindAll(this,"checkUrl")},s=/^[#\/]/,D=/msie [\w.]+/;m.started=!1;f.extend(m.prototype,l,{interval:50,getHash:function(a){return(a=(a?a.location:window.location).href.match(/#(.*)$/))?
a[1]:""},getFragment:function(a,b){if(null==a)if(this._hasPushState||b){var a=window.location.pathname,c=window.location.search;c&&(a+=c)}else a=this.getHash();a.indexOf(this.options.root)||(a=a.substr(this.options.root.length));return a.replace(s,"")},start:function(a){if(m.started)throw Error("Backbone.history has already been started");m.started=!0;this.options=f.extend({},{root:"/"},this.options,a);this._wantsHashChange=!1!==this.options.hashChange;this._wantsPushState=!!this.options.pushState;
this._hasPushState=!(!this.options.pushState||!window.history||!window.history.pushState);var a=this.getFragment(),b=document.documentMode;if(b=D.exec(navigator.userAgent.toLowerCase())&&(!b||7>=b))this.iframe=i('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow,this.navigate(a);this._hasPushState?i(window).bind("popstate",this.checkUrl):this._wantsHashChange&&"onhashchange"in window&&!b?i(window).bind("hashchange",this.checkUrl):this._wantsHashChange&&(this._checkUrlInterval=
setInterval(this.checkUrl,this.interval));this.fragment=a;a=window.location;b=a.pathname==this.options.root;if(this._wantsHashChange&&this._wantsPushState&&!this._hasPushState&&!b)return this.fragment=this.getFragment(null,!0),window.location.replace(this.options.root+"#"+this.fragment),!0;this._wantsPushState&&this._hasPushState&&b&&a.hash&&(this.fragment=this.getHash().replace(s,""),window.history.replaceState({},document.title,a.protocol+"//"+a.host+this.options.root+this.fragment));if(!this.options.silent)return this.loadUrl()},
stop:function(){i(window).unbind("popstate",this.checkUrl).unbind("hashchange",this.checkUrl);clearInterval(this._checkUrlInterval);m.started=!1},route:function(a,b){this.handlers.unshift({route:a,callback:b})},checkUrl:function(){var a=this.getFragment();a==this.fragment&&this.iframe&&(a=this.getFragment(this.getHash(this.iframe)));if(a==this.fragment)return!1;this.iframe&&this.navigate(a);this.loadUrl()||this.loadUrl(this.getHash())},loadUrl:function(a){var b=this.fragment=this.getFragment(a);return f.any(this.handlers,
function(a){if(a.route.test(b))return a.callback(b),!0})},navigate:function(a,b){if(!m.started)return!1;if(!b||!0===b)b={trigger:b};var c=(a||"").replace(s,"");this.fragment!=c&&(this._hasPushState?(0!=c.indexOf(this.options.root)&&(c=this.options.root+c),this.fragment=c,window.history[b.replace?"replaceState":"pushState"]({},document.title,c)):this._wantsHashChange?(this.fragment=c,this._updateHash(window.location,c,b.replace),this.iframe&&c!=this.getFragment(this.getHash(this.iframe))&&(b.replace||
this.iframe.document.open().close(),this._updateHash(this.iframe.location,c,b.replace))):window.location.assign(this.options.root+a),b.trigger&&this.loadUrl(a))},_updateHash:function(a,b,c){c?a.replace(a.toString().replace(/(javascript:|#).*$/,"")+"#"+b):a.hash=b}});var v=g.View=function(a){this.cid=f.uniqueId("view");this._configure(a||{});this._ensureElement();this.initialize.apply(this,arguments);this.delegateEvents()},E=/^(\S+)\s*(.*)$/,w="model,collection,el,id,attributes,className,tagName".split(",");
f.extend(v.prototype,l,{tagName:"div",$:function(a){return this.$el.find(a)},initialize:function(){},render:function(){return this},remove:function(){this.$el.remove();return this},make:function(a,b,c){a=document.createElement(a);b&&i(a).attr(b);null!=c&&i(a).html(c);return a},setElement:function(a,b){this.$el&&this.undelegateEvents();this.$el=a instanceof i?a:i(a);this.el=this.$el[0];!1!==b&&this.delegateEvents();return this},delegateEvents:function(a){if(a||(a=n(this,"events"))){this.undelegateEvents();
for(var b in a){var c=a[b];f.isFunction(c)||(c=this[a[b]]);if(!c)throw Error('Method "'+a[b]+'" does not exist');var d=b.match(E),e=d[1],d=d[2],c=f.bind(c,this),e=e+(".delegateEvents"+this.cid);""===d?this.$el.bind(e,c):this.$el.delegate(d,e,c)}}},undelegateEvents:function(){this.$el.unbind(".delegateEvents"+this.cid)},_configure:function(a){this.options&&(a=f.extend({},this.options,a));for(var b=0,c=w.length;b<c;b++){var d=w[b];a[d]&&(this[d]=a[d])}this.options=a},_ensureElement:function(){if(this.el)this.setElement(this.el,
!1);else{var a=n(this,"attributes")||{};this.id&&(a.id=this.id);this.className&&(a["class"]=this.className);this.setElement(this.make(this.tagName,a),!1)}}});o.extend=r.extend=u.extend=v.extend=function(a,b){var c=F(this,a,b);c.extend=this.extend;return c};var G={create:"POST",update:"PUT","delete":"DELETE",read:"GET"};g.sync=function(a,b,c){var d=G[a];c||(c={});var e={type:d,dataType:"json"};c.url||(e.url=n(b,"url")||t());if(!c.data&&b&&("create"==a||"update"==a))e.contentType="application/json",
e.data=JSON.stringify(b.toJSON());g.emulateJSON&&(e.contentType="application/x-www-form-urlencoded",e.data=e.data?{model:e.data}:{});if(g.emulateHTTP&&("PUT"===d||"DELETE"===d))g.emulateJSON&&(e.data._method=d),e.type="POST",e.beforeSend=function(a){a.setRequestHeader("X-HTTP-Method-Override",d)};"GET"!==e.type&&!g.emulateJSON&&(e.processData=!1);return i.ajax(f.extend(e,c))};g.wrapError=function(a,b,c){return function(d,e){e=d===b?e:d;a?a(b,e,c):b.trigger("error",b,e,c)}};var x=function(){},F=function(a,
b,c){var d;d=b&&b.hasOwnProperty("constructor")?b.constructor:function(){a.apply(this,arguments)};f.extend(d,a);x.prototype=a.prototype;d.prototype=new x;b&&f.extend(d.prototype,b);c&&f.extend(d,c);d.prototype.constructor=d;d.__super__=a.prototype;return d},n=function(a,b){return!a||!a[b]?null:f.isFunction(a[b])?a[b]():a[b]},t=function(){throw Error('A "url" property or function must be specified');};return g});

/**
 * A module that provides inheritance helpers
 *
 * @module ginseng/helpers/inheritance
 *
 * @requires underscore
 */
define('ginseng/helpers/inheritance',[
  'underscore'
], function(
  _
) {
  

  var exports = {

    /**
     * This function implements a pattern for pseudo-classical inheritance.
     * The returned "class" inherits from the given parent "class" with the
     * given additional prototype properties (= instance properties)
     * and static properties (= class properties).
     *
     * Example:
     * var Car = function() { .. };
     * var SportsCar = inherit(Car, { seats: 2 }, { vendors: ['ferrari', 'porsche'] };
     *
     * @param {function} parent from which the returned child will inherit
     * @param {object} [protoProps] object with prototype properties (= instance properties)
     * @param {object} [staticProps] object with static properties (= class properties)
     * @returns {function} child which inherits from parent with the given prototype and static properties
     */
    inherit: function(Parent, protoProps, staticProps) {

      var Child;

      // allow to provide custom constructor via protoProps.constructor
      if (protoProps && protoProps.hasOwnProperty('constructor')) {
        Child = protoProps.constructor;
      } else {
        // if no constructor has been provided we return default constructor
        // which uses the Parent constructor
        Child = function() {
          return Parent.apply(this, arguments);
        };
      }
      
      // inherit static properties from Parent
      // => copy all (static) properties from Parent to Child
      // @see http://documentcloud.github.com/underscore/#extend
      _.extend(Child, Parent);

      // inherit prototype properties from Parent via intermediate constructor 
      // to avoid having to invoke the Parent constructor directly (Child.prototype = new Parent())
      // which could create unwanted state or fail in absence of input arguments
      function F() {}
      F.prototype = Parent.prototype;
      Child.prototype = new F();

      // copy given prototype properties to Child
      // (may override Parent prototype properties)
      if(protoProps) {
        _.extend(Child.prototype, protoProps);
      }

      // copy given static properties to Child
      // (may override static Parent properties)
      if(staticProps) {
        _.extend(Child, staticProps);
      }

      // set Child's prototype constructor property to Child
      // else it would be Parent
      Child.prototype.constructor = Child;

      // make Parent's prototype available via Child's prototype __super__ property
      // this allows f.e. calling overriden methods: this.__super__.someOverridenFunction.call(this)
      Child.prototype.__super__ = Parent.prototype;

      return Child;
    },


    /**
     * This function implements the mixin pattern.
     * It extends a given object with all the properties from passed in object(s).
     *
     * Example:
     * var Car = function() {};
     * var Driveable = { drive: function() {} };
     * mixin(Car.prototype, Driveable);
     *
     * @param {object} target object
     * @param {object*} list of objects which properties will be mixed into target object
     */
    mixin: function(target) {
      _.extend.apply(null, arguments);

      return target;
    }

  };

  return exports;
});

/**
 * A module that provides an extendable mixin
 * 
 * @module ginseng/mixins/extendable
 *
 * @requires ginseng/helpers/inheritance
 */
define('ginseng/mixins/extendable',[
  '../helpers/inheritance'
], function(
  InheritanceHelpers
) {
  

  var exports = {

    /**
     * Create a new object ("child class") which inherits from this ("parent class").
     * Note: The new object will be extendable again
     *
     * @param {object} [protoProps] object with prototype properties (= instance properties)
     * @param {object} [staticProps] object with static properties (= class properties)
     *
     * @returns {object} new child object
     */
    extend: function(protoProps, staticProps) {
      var Child = InheritanceHelpers.inherit(this, protoProps, staticProps);

      return Child;
    }
  
  };

  return exports;
});

/**
 * A module that provides a mixable mixin
 * @module ginseng/mixins/mixable
 *
 * @requires ginseng/helpers/inheritance
 */
define('ginseng/mixins/mixable',[
  '../helpers/inheritance'
], function(
  InheritanceHelpers
) {
  

  var exports = {

    /**
     * Mixes given objects into call context
     *
     * @param {object*} objects to mix into this
     * @returns {object} mixed object
     */
    mixin: function() {
      // convert args to array and prepend this as first argument
      var args = Array.prototype.slice.call(arguments);
      args = [ this ].concat(args);

      // mixin objects and return this
      return InheritanceHelpers.mixin.apply(null, args);
    }
  
  };

  return exports;

});

/**
 * A module that provides an abstract base for modular components.
 *
 * @module ginseng/modular_base
 * 
 * @requires underscore
 * @requires backbone
 * @requires ginseng/mixins/extendable
 * @requires ginseng/mixins/mixable
 */
define('ginseng/modular_base',[
  'underscore',
  'backbone',
  './mixins/extendable',
  './mixins/mixable'
], function(
  _, Backbone,
  Extendable, Mixable
) {
  

  /**
   * Creates an abstract base for modular components.
   * @constructor
   *
   * @param {object} [options] - object hash with modular base options
   */
  var exports = function(options) {
    var load, unload, finalize;

    // default arguments
    if(!options) options = {};
    
    // initialize instance variables
    this.options = options;
    this.modules = [];
    // the loaded flag indicates whether the module us currently loaded or not 
    // default: false = not loaded
    this.loaded = false;
    // the module is considered to be cold when it hasn't been loaded yet
    // default: true = cold
    this.cold = true;

    if(this.router && this.routes) {
      createRoutes.call(this);
    }

    // define/overwrite #load and ensure that prototype function #_load
    // is called after child function #load when child implements it
    load = this.load;
    this.load = function() {      
      var args;

      if(_.isFunction(load)) {
        // convert arguments object to array
        args = Array.prototype.slice.call(arguments);
        load.apply(this, args);
      }

      exports.prototype._load.call(this);
    };

    // define/overwrite #unload and ensure that prototype function #_unload
    // is called before child function #unload when child implements it
    unload = this.unload;
    this.unload = function() {
      var args;

      exports.prototype._unload.call(this);

      if(_.isFunction(unload)) {
        // convert arguments object to array
        args = Array.prototype.slice.call(arguments);
        unload.apply(this, args);
      }
    };

    // define/overwrite #finalize and ensure that prototype function #_finalize
    // is called before child function #finalize when child implements it
    finalize = this.finalize;
    this.finalize = function() {
      exports.prototype._finalize.call(this);
      if(_.isFunction(finalize))
        finalize.call(this);
    };
    
    this.initialize.call(this, options);
  };

  _.extend(exports.prototype, Mixable, Backbone.Events, {

    // dummy function which should be overwritten by concrete class
    initialize: function() {},

    _load: function() {
      if(this.cold) {
        if(this.router) {
          // bind all routes to it's callbacks and create
          // callbacks to autoload routable modules.
          // this only has to be done once, when the module
          // is cold (hasn't been loaded before)
          bindRoutes.call(this);
        }  
        // set the cold flag to false as soon as the
        // module has been loaded once
        this.cold = false;
      }

      // autoload modules
      _.each(_.filter(this.modules, function(module) {  return module.autoload === true; }), function(module) {
        module.instance.load();
      });

      // start router
      if(this.router) {
        this.router.start();
      }

      this.loaded = true;
    },

    _unload: function() {
      _.each(this.modules, function(module) {
        if(module.instance.loaded)
          module.instance.unload();
      });

      if(this.router) {
        this.router.stop();
      }

      this.loaded = false;
    },

    _finalize: function() {
      _.each(this.modules, function(module) {
        // if module is loaded -> unload it first
        if(module.instance.loaded)
          module.instance.unload();

        module.instance.finalize();
      });
    },

    /**
     * Dummy function which will be overwritten by core/module
     *
     * @instance
     */
    moduleFactory: function() { return null; },

    /**
     * Adds a new module instance from the given module constructor
     * with the given options to the instance. If the autoload parameter
     * is true the module gets automatically loaded. When the paramter
     * is set to false, it must be loaded manually. If autoload is a
     * String, it is expected to be a name of an existing route from #router.
     * Then, the module will automatically be loaded when #router triggers
     * matching route events.
     *
     * @instance
     *
     * @param {function} moduleCtor - module constructor
     * @param {object} moduleOptions - object hash with module options
     * @param {boolean/string} [autoload=true] - true, false or route name
     *
     */
    addModule: function(moduleCtor, moduleOptions, autoload) {
      // default arguments
      if(_.isUndefined(moduleOptions)) {
        moduleOptions = {};
      }
      if(_.isUndefined(autoload)) {
        autoload = true;
      }

      // argument validation
      if(!_.isFunction(moduleCtor)) {
        throw new Error('moduleCtor argument must be a constructor');
      } 
      if(!_.isObject(moduleOptions)) {
        throw new Error('moduleOptions argument must be a options object');
      }
      // TODO: add path validation with regexp
      if(!_.isBoolean(autoload) && !_.isString(autoload)) {
        throw new Error('autoload argument must be a boolean or string');
      }
      if(_.isString(autoload) && !this.router) {
        throw new Error(this.toString() + ' is not routable and therefore cannot manage routable module at url fragment "' + autoload + '"');
      }

      if(_.isString(autoload)) {
        // autoload is routeName
        var routeName = autoload;
        
        // raise error when router doesn't define the route
        if(!this.router.hasRoute(routeName)) {
          throw new Error('Route with name ' + autoload + ' is not defined');
        }

        var baseRoute = this.router.getRoute(routeName),
            baseRouteName = routeName;

        if(this.router.baseRoute && this.router.baseRouteName) {
          baseRoute = this.router.baseRoute + '/' + baseRoute;
          baseRouteName = this.router.baseRouteName + '_' + baseRouteName; 
        }

        moduleOptions.baseRoute = baseRoute;
        moduleOptions.baseRouteName = baseRouteName;

      } else if( moduleOptions.baseRoute || moduleOptions.baseRouteName ) {
        // if autoload is not route but moduleOptions has baseRoute and/or baseRouteName
        // => delete properties
        delete moduleOptions.baseRoute;
        delete moduleOptions.baseRouteName;
      }

      var instance = this.moduleFactory(moduleCtor, moduleOptions);

      var module = {
        ctor: moduleCtor,
        instance: instance,
        autoload: autoload
      };

      this.modules.push(module); 

      // if the added module is routable all relative routes defined
      // by the module must also be created for this module (parent)
      // because the created module will be started automatically by this
      // module (parent) when the current url fragment matches a route defined
      // by the created module.
      if(isRoutableModule(module)) {
        createModuleRoutes.call(this, module);
      }

      return instance;
    },


    /**
     * Load the given module instance
     * @instance
     *
     * @param {ginseng/module} moduleInstance - module instance to load
     * @param [arguments] - additional arguments will be passed to moduleInstance#load
     */
    loadModule: function(moduleInstance) {
      var args;

      if(moduleInstance.loaded) return;
      
      if(moduleInstance.isRoutable()) {
        // unload routable modules
        _.chain(this.modules)
          .filter(function(module) { return isRoutableModule(module); })
          .each(function(module) {
            if(module.instance.loaded) {
              module.instance.unload();
            }
          });
      }

      // load module instance with additional arguments if given
      args = Array.prototype.slice.apply(arguments, [1]);
      moduleInstance.load.apply(moduleInstance, args); 
    },

    /**
     * Returns an array containing the routes managed by the
     * module. If the module is not routable it returns an
     * empty array.
     *
     * @instance
     *
     * @returns {array} routes array
     */
    getRoutes: function() {
      if(!this.router) return [];
      return _.clone(this.router.routes);
    },

    /**
     * Returns true when module has routes and false otherwise
     * @instance
     *
     * @returns {boolean} true when module has routes, false otherwise
     */
    hasRoutes: function() {
      return ! _.isEmpty(this.getRoutes());
    }

  });

  _.extend(exports, Mixable, Extendable);



  // ######################
  // ## Helper functions ##
  // ######################

  /**
   * This function determines whether a given module instance is
   * routable or not.
   *
   * @private
   *
   * @param {object} module - module representation: ctor, instance and autoload
   * @returns {boolean} true when module is routable, false otherwise
   */
  var isRoutableModule = function(module) {
    return _.isString(module.autoload);
  };


  /**
   * This function creates routes from the #routes object.
   *
   * @private
   */
  var createRoutes = function() {
    var routes = [];
    for (var route in this.routes) {
      routes.unshift([route, this.routes[route]]);
    }
    for (var i = 0, l = routes.length; i < l; i++) {
      this.router.route(routes[i][0], routes[i][1]);
    } 
  };


  /**
   * This function creates routes on the current module router
   * which are managed by the given child module in order to
   * handle autoloading.
   *
   * @private
   *
   * @param {object} module - module representation: ctor, instance and autoload
   */
  var createModuleRoutes = function(module) {
    var moduleRoutes = module.instance.getRoutes(),
        relativeBaseRoute, relativeBaseRouteName;

    // return if module doesn't have routes
    if(_.isEmpty(moduleRoutes)) return;

    relativeBaseRoute = this.router.getRoute(module.autoload);
    relativeBaseRouteName = module.autoload;
    
    _.each(moduleRoutes, function(route) {
      // return if route is relative root url
      // because then it's already managed by this module router
      // (it's the same route as the route assigned to module.autoload)
      if(route.route === '') return;

      var prefixedRoute, prefixedRouteName;

      prefixedRoute = relativeBaseRoute + '/' + route.route;
      prefixedRouteName = relativeBaseRouteName + '_' + route.name;

      // when route is already defined -> do not add it again
      // this happens when the router is core router
      // because all routes are already created via the core router 
      if(!this.router.hasRoute(prefixedRouteName)) {
        this.router.route(prefixedRoute, prefixedRouteName , false );
      }

    }, this);
  };


  /**
   * This function binds routes to matching callback functions and
   * creates callbacks for module autoloading based on the routing.
   *
   * @private
   */
  var bindRoutes = function() { 
    // each callback has signature: value, key  (not key, value)
    _.each(this.getRoutes(), function(route) {

      // check if route is assigned to a module
      var module = _.find(this.modules, function(module) {
        return module.autoload === route.name;
      });

      if(module) {
        // if the route is assigned to a module look for all routes
        // with route/ as prefix because then they have been defined
        // by the module and therefore have to be assigned to the module as well
        _.chain(this.getRoutes())
          .filter(function(_route) {
            return _route.route.match( new RegExp('^' + route.route + '\/'));
          })
          // (route doesnt match route/)
          // => add route to the set of routes
          .union([route])
          .each(function(_route) {

            // when function with route name is defined in module => call it
            // else: create callback function which autoloads the module
            if(_.isFunction(this[_route.name])) {
              this.router.on('route:' + _route.name, this[_route.name], this);
            } else {
              this.router.on('route:' + _route.name, function() {
                  this.loadModule(module.instance);
              }, this);
            }

          }, this);

      } else {
        if(this[route.name]) {
          this.router.on('route:' + route.name, this[route.name], this);
        }
      }

    }, this);
  };

  return exports;
});

/**
 * A module that provides a Router constructor.
 *
 * @module ginseng/router
 * @require backbone
 */
define('ginseng/router',[
  'backbone',
  'underscore'
], function(
  Backbone,
  _
) {
  

  /**
   * Creates a router with given options.
   * This constructor extends Backbone.Router.
   *
   * @constructor
   *
   * @param {object} [options] - options hash with router options
   */
  var exports = Backbone.Router.extend({

    constructor: function() {
      this.routes = []; 
    },

    route: function(route, routeName, create) {
      // default arguments
      create = ( create === undefined ) ? true : create;

      // argument validation
      if(this.hasRoute(routeName)) {
        throw new Error('route with name "' + routeName + '" is already defined');
      }
      
      this.routes.push({
        route: route,
        name: routeName
      });
  
      if(create) {
        Backbone.Router.prototype.route.call(this, route, routeName); 
      }

      return this;
    },
    
    hasRoute: function(routeName) {
      return _.any(this.routes, function(route) {
        return route.name === routeName;
      });
    },

    getRoute: function(routeName) {
      var route = _.find(this.routes, function(route) {
        return route.name === routeName;
      });

      return (route) ? route.route : route;
    },

    start: function() {
     if(!Backbone.history) return;
     
     Backbone.history.start({ pushState: true });
    },

    stop: function() {
      if(!Backbone.history) return;

      Backbone.history.stop();
    }
 
  });

  return exports;
});

/**
 * A module that provides a sandbox constructor
 *
 * @module ginseng/sandbox
 *
 * @requires underscore
 * @requires ginseng/mixins/mixable
 * @requires ginseng/mixins/extendable
 */
define('ginseng/sandbox',[
  'underscore',
  'ginseng/mixins/mixable',
  'ginseng/mixins/extendable'
], function(
  _,
  Mixable,
  Extendable
) {
  

  /**
   * Creates a sandbox instance
   *
   * @constructor
   *
   * @param {ginseng/core} core - core instance
   */
  var exports = function(core) {
    this.core = core; 
  };

  _.extend(exports.prototype, Mixable, {

    /**
     * Wrapper function for {@link module:ginseng/core#moduleFactory}.
     * This function is not intended to be used directly. It will be used
     * by {@link module:ginseng/module#moduleFactory} to allow modules to
     * create modules via the core.
     *
     * @instance
     *
     * @param {function} moduleCtor - module constructor
     * @param {object} moduleOptions - object hash with module options
     *
     * @returns {moduleCtor} an instance of moduleCtor
     */
    moduleFactory: function(moduleCtor, moduleOptions) {
      return this.core.moduleFactory(moduleCtor, moduleOptions);
    },

    /**
     * Getter function for the core router.
     * @instance
     *
     * @returns {ginseng/router} core router
     */
    getRouter: function() {
      return this.core.router;
    }

  });

  _.extend(exports, Extendable);

  return exports;
});

/**
 * A module that provides a core constructor
 *
 * @module ginseng/core
 * @extends module:ginseng/modular_base
 *
 * @requires underscore
 * @requires ginseng/modular_base
 * @requires ginseng/router
 * @requires ginseng/mixins/mixable
 */
define('ginseng/core',[
  'underscore',
  './modular_base',
  './router',
  './sandbox',
  './mixins/mixable'
], function(
  _,
  ModularBase,
  Router,
  Sandbox,
  Mixable
) {
  

  /**
   * Creates a core with the given options
   *
   * @constructor
   */
  var exports = ModularBase.extend({
  
    /**
     * Constructor function
     * @instance
     *
     * @param {object} [options] - object hash with core options
     */
    constructor: function(options) {
      // default arguments
      if(!options) options = {};

      // a core always has a router
      this.router = new Router();
      this.extensions = [];
      this.Sandbox = Sandbox.extend();

      // invoke ModularBase ctor with given options
      ModularBase.call(this, options);
    },

    /**
     * Adds a new module instance from the given module constructor
     * with the given options to the core. This function overwrites
     * {@link module:ginseng/modular_base#addModule}.
     * Before calling super, it checks whether or not the autoload
     * parameter is a string and starts with '/'. If it does, then
     * it registers a new route on #router from the given autoload
     * parameter and forwards to super with the name of the created route.
     *
     * The reason for this is to autoload modules based on a root url
     * without having to hard-code the url into the client-side routing.
     *
     * @instance
     *
     * @param {function} moduleCtor - module constructor
     * @param {object} - moduleOptions - object hash with module options
     * @param {boolean/string} [autoload=true] - true, false, route name
     *    or url starting with /
     *
     * @returns {moduleCtor} instance of the added module
     */
    addModule: function(moduleCtor, moduleOptions, autoload) {
      var route, routeName;

      // when autoload is root path (starts with /)
      if(_.isString(autoload) && autoload.indexOf('/') === 0) {
        // remove leading / because backbone routes start without /
        route = autoload.slice(1);
        // replace / in route with _ to obtain a valid route name
        routeName = route.replace(/\//g, '_');
        
        // create route
        this.router.route(route, routeName);

        // set autoload to routeName
        autoload = routeName;
      }

      return ModularBase.prototype.addModule.call(this, moduleCtor, moduleOptions, autoload);
    },


    /**
     * Returns a new module instance from the given module constructor
     * with a new #Sandbox instance and the given options. This function
     * will be used by @link{module:ginseng/modular_base#addModule}.
     *
     * @instance
     *
     * @params {function} moduleCtor - module constructor
     * @params {object} moduleOptions - object hash with module options
     *
     * @returns {moduleCtor} an instance of the given moduleCtor
     */
    moduleFactory: function(moduleCtor, moduleOptions) {
      var F = function() {},
          instance, module, args, sandbox;

      // create instance of the module without calling the constructor function
      F.prototype = moduleCtor.prototype;
      instance = new F();

      sandbox = this.sandboxFactory();

      // apply constructor function to the created instance
      // maybe the constructor returns interface with public functions
      // => the return value will be our module.
      module = moduleCtor.call(instance, sandbox, moduleOptions) || instance;

      return module;
    },


    /**
     * Returns a new sandbox instance.
     * @instance
     *  
     * @returns {ginseng/sandbox} a new sandbox instance
     */
    sandboxFactory: function() {
      return new this.Sandbox(this);
      //return new (Sandbox.extend(SandboxExtensions))(this);
    },

    /**
     * Adds given extension to the core
     *
     * @param {ginseng/extension} extensionCtor - extension constructor function
     */
    addExtension: function(extensionCtor) {
      var F = function() {},
          extension;

      // create instance of given extensionCtor via intermediate constructor
      F.prototype = extensionCtor.prototype;
      extension = new F();

      // invoke extensionCtor constructor function for the created instance
      // with core instance (this) as argument. When the ctor function
      // returns an interface, then this is our extension
      extension = extensionCtor.call(extension, this) || extension;

      // when extension has #Sandbox property we mixin the sandbox functions
      // into core's sandbox prototype
      if(extension.Sandbox) {
        this.Sandbox.prototype.mixin(extension.Sandbox);
      }

      this.extensions.push(extension);
    }

  });

  return exports;
});

/**
 * A module that provides a core extension constructor
 *
 * @module ginseng/extension
 *
 * @requires ginseng/mixins/extendable
 */
define('ginseng/extension',[
  'underscore',
  './mixins/extendable'  
], function(
  _,
  Extendable  
) {
  

  /**
   * Core extension constructor
   *
   * @constructor
   *
   * @param {ginseng/core} core - core to extend
   */
  var exports = function(core) { 
    this.core = core;
    this.initialize.call(this);
  };

  // make extension extendable
  exports.extend = Extendable.extend;

  _.extend(exports.prototype, {
  
    /**
     * Placeholder function which should be overwritten
     * by concrete extension.
     */
    initialize: function() {}

  });
  
  return exports; 
});

define('ginseng/module_router',[
  'underscore',
  'backbone'
], function(_, Backbone) {
  

  var ModuleRouter = function(options) {
    // default arguments
    if(!options) options = {};

    this._extractOptions(options);
   
    // create empty routes array
    this.routes = [];
  };

  _.extend(ModuleRouter.prototype, Backbone.Events, {

    _extractOptions: function(options) {
      // argument validation
      if(!options.router) {
        throw new Error('options argument must have router property'); 
      }
      if(!options.baseRoute) {
        throw new Error('options argument must have baseRoute property');
      }
      if(!options.baseRouteName) {
        throw new Error('options argument must have baseRouteName property');
      }

      this.router = options.router;
      this.baseRoute = options.baseRoute;
      this.baseRouteName = options.baseRouteName;
    },

    route: function(route, routeName, create) {
      // default arguments
      create = ( create === undefined ) ? true : create;

      this.routes.push({
        route: route,
        name: routeName
      });
      
      // when route is '' => we don't need to create it again
      // because it must have been created by parent module
      if(create && route) {
        route = this.baseRoute + '/' + route;
        routeName = this.baseRouteName + '_' + routeName;

        this.router.route(route, routeName);
      }

      return this;
    },

    hasRoute: function(routeName) {
      return _.any(this.routes, function(route) {
        return route.name === routeName;
      });
    },

    getRoute: function(routeName) {
      var route = _.find(this.routes, function(route) {
        return route.name === routeName;
      });

      return (route) ? route.route : route;
    },

    navigate: function(fragment, options) {
      if(fragment === '/' || fragment === '') {
        fragment = this.baseRoute;
      } else {
        fragment = this.baseRoute + '/' + fragment;
      }

      this.router.navigate(fragment, options);
    },

    start: function() {
      _.each(this.routes, function(route) {
        this.router.on('route:' + this.baseRouteName + '_' + route.name, function() {
          this.trigger('route:' + route.name);
        }, this);
      }, this);

      this._loadFragment(this._getCurrentUrlFragment());
    },

    stop: function() {
      // remove all callbacks from this router instance
      this.router.off(null, null, this);
    },

    /*
     * Returns the current absolute url fragment
     */
    _getCurrentUrlFragment: function() {
      return Backbone.history.fragment;
    },

    /*
     * Checks absolute url fragment and triggers route event
     * when match with relative routes has been found.
     */
    _loadFragment: function(fragment) {
      var matched = _.any(this.routes, function(route) {
        var fragmentRegExp = new RegExp(fragment + '$');
        // when route.route is empty => it's the root route
        var absoluteRoute = route.route ? this.baseRoute + '/' + route.route : this.baseRoute;
        if(fragmentRegExp.test( absoluteRoute )) {
          this.trigger('route:' + route.name);
          return true;
        }
      }, this);

      return matched;      
    }

  });

  return ModuleRouter;

});

/**
 * A module that provides a module constructor
 *
 * @module ginseng/module
 * @extends module:ginseng/modular_base
 *
 * @requires underscore
 * @requires backbone
 * @requires ginseng/modular_base
 * @requires ginseng/module_router
 */
define('ginseng/module',[
  'underscore',
  'backbone',
  './modular_base',
  './module_router'
], function(
  _, Backbone,
  ModularBase, ModuleRouter
) {
  

  /**
   * Creates a module with the given sandbox and options.
   *
   * @constructor
   */
  var exports = ModularBase.extend({
    
    /**
     * Constructor function
     *
     * @param {object} sandbox - sandbox which will be used by the module
     * @param {object} [options] - object hash with module options
     */
    constructor: function(sandbox, options) {
      // default arguments
      if(!options) options = {};
      
      // assign instance variables 
      this.sandbox = sandbox;
      extractOptions.call(this, options);
      
      // create router only if module is routable
      if(this.isRoutable()) {
        this.router = new ModuleRouter({
          router: this.sandbox.getRouter(),
          baseRoute: this.baseRoute,
          baseRouteName: this.baseRouteName
        });
      } else if (this.routes) {
        // throw error when routes object is defined
        // but the module is not routable
        throw new Error('This module is not allowed to have routes');
      }

      // invoke ModularBase ctor
      ModularBase.call(this, options);
    },
    

    /**
     * Returns a new module instance from the given module constructor
     * with the given options. It forwards the call to a moduleFactory
     * provided by the sandbox.
     *
     * @instance
     *
     * @param {function} moduleCtor - module constructor function
     * @param {object} [moduleOptions] - object hash with module options 
     *
     * @returns {moduleCtor} an instance of the given moduleCtor 
     */ 
    moduleFactory: function(moduleCtor, moduleOptions) {
      return this.sandbox.moduleFactory(moduleCtor, moduleOptions);
    },


    /**
     * Determines whether the module is routable or not.
     * A module is routable when it's parent created it with a baseRoute
     * and a baseRouteName.
     *
     * @instance
     *
     * @returns {boolean} true when the module is routable, false otherwise
     */
    isRoutable: function() {
      return _.has(this, 'baseRoute') && _.has(this, 'baseRouteName');
    }

  });

  // ######################
  // ## Helper functions ##
  // ######################

  /**
   * Checks if the given options object has predefined
   * options and assigns these options as instance variables.
   *
   * This is a helper function and must be called in the context
   * of a module: extractOptions.call(this, options).
   *
   * @param {object} options - object hash with module options
   */  
  var extractOptions = function(options) {
    var optionsToExtract = [ 'el', 'baseRoute', 'baseRouteName' ];
   
    for (var i = 0, l = optionsToExtract.length; i < l; i++) {
      var attr = optionsToExtract[i];
      if (options[attr]) {
        this[attr] = options[attr];
      }
    }
  };

  return exports;
});

/**
 * A module that provides a Model constructor.
 *
 * @module ginseng/model
 * @requires backbone
 */
define('ginseng/model',['backbone'], function(Backbone) {
  

  /**
   * Creates a model with given attributes and options.
   * This constructor extends Backbone.Model.
   *
   * @constructor
   *
   * @param {object} [attributes] - object hash with model attributes
   * @param {object} [options] - object hash with model options
   */
  var exports = Backbone.Model.extend();

  return exports;
});

/**
 * A module that provides a View constructor.
 *
 * @module ginseng/view
 * @requires backbone
 */
define('ginseng/view',['backbone'], function(Backbone) {
  
  
  /**
   * Creates a view with the given options.
   * This constructor extends Backbone.View.
   *
   * @constructor
   *
   * @param {object} [options] - object hash with view options
   */
  var exports = Backbone.View.extend();

  return exports;
});

/**
 * A module that provides a Collection constructor.
 *
 * @module ginseng/collection 
 * @requires backbone
 */
define('ginseng/collection',['backbone'], function(Backbone) {
  

  /**
   * Creates a collection with the given models and options.
   * This constructor extends Backbone.Collection.
   *
   * @constructor
   *
   * @param {array} [models] - initial array of models
   * @param {object} [options] - object hash with collection options
   */
  var exports = Backbone.Collection.extend();

  return exports;
});

/**
 * ginseng 0.1.3
 * (c) 2012, Julian Maicher (University of Paderborn)
 */
define('ginseng',[
  'underscore',
  'ginseng/core',
  'ginseng/extension',
  'ginseng/module',
  'ginseng/model',
  'ginseng/view',
  'ginseng/collection'
], function(
  Underscore,
  Core,
  Extension,
  Module,
  Model,
  View,
  Collection
) {

  var exports = {
    _: Underscore,
    Core: Core,
    Extension: Extension,
    Module: Module,
    Model: Model,
    View: View,
    Collection: Collection
  };

  return exports;

});
 var Ginseng = require('ginseng'); if(global.define) {   (function(define) {     define(function() { return Ginseng; });   }(global.define)); } else {   global['Ginseng'] = Ginseng; };}(this));