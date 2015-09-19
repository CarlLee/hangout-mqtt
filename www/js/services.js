angular.module('starter.services', [])

.factory('mqttClient', function(){
  var client = mqtt.connect("ws://192.168.199.161:3000"); 
  return client;
})
.factory('storage', function(){
  var storage = {};
  return storage;
});
