angular.module('starter.controllers', ['ionic'])

.controller('ChatsCtrl', function($scope, $ionicScrollDelegate, $ionicNavBarDelegate, 
    $ionicLoading, $ionicPopover, rfc4122, mqttClient, storage) {
  function getName(names){
    if(names.zh != undefined && names.zh.length > 0){
      return names.zh[0];
    }else{
      return names.name;
    }
  }
  var defaultPoi = {
    "_id": "55fd6ef026adfe2d07fda69f",
    "names": {
      "name": "Wangjing",
      "zh": [
        "望京",
        "望京街道"
      ]
    },
    "loc": {
      "type": "Point",
      "coordinates": [
        116.47284,
        39.9933
      ]
    },
  };
  var defaultChannel = 'general';
  var poi = storage['selected_poi'] || defaultPoi;
  var placeId = poi._id;
  var placeTopic = "/places/" + placeId + "/";
  var topic = placeTopic + defaultChannel;
  $scope.title = getName(poi.names);
  $scope.msgs = [];
  $scope.images = {};
  $scope.channels = [
    {
      name: '#综合',
      channel: 'general'
    },{
      name: '#交易',
      channel: 'trade'
    },{
      name: '#交友',
      channel: 'social'
    },{
      name: '#问答',
      channel: 'qa'
    },{
      name: '#帮忙',
      channel: 'help'
    }
  ];
  mqttClient.subscribe(topic);
  mqttClient.on("message", function(topic, payload){
    console.log(topic + ": " + payload);
    var msg = JSON.parse(payload);
    var msgType = msg['type'];
    var imageId = msg['image_id'];
    // debugger;
    $scope.images[imageId] = "/img/placeholder.png";
    if(msgType == "image"){
      var image = msg['image'];
      $scope.$apply(function(){
        $scope.images[imageId] = image;
        $ionicScrollDelegate.$getByHandle('msg-list').scrollBottom(true);
      });
      return;
    }
    $scope.$apply(function(){
      $scope.msgs.push(msg);
      $ionicScrollDelegate.$getByHandle('msg-list').scrollBottom(true);
    });
  });
  $scope.messageToSend = "";
  $scope.sendMessage = function(){
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
    mqttClient.publish(topic, JSON.stringify(msg));
    $scope.messageToSend = "";
  };
  $scope.pickImage = function(){
    $('#imageFile').trigger('click');
    $ionicLoading.show();
  }
  $scope.sendImage = function(e){
    e.preventDefault();
    e.stopPropagation();
    $ionicLoading.hide();
    var input = $('#imageFile')[0];
    var file = input.files[0];
    var msg = {};
    var imageId = rfc4122.v4();
    msg['type'] = "image_header";
    msg['face'] = localStorage['face'];
    msg['nickname'] = localStorage['nickname'];
    msg['gender'] = localStorage['gender'];
    msg['user_id'] = localStorage['id'];
    // msg['image'] = e.target.result;
    msg['image_id'] = imageId;
    
    console.log("sending image_header..");
    mqttClient.publish(topic, JSON.stringify(msg));
    var reader = new FileReader();
    reader.onload = function(e){
      var msg = {};
      msg['image_id'] = imageId;
      msg['image'] = e.target.result;
      msg['type'] = 'image';
      console.log("sending image..");
      mqttClient.publish(topic, JSON.stringify(msg));
    }
    reader.readAsDataURL(file);
  }
  $ionicPopover.fromTemplateUrl("/templates/chat-popover.html", {
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });
  $scope.openPopover = function($event){
    $scope.popover.show($event);
  };
  $scope.closePopover = function(){
    $scope.popover.hide();
  };
  $scope.changeChannel = function(newChannel){
    $scope.msgs.splice(0, $scope.msgs.length);
    mqttClient.unsubscribe(topic);
    topic = placeTopic + newChannel;
    mqttClient.subscribe(topic);
  }
  $scope.changeChannelAndClose = function(newChannel){
    $scope.changeChannel(newChannel);
    $scope.closePopover();
  }
})

.controller('ChatDetailCtrl', function($scope, $stateParams, storage) {
  $scope.msg = storage[$stateParams.chatId];
})
.controller('MapCtrl', function($scope, $ionicLoading, $state, restService, storage) {
  var infowindows = [];
  function gotoChat(e){
    var poi = e.target.poi;
    console.log("gotoChat: ", poi);
    $state.go('chats');
    storage['selected_poi'] = poi;
  }
  function getName(names){
    if(names.zh != undefined && names.zh.length > 0){
      return names.zh[0];
    }else{
      return names.name;
    }
  }
  function makeMarker(poi){
    var latLng = poi.loc.coordinates;
    var name = getName(poi.names);
    var latLng = new google.maps.LatLng(latLng[1], latLng[0]);
    
    var contentDiv = document.createElement('div');
    contentDiv.poi = poi;
    contentDiv.innerHTML = name;
    $(contentDiv).click(gotoChat);
  
    var infowindow = new google.maps.InfoWindow({
      content: contentDiv
    });
    infowindows.push(infowindow);
  
    var marker = new google.maps.Marker({
      position: latLng,
      map: map,
      title: name
    });
  
    google.maps.event.addListener(marker, 'click', function(){
      infowindows.forEach(function(infoW){
        infoW.close();
      });
      infowindow.open(map,marker);
    });
  }
  restService.nearPlaces({
    lat: 39.994669099999996,
    lng: 116.4747621
  }, function(res){
    console.log(res);
    var pois = res.data;
    if(pois != undefined){
      pois.forEach(makeMarker);
    }
  });

  var latLng = new google.maps.LatLng(39.994669099999996, 116.4747621);
  var mapOptions = {
    center: latLng,
    zoom: 14,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("map"),
    mapOptions);
  $scope.map = map;
  //}
//    google.maps.event.addDomListener(window, 'load', initialize);
  
  $scope.centerOnMe = function() {
    if(!$scope.map) {
      return;
    }

    $ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });

    navigator.geolocation.getCurrentPosition(function(pos) {
      $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
    //  debugger;
      $ionicLoading.hide();
    }, function(error) {
      alert('Unable to get location: ' + error.message);
    });
  };
  
})

.controller('LgCtrl', function($scope, $state) {
    $scope.signIn = function(user) {
    console.log('Sign-In', user);
    localStorage['face']='/img/avatars_0'+Math.floor(9*Math.random()+1)+'.png';
    localStorage['nickname']=user.username;
    $state.go('map');
  };
  
});
