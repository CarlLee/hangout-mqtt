angular.module('starter.services', [])

.factory('mqttClient', function(){
  var client = mqtt.connect("ws://123.57.80.10:3000"); 
  return client;
})
.factory('storage', function(){
  var storage = {};
  return storage;
});
