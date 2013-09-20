var racerModule = angular.module('racer.js', []);

racerModule.service('liveResourceProvider', function ($q, $http, $timeout, $rootScope) {
  var self = this;
  var racer = require('racer');
//  var noop = function racerNotYetReady() {
//    console.error('racer not ready');
//  };

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

//  this._path = '';
//  this.scoped;

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

    var setImmediate = window && window.setImmediate ? window.setImmediate : function (fn) {
      setTimeout(fn, 0);
    };

    var paths = {};

    window.debugPaths = paths;

    var oldGet = model.get;
    model.get = function (path) {
      if (!paths[path]) {
        paths[path] = oldGet.call(model, path);

        model.on('all', path ? path + '**' : '**', function (segments, type, newVal, oldVal, passed) {

          // skip local updated calls, for now...
          if(!passed.$remote) return;

          console.log('recloning data', arguments);

          // clone data since angular would set $ properties in the racer object otherwise
          var newData = angular.extend(oldGet.call(model, path), undefined);
          paths[path] = angular.extend(newData, paths[path]);
          setImmediate($rootScope.$apply.bind($rootScope));
        });
      }

      return paths[path];
    };


    window.debugModel = model;

    // currently singleton, refactor to factory
    var returnService = function liveResource(path) {


      var self = this;

      this.path = path;
      this._model = model;
      this.scoped;

      var liveData = {};

      // racer functions
      this.add = function (value) {
        value = angular.copy(value);
        return model.add(self.path, value);
      };

      this.query = function (queryParams) {
        return model.query(self.path, queryParams);
      };

      this.subscribe = function (query) {

        model.subscribe(query, function () {
          self.scoped = query.ref('_page._' + self.path);

          if (!$rootScope._page) {
            $rootScope._page = {};
          }

          $rootScope._page[self.path] = liveData;

          $rootScope.$watch('_page.' + self.path, function (newEntries, oldEntries) {
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
                    model.set(self.path + '.' + newEntries[entry].id + '.' + prop, newEntry[prop]);
                  }
                }
              }
            }
          }, true);

          angular.extend(liveData, model.get(self.path));
          $rootScope.$digest();
        });

        return liveData;
      };

      // external model updates
      model.on('insert', '_page._' + self.path + '**', function () {
        angular.extend(liveData, model.get(self.path));
        $rootScope.$digest();
      });

      model.on('change', '_page._' + self.path + '**', function () {

//        console.log("model.on('change', '_page._' + self.path + '**', function () {");

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