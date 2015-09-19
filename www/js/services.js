angular.module('starter.services', [])

.factory('mqttClient', function(){
  var client = mqtt.connect("wss://hangout-carllee.c9.io"); 
  return client;
})
.factory('storage', function(){
  var storage = {};
  return storage;
});
