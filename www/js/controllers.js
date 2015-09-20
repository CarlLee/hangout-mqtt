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
  var defaultChannel = {
    name: '#综合',
    channel: 'general'
  }
  var poi = storage['selected_poi'] || defaultPoi;
  var placeId = poi._id;
  var placeTopic = "/places/" + placeId + "/";
  var placeName = getName(poi.names);
  var topic = placeTopic + defaultChannel.channel;
  $scope.title = placeName + defaultChannel.name;
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
  }
  $scope.sendImage = function(e){
    e.preventDefault();
    e.stopPropagation();
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
    $ionicLoading.show();
    var reader = new FileReader();
    reader.onload = function(e){
      var msg = {};
      $ionicLoading.hide();
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
    $scope.title = placeName + newChannel.name;
    mqttClient.unsubscribe(topic);
    topic = placeTopic + newChannel.channel;
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
  function gotoChat(poi){
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
  function convertToGeoJSON(poi){
    var name = getName(poi.names);
    return {
      type: "Feature",
      geometry: poi.loc,
      properties: {
        title: name,
        description: "点击进入" + name + "区域聊天室",
        "marker-color": "#3bb2d0",
        "marker-symbol": "city",
        "marker-size": "medium"
      }
    }
  }
  
  L.mapbox.accessToken = 'pk.eyJ1IjoibGpiaGEwMDciLCJhIjoiOG12c29RQSJ9.mH0nivAshxtDQo74VsX0_Q';
  var map = L.mapbox.map('map', 'mapbox.streets')
      .setView([39.994669099999996, 116.4747621], 14);
  // var layer = L.mapbox.featureLayer().addTo(map);
  
  restService.nearPlaces({
    lat: 39.994669099999996,
    lng: 116.4747621
  }, function(res){
    var pois = res.data;
    if(pois != undefined){
      var geoJSON = []
      pois.forEach(function(poi){
        // var json = convertToGeoJSON(poi);
        // geoJSON.push(json);
        var coords = poi.loc.coordinates;
        var name = getName(poi.names);
        var node = document.createElement('div');
        node.innerHTML = "<h2>" + name + "</h2><p>点击进入" + name + "区域聊天室</p>";
        $(node).click(function(e){
          e.preventDefault();
          e.stopPropagation();
          gotoChat(poi);
        });
        var marker = L.marker([coords[1], coords[0]], {
          icon: L.mapbox.marker.icon({
            'marker-color': '#9c89cc',
            'marker-symbol': 'city'
          })
        })
        .bindPopup(node)
        .addTo(map);
      });
      // layer.setGeoJSON(geoJSON);
    }
  });
  $scope.centerOnMe = function() {
    if(!map) {
      return;
    }

    $ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });

    navigator.geolocation.getCurrentPosition(function(pos) {
      map.panTo([pos.coords.latitude, pos.coords.longitude]);
      // $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
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
