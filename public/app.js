angular.module('MyApp', ['racer.js']).
  config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider.
      when('/', {
        templateUrl: 'partials/todo.htm',
        controller: TodoCtrl,
        resolve: {
          racerModel: function (liveResource) {
            return liveResource.initializing;
          }
        }
      })
      .otherwise({ redirectTo: '/' });
  }]);


function TodoCtrl($scope, liveResource) {

  window.debugScope = $scope;

  var foo = liveResource.path('entries');
  var allTemplatesQuery = liveResource.query({});
  $scope.entries = liveResource.subscribe(allTemplatesQuery);

  $scope.add = function() {
    liveResource.add('entries', { text: $scope.newInput, done: false });
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
