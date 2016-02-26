angular.module('hikexpert.home', [])
.controller('HomePageController', function($scope, $rootScope, Home){
 
  $scope.userInfo = {}; 
  $scope.loading = true;
  $scope.getting_markers = false;
  $scope.markers = [];
  $scope.hikerStatus = 'City-Dweller';

  $scope.maxFilter = function(current, max){
    if(current > max){
      return max;
    }
    return current;
  };
  var updateStatus = function(){
    var hikes = $scope.userInfo.haveDone.length;
    if(hikes >= 100){
      $scope.hikerStatus = 'Explorer'
    } else if(hikes >= 25){
      $scope.hikerStatus = 'Hiker';
    } else if(hikes >= 5){
      $scope.hikerStatus = 'Wanderer';
    }
  }
  var fillBar = function(targetBar, hikeTarget, totalHikes){
    var barLength = (totalHikes / hikeTarget * 100).toString() + '%';
    if(totalHikes < hikeTarget){
      $(targetBar).css('width', barLength);
    } else{
      $(targetBar).css('width', '100%');
    }
    updateStatus();
  }

  ///// Get user's name and trails upon load
  $scope.getUser = function(){
    Home.getUser()
    .then (function (data) {
      $scope.userInfo.username = data.username;
      $scope.userInfo.haveDone = data.haveDone;
      $scope.userInfo.wantToDo = data.wantToDo;
      

      //set progress bar lengths
      var hikes = $scope.userInfo.haveDone.length;
      var barLength = (hikes / 5 * 100).toString() + '%';
      fillBar('#hikeFive', 5, hikes);
      fillBar('#hikeTwentyFive', 25, hikes);
      fillBar('#hikeHundred', 100, hikes);
    })
    .catch(function (err) {
      console.log('error in getUser', err);
    });
  };
  $scope.getUser();
  ///////
  $scope.trailPost = Home.trailPost;

  $scope.moveTrail = function (trailName, url) {
    Home.trailPost(trailName, url)
    .then(function (response) {
      if(response) {
        $scope.getUser();
      }
    });
  };

  // Icons for map //
  var myIcon = L.icon({
    iconUrl : 'http://stuff.samat.org/Test-Cases/Leaflet/881-Marker-Subclassing/marker-icon-red.png'
  });
  var mapMarker = L.AwesomeMarkers.icon({
    icon: 'map-marker',
    iconColor: 'red' //#F0F0C9
  });
  var asterisk = L.AwesomeMarkers.icon({
    icon: 'asterisk',
    iconColor: 'green'
  });
  var wantTrailIcon = L.AwesomeMarkers.icon({
    icon: 'tree-conifer',
    iconColor: '#C6C013'
  });
  var haveTrailIcon = L.AwesomeMarkers.icon({
    icon: 'tree-conifer',
    iconColor: '#008148'
  });
  

  ////////////////////////


  $scope.getCoords = function(userInfo){
    $scope.getting_markers = true;  
    $scope.markers.forEach(function (marker) {
      $scope.map.removeLayer(marker);
    });
    navigator.geolocation.getCurrentPosition(function(position) {
        $scope.userInfo.lat = position.coords.latitude;
        $scope.userInfo.long = position.coords.longitude;
        console.log('userinfo before factory', userInfo);
        Home.getCoords(userInfo)
        .then(function(data){
          //$scope.coordinates =
          console.log('data in HomePageController', data);
          data.forEach(function(trail, i){
            marker = new L.marker(trail.coordinates, {title: trail.name})
            // This is part of an ugly jQuery hack. Hidden spans contain the name of the trail, so we can get at that later. Undoubtedly, there is a better way to do this.
              .bindPopup('<b>'+trail.name+'</b><br /><a class="have">I have hiked this<span class="hidden">'+trail.name+'</span></a><br /><a class="want-to">I want to hike this<span class="hidden">'+trail.name+'</span></a>').addTo($scope.map);
            // store markers in an array on the $scope.
            $scope.markers.push(marker);
          });
        $scope.getting_markers = false;  
        });
      });
  };

  ///// Get user's location, render a leaflet map showing that location when they land on this page
  navigator.geolocation.getCurrentPosition(function(position) {
    console.log(position.coords.latitude, position.coords.longitude);
    var lat = position.coords.latitude;
    var long = position.coords.longitude;

    // Couldn't get the ng-if to work on spiffygif...
    $scope.loading = false;   
    // So use apply...makes it work!
    $scope.$apply();
    
    // Initialize the leaflet map:
    var map = L.map('map').setView([lat, long], 9);
    // Set it on the angular scope:
    $scope.map = map;
    // Add a tile layer to our map (from mapbox):
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZWR1bGlzOCIsImEiOiJjaWt1M2RzeW8wMDk4dnltM3h5ZXlwb24wIn0.DfujBg6HeQHg5ja-tZyYRw', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.satellite',
      accessToken: 'pk.eyJ1IjoiZWR1bGlzOCIsImEiOiJjaWt1M2RzeW8wMDk4dnltM3h5ZXlwb24wIn0.DfujBg6HeQHg5ja-tZyYRw'
    }).addTo(map);

      // Add a circle showing user's location to the map
    // var circle = L.circle([lat, long], 500, {
    //   color: 'red',
    //   fillColor: '#f03',
    //   fillOpacity: 1
    // }).addTo(map).bindPopup("Current Location").openPopup();

    L.marker([lat, long], {icon: mapMarker}).addTo(map).bindPopup("Here you are").openPopup();

  });

       // element.iconUrl = 'http://stuff.samat.org/Test-Cases/Leaflet/881-Marker-Subclassing/marker-icon-red.png';

  // Ugly jQuery hack to implement click listeners

  $('body').on('click', '.have', function(){
    console.log('name of trail', $(this).children().html());
    var trailName = $(this).children().html();

    // make this its own function
    $scope.changeColor(trailName, haveTrailIcon, 'did it');
    //////////// ^^^^^

    $scope.trailPost(trailName, '/hasDone');

    $scope.getUser();

  });

  $('body').on('click', '.want-to', function(){
    console.log('name of trail', $(this).children().html());
    var trailName = $(this).children().html();
    //console.log(trailName)
    $scope.changeColor(trailName, wantTrailIcon);
    $scope.trailPost(trailName, '/wantToDo');
    $scope.getUser();

  });
  ///// Helpers ////
  $scope.changeColor = function (trailName, icon, intent) {
      $scope.markers.forEach(function(element, i, arr){
        console.log(element.options.title);
        console.log(trailName);
      if(element.options.title === trailName){
        var latlng = element._latlng;
        $scope.map.removeLayer(element);
        
        element = L.marker([latlng.lat, latlng.lng], {icon: icon}, {trailName: trailName}).addTo($scope.map);
        if(intent === 'did it') {
          element.bindPopup('<b>'+trailName+'</b><br /><a class="want-to">I want to hike this again<span class="hidden">'+trailName+'</span></a>').openPopup();
        } else {
          element.bindPopup('<b>'+trailName+'</b><br /><a class="have">I have hiked this<span class="hidden">'+trailName+'</span></a><br /><a class="want-to">I want to hike this<span class="hidden">'+trailName+'</span></a>');
          //arr[i].bindPopup("You rocked this") 
          //arr[i].openPopup();
        }
      }
    });

  };


});





