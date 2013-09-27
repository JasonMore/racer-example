var liveResourceModule = angular.module('liveResource', []);

module.exports = liveResourceModule;

liveResourceModule.service('liveResourceProvider', function ($q, $http, $timeout, $rootScope) {
  var liveScope = $rootScope.$new();

  var racer = require('racer');

  // init
  var initDefer = $q.defer();
  this.createLiveResource = initDefer.promise;

  $http.get('/racerInit').success(function (data) {
    racer.init(data);
  });

  racer.ready(function (racerModel) {

    window.debugRacerModel = racerModel;

    // currently singleton, refactor to factory
    var returnService = function liveResource(path) {
      this._racerModel = racerModel;
      var liveData = {};

      // racer functions
      this.add = function (newModel) {
        newModel = angular.copy(newModel);
        return racerModel.add(path, newModel);
      };

      this.at = function () {
        return racerModel.at(path);
      };

      this.query = function (queryParams) {
        return racerModel.query(path, queryParams);
      };

      this.delete = function (model) {
        if (_.contains(path, model.id)) {
          return racerModel.del(path);
        }

        return racerModel.del(path + "." + model.id);
      };

      this.subscribe = function (queryOrScope) {
        if (!queryOrScope) {
          queryOrScope = racerModel.at(path);
        }

        racerModel.subscribe(queryOrScope, function () {

          // not sure why I have to do this
          if (queryOrScope.constructor.name === 'Query') {
            queryOrScope.ref('_page._' + path);
          }

          liveScope[path] = liveData;

          $timeout(function () {
            angular.extend(liveData, racerModel.get(path));
          });
        });

        return liveData;
      };

      // when local modifications are made, update the server model
      liveScope.$watch(function () {
        return liveScope[path];
      }, function (newModels, oldModels) {
        if (!oldModels || _.isEmpty(oldModels) || newModels === oldModels) {
          return;
        }

        // remove $$ from objects
        newModels = angular.copy(newModels);
        oldModels = angular.copy(oldModels);

        // are we actually at a model?
        if (newModels.id) {
          updateModel(newModels, oldModels);
          return;
        }

        for (var modelKey in newModels) {
          if (modelKey === "undefined") {
            continue;
          }

          updateModel(newModels[modelKey], oldModels[modelKey]);
        }
      }, true);

      function updateModel(newModel, oldModel) {
        var newModelJson = JSON.stringify(newModel);
        var oldModelJson = JSON.stringify(oldModel);

        if (!oldModelJson || (newModelJson === oldModelJson)) {
          return;
        }

        for (var propertyKey in newModel) {
          if (oldModel[propertyKey] === newModel[propertyKey]) {
            continue;
          }

          var setPath = path;

          if (!_.contains(path, newModel.id)) {
            setPath += '.' + newModel.id;
          }

          setPath += '.' + propertyKey;

          racerModel.set(setPath, newModel[propertyKey]);
        }
      }

      // when server modificaitons are made, update the local model
      racerModel.on('all', path + '**', function () {

        // this $timeout is needed to avoid $$hashkey being added
        // to the op insert payload when new items are being created.
        $timeout(function () {
          var newServerModel = racerModel.get(path);

          // if a collection, remove deleted data
          if (!newServerModel || !newServerModel.id) {
            var keysRemoved = _.difference(_.keys(liveData), _.keys(newServerModel));

            _.each(keysRemoved, function (key) {
              delete liveData[key];
            });
          }

          angular.extend(liveData, newServerModel);
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
