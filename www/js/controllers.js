angular.module('starter.controllers', ['ionic'])

.controller('ChatsCtrl', function($scope, $ionicScrollDelegate, $ionicPopup, mqttClient, storage) {
  $scope.msgs = [];
  var idCnt = 1;
  mqttClient.subscribe("chat");
  mqttClient.on("message", function(topic, payload){
    console.log(topic + ": " + payload);
    $scope.$apply(function(){
      var msg = JSON.parse(payload);
      $scope.msgs.push(msg);
      storage[msg.id] = msg;
      $ionicScrollDelegate.$getByHandle('msg-list').scrollBottom(true);
    });
  });
  $scope.messageToSend = "";
  $scope.jfk = false;
  $scope.sendMessage = function(){
    var msg = $scope.jfk ? {
      face: 'http://www.theyeshivaworld.com/wp-content/uploads/2013/11/JFK.jpg',
      name: 'JFK'
    } : {
      face: 'http://file.gucn.com/file/CurioPicfile/Gucn_23438_200812210285297CheckCurioPic2.jpg',
      name: '毛主席'
    };
    msg['id'] = idCnt++;
    msg['msg'] = $scope.messageToSend;
    mqttClient.publish("chat", JSON.stringify(msg));
    $scope.messageToSend = "";
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, storage) {
  $scope.msg = storage[$stateParams.chatId];
});
