var racerModule = angular.module('racer.js', []);

racerModule.service('liveResource', function ($q, $http, $timeout, $rootScope) {
  var self = this;
  var racer = require('racer');
  var noop = function racerNotYetReady() {
    console.error('racer not ready');
  };

  // init
  var initDefer = $q.defer();
  this.initializing = initDefer.promise;

  $http.get('/model').success(function (data) {
    racer.init(data);
  });

  function bind(fn, newThis){
    return function() { return fn.apply(newThis, arguments)};
  }

  this._path = '';
  this.scoped;

  racer.ready(function (model) {
    self._model = model;
//    self.query = bind(model.query, model);
//    self.push = bind(model.push, model);
    self.add = bind(model.add, model);

    var returnValue = [];

    self.query = function(queryParams) {
      return model.query(self._path, queryParams);
    }

    self.subscribe = function extendSubscribe(query) {

      model.subscribe(query, function () {
        self.scoped = query.ref('_page.foo');

        angular.extend(returnValue, self.scoped.get());
        $rootScope.$digest();
      });

      return returnValue;
    }

    model.on('insert', self._path + '**', function(a,b,c,d){
      angular.extend(returnValue, self.scoped.get());
      $rootScope.$digest();
    });

    $timeout(function() {
      initDefer.resolve(model);
    });
  });

  self.path = function(path){
    self._path = path;
  }
  // properties
  this._racer = racer;
  this.query = noop;
  this.subscribe = noop;

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