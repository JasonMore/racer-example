var racerModule = angular.module('racer.js', []);

racerModule.service('liveResourceProvider', function ($q, $http, $timeout, $rootScope) {
  var racer = require('racer');

  // init
  var initDefer = $q.defer();
  this.createLiveResource = initDefer.promise;

  $http.get('/model').success(function (data) {
    racer.init(data);
  });

  function bind(fn, newThis) {
    return function () {
      return fn.apply(newThis, arguments)
    };
  }

  $rootScope.safeApply = function (fn) {
    var phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  racer.ready(function (model) {


    // override original get

//    var setImmediate = window && window.setImmediate ? window.setImmediate : function (fn) {
//      setTimeout(fn, 0);
//    };
//
//    var paths = {};
//
//    window.debugPaths = paths;
//
//    var oldGet = model.get;
//    model.get = function (path) {
//      if (!paths[path]) {
//        paths[path] = oldGet.call(model, path);
//
//        model.on('all', path ? path + '**' : '**', function (segments, type, newVal, oldVal, passed) {
//          console.log('recloning data', arguments);
//
//          // clone data since angular would set $ properties in the racer object otherwise
////          var newData = angular.extend(oldGet.call(model, path), undefined);
////          paths[path] = angular.extend(newData, paths[path]);
//
////          paths[path] = newData;
//
//
//          var newData = oldGet.call(model, path);
//
//
//          var keysRemoved = _.difference(_.keys(paths[path]), _.keys(newData));
//
//          _.each(keysRemoved, function(key){
//            delete paths[path][key];
//          });
//
//
//          paths[path] = angular.extend(newData, paths[path]);
//
//
//          setImmediate($rootScope.$apply.bind($rootScope));
//        });
//      }
//
//      return paths[path];
//    };


    window.debugModel = model;

    // currently singleton, refactor to factory
    var returnService = function liveResource(path) {
      this._model = model;
      var liveData = {};

      // racer functions
      this.add = function (value) {
        value = angular.copy(value);
        return model.add(path, value);
      };

      this.query = function (queryParams) {
        return model.query(path, queryParams);
      };

      this.delete = function(obj){
        return model.del(path + "." + obj.id);
      };

      this.subscribe = function (query) {

        model.subscribe(query, function () {
          // not sure why I have to do this
          query.ref('_page._' + path);

          if (!$rootScope._page) {
            $rootScope._page = {};
          }

          $rootScope._page[path] = liveData;

          $rootScope.$watch('_page.' + path, function (newEntries, oldEntries) {
            if (newEntries === oldEntries) return;

            // remove $$ from objects
            newEntries = angular.copy(newEntries);
            oldEntries = angular.copy(oldEntries);

            for (var entry in newEntries) {

              if (entry === "undefined") {
                break;
              }

              var newEntry = newEntries[entry];
              var oldEntry = oldEntries[entry];

              var newEntryJson = JSON.stringify(newEntry);
              var oldEntryJson = JSON.stringify(oldEntry);

              if(!oldEntryJson || newEntryJson === oldEntryJson) {

              }

              if (oldEntryJson && newEntryJson !== oldEntryJson) {
                for (var prop in newEntry) {
                  if (oldEntry[prop] !== newEntry[prop]) {
                    model.set(path + '.' + newEntries[entry].id + '.' + prop, newEntry[prop]);
                  }
                }
              }
            }
          }, true);

          $timeout(function() {
            angular.extend(liveData, model.get(path));
          });
        });

        return liveData;
      };

      // external model updates
      model.on('all', path + '**', function () {
        // this $timeout is needed to avoid $$hashkey being added
        // to the op insert payload when new items are being created.
        $timeout(function() {
          var newData = model.get(path);
          var keysRemoved = _.difference(_.keys(liveData), _.keys(newData));

          _.each(keysRemoved, function (key) {
            delete liveData[key];
          });

          angular.extend(liveData, newData);
        });
      });

    };

    $timeout(function () {
      initDefer.resolve(function (path) {
        return new returnService(path);
      });
    });
  });

});

//angular.module('racer.js', [], ['$provide', function ($provide) {
//	function extendObject(from, to) {
//		if (from === to) return to;
//
//		if (from.constructor === Array && to && to.constructor === Array) {
//			for (var i = 0; i < from.length; ++i) {
//				to[i] = extendObject(from[i], to[i]);
//			}
//			to.splice(from.length, to.length);
//
//			return to;
//		} else if (from.constructor === Object && to && to.constructor === Object) {
//			for (var key in to) {
//				if (typeof from[key] === 'undefined') {
//					delete to[key];
//				}
//			}
//
//			for (var key in from) {
//				to[key] = extendObject(from[key], to[key]);
//			}
//
//			return to;
//		} else if (to === undefined) {
//			return extendObject(from, new from.constructor());
//		} else {
//			return from;
//		}
//	}
//
//	var setImmediate = window && window.setImmediate ? window.setImmediate : function (fn) {
//		setTimeout(fn, 0);
//	};
//
//	var racer = require('racer');
//
//	$provide.factory('racer', ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
//		$http.get('/model').success(function (data) {
//			racer.init(data);
//		});
//
//		var def = $q.defer();
//		racer.ready(function (model) {
//			var paths = {};
//
//			var oldGet = model.get;
//			model.get = function (path) {
//				if (!paths[path]) {
//					paths[path] = oldGet.call(model, path);
//
//					model.on('all', path ? path + '**' : '**', function () {
//						// clone data since angular would set $ properties in the racer object otherwise
//						var newData = extendObject(oldGet.call(model, path), undefined);
//						paths[path] = extendObject(newData, paths[path]);
//						setImmediate($rootScope.$apply.bind($rootScope));
//					});
//				}
//
//				return paths[path];
//			};
//
//			def.resolve(model);
//			$rootScope.$apply();
//		});
//
//		return def.promise;
//	}]);
//}]);