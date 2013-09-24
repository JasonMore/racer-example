var app = angular.module('MyApp', ['racer.js']).
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

app.filter('objectOrderByFilter', function(orderByFilter){
  return function(value, predicate, reverse){
    if(_.isObject(value)){
      value = _.values(value);
    }

    return orderByFilter(value, predicate, reverse);
  };
})

function TodoCtrl($scope, liveResource) {

  window.debugScope = $scope;

  var entriesLive = liveResource('entries');
  var allTemplatesQuery = entriesLive.query({});
  $scope.entries = entriesLive.subscribe(allTemplatesQuery);

  $scope.add = function() {
    entriesLive.add({ text: $scope.newInput, done: false });
  };

  $scope.delete = function(entry){
    entriesLive.delete(entry);
  };
}