angular.module('starter.controllers', ['ionic'])

.controller('ChatsCtrl', function($scope, $ionicScrollDelegate, $ionicPopup,
    rfc4122, mqttClient, storage) {
  var uuid = rfc4122.v4();
  console.log(uuid);
  $scope.msgs = [];
  mqttClient.subscribe("chat");
  mqttClient.on("message", function(topic, payload){
    var msg = JSON.parse(payload);
    var msgType = msg['type'];
    var imageId = msg['image_id'];
    if(msgtype == "image" && imageId != undefined){
      return;
    }
    console.log(topic + ": " + payload);
    $scope.$apply(function(){
      $scope.msgs.push(msg);
      $ionicScrollDelegate.$getByHandle('msg-list').scrollBottom(true);
    });
  });
  $scope.messageToSend = "";
  $scope.sendMessage = function(){
    // var msg = $scope.jfk ? {
    //   face: 'http://www.theyeshivaworld.com/wp-content/uploads/2013/11/JFK.jpg',
    //   name: 'JFK'
    // } : {
    //   face: 'http://file.gucn.com/file/CurioPicfile/Gucn_23438_200812210285297CheckCurioPic2.jpg',
    //   name: '毛主席'
    // };
    if($scope.messageToSend.length == 0){
      return;
    }
    var msg = {};
    msg['type'] = "text";
    msg['face'] = localStorage['face'];
    msg['nickname'] = localStorage['nickname'];
    msg['gender'] = localStorage['gender'];
    msg['user_id'] = localStorage['id'];
    msg['msg'] = $scope.messageToSend;
    mqttClient.publish("chat", JSON.stringify(msg));
    $scope.messageToSend = "";
  };
  $scope.pickImage = function(){
    $('#imageFile').trigger('click');
  }
  $scope.sendImage = function(e){
    e.preventDefault();
    e.stopPropagation();
    var input = $('#imageFile')[0];
    var file = input.files[0];
    var reader = new FileReader();
    var msg = {};
    var imageId = rfc4122.v4();
    msg['type'] = "image";
    msg['face'] = localStorage['face'];
    msg['nickname'] = localStorage['nickname'];
    msg['gender'] = localStorage['gender'];
    msg['user_id'] = localStorage['id'];
    // msg['image'] = e.target.result;
    msg['image_id'] = imageId;
    mqttClient.publish("chat", JSON.stringify(msg));
    reader.onload = function(e){
      var msg = {};
      msg['image_id'] = imageId;
      msg['image'] = e.target.result;
      mqttClient.publish("chat", JSON.stringify(msg));
    }
    reader.readAsDataURL(file);
  }
  
})

.controller('ChatDetailCtrl', function($scope, $stateParams, storage) {
  $scope.msg = storage[$stateParams.chatId];
})
.controller('MapCtrl', function($scope, $ionicLoading, $compile) {
      function initialize() {
        var myLatlng = new google.maps.LatLng(43,-89.381388);
        
        var mapOptions = {
          center: myLatlng,
          zoom: 16,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map"),
            mapOptions);
        
        var contentString = "<div><a ng-click='clickTest()'>Click me!</a></div>";
        var compiled = $compile(contentString)($scope);

        var infowindow = new google.maps.InfoWindow({
          content: compiled[0]
        });

        var marker = new google.maps.Marker({
          position: myLatlng,
          map: map,
          title: 'Uluru (Ayers Rock)'
        });

        google.maps.event.addListener(marker, 'click', function() {
          infowindow.open(map,marker);
        });

        $scope.map = map;
      }
      google.maps.event.addDomListener(window, 'load', initialize);
      
      $scope.centerOnMe = function() {
        if(!$scope.map) {
          return;
        }

        $scope.loading = $ionicLoading.show({
          content: 'Getting current location...',
          showBackdrop: false
        });

        navigator.geolocation.getCurrentPosition(function(pos) {
          $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
          $scope.loading.hide();
        }, function(error) {
          alert('Unable to get location: ' + error.message);
        });
      };
      
      $scope.clickTest = function() {
        alert('Example of infowindow with ng-click')
      };
      
    })

.controller('LgCtrl', function($scope, $state) {
  
  $scope.signIn = function(user) {
    console.log('Sign-In', user);
    localStorage['face']='/img/avatars_0'+Math.floor(9*Math.random()+1)+'.png';
    localStorage['nickname']=user.username;
    $state.go('chats');
  };
  
});
