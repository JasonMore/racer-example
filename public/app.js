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
    entriesLive.add({ text: $scope.newInput, done: false });
  }

  $scope.delete = function(entry){
    entriesLive.delete(entry);
  }
}