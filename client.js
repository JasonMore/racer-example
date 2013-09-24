var racerModule = angular.module('racer.js', []);

racerModule.service('liveResourceProvider', function ($q, $http, $timeout, $rootScope) {
  var racer = require('racer');

  // init
  var initDefer = $q.defer();
  this.createLiveResource = initDefer.promise;

  $http.get('/model').success(function (data) {
    racer.init(data);
  });

  racer.ready(function (model) {

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
