angular.module('starter.services', ['uuid'])

.factory('mqttClient', function(){
  var client = mqtt.connect("wss://hangout-carllee.c9.io"); 
  return client;
})
.factory('storage', function(){
  var storage = {};
  return storage;
})
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
});
