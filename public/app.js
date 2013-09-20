angular.module('MyApp', ['racer.js']).
  config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider.
      when('/', {
        templateUrl: 'partials/todo.htm',
        controller: TodoCtrl,
        resolve: {
          liveResource: function (liveResourceProvider) {
            return liveResourceProvider.createLiveResource;
          }
        }
      })
      .otherwise({ redirectTo: '/' });
  }]);


function TodoCtrl($scope, liveResource, liveResourceProvider) {

  window.debugScope = $scope;

  var entriesLive = liveResource('entries');
  var allTemplatesQuery = entriesLive.query({});
  $scope.entries = entriesLive.subscribe(allTemplatesQuery);

  $scope.add = function() {
//    entriesLive.add({ text: $scope.newInput, done: false });
    liveResourceProvider.add('entries', { text: $scope.newInput, done: false });
  }
}


//function TodoCtrl($scope, model) {
//	$scope.entries = model.get('entries');
//
//	$scope.add = function () {
//		model.add('entries', { text: $scope.newInput, done: false });
//	};
//
//	$scope.save = function (entry) {
//		model.set('entries.' + entry.id + '.done', entry.done);
//		return false;
//	};
//}`
//
//TodoCtrl.resolve = {
//	model: function (racer) {
//		return racer;
//	}
//};
//
//TodoCtrl.resolve.model.$inject = ['racer'];
//
//TodoCtrl.$inject = ['$scope', 'model'];
