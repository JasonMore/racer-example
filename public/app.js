var app = angular.module('MyApp', ['liveResource']);

app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

  $routeProvider.
    when('/', {
      templateUrl: '/partials/todoList.htm',
      controller: TodoListCtrl,
      resolve: {
        liveResource: function (liveResourceProvider) {
          return liveResourceProvider.createLiveResource;
        }
      }
    })
    .when('/todo/:id', {
      templateUrl: '/partials/todo.htm',
      controller: TodoCtrl,
      resolve: {
        liveResource: function (liveResourceProvider) {
          return liveResourceProvider.createLiveResource;
        }
      }
    })
    .otherwise({ redirectTo: '/' });
}]);

app.filter('objectOrderByFilter', function (orderByFilter) {
  return function (value, predicate, reverse) {
    if (_.isObject(value)) {
      value = _.values(value);
    }

    return orderByFilter(value, predicate, reverse);
  };
});

function TodoListCtrl($scope, liveResource) {

  window.debugScope = $scope;

  var todosLive = liveResource('todo');
  var allTodosQuery = todosLive.query({});
  $scope.todos = todosLive.subscribe(allTodosQuery);

  $scope.add = function () {
    todosLive.add({ text: $scope.newInput, done: false });
  };

  $scope.delete = function (todo) {
    todosLive.delete(todo);
  };
}

function TodoCtrl($scope, $routeParams, liveResource) {
  window.debugScope = $scope;
  var todoLive = liveResource('todo.' + $routeParams.id);
  $scope.todo = todoLive.subscribe();
}