angular.module('starter.services', ['uuid'])
.directive('customOnChange', function() {
  return {
    restrict: 'A',
    scope: {
      'onChange' : '=customOnChange'
    },
    link: function (scope, element, attrs) {
      $(element).change(scope.onChange);
    }
  };
})

.factory('mqttClient', function(){
  var client = mqtt.connect("wss://hangout-carllee.c9.io"); 
  return client;
})
.factory('storage', function(){
  var storage = {};
  return storage;
})
.constant('API_END_POINT', "https://hangout-carllee.c9.io")
.factory('restService', function(API_END_POINT, $http){
  var service = {};
  service.nearPlaces = function(params, callback){
    $http({
      method: 'POST',
      url: API_END_POINT + "/places/near",
      data: $.param(params),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    })
    .then(callback, callback);
  }
  return service;
});
