//initialize permission
window.fbAsyncInit = function() {
  FB.init({
    appId      : '868306453330373',
    cookie     : true,
    xfbml      : true,
    version    : 'v2.11'
  });
  FB.AppEvents.logPageView();   
//checking status  + call function     
  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });  
};
//Install Facebook SDK    
(function(d, s, id){
   let js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "https://connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));

    /* Start here  */     

let homeLocation = {};
let dataLocation = [];
let markers = [];
let map;

function statusChangeCallback(response){
  if(response.status =='connected'){
    console.log("log in and authenticated");
    renderLoginStatusElement(true);
    getFacebookAPI();
  } else {
    console.log('Not authenticated');
    renderLoginStatusElement(false);
  }
}
        
function checkLoginState() {
  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });
}

function getFacebookAPI(){
  FB.api('/me?fields=id,name,location{location},posts{place,story,message,permalink_url,picture,created_time}', function(response) {
    if(response && !response.error) {
      userProfile(response); // print user profile
      checkingUserPosts(response.posts); // print user Posts
    }
  });
}

function userProfile(user){
  homeLocation.lat = parseFloat(user.location.location.latitude);
  homeLocation.lng = parseFloat(user.location.location.longitude);
  console.log("Name: "+ user.name);
  console.log(`Live: ${user.location.location.city}, ${user.location.location.state} ${user.location.location.country} `);
}

function modifyDate(date) {
  const newDate = new Date(date); 
  return newDate.toDateString();
}

function userPosts(posts){
  console.log(posts);
  for(let i in posts.data){
    if(posts.data[i].place){
      if(!posts.data[i].place.location ){
        console.log('this post doesnt has location');
      } else{
          console.log("Found a post which has location");
          const date = modifyDate(posts.data[i].created_time);    
          const obj =  returnInfo(posts.data[i].permalink_url,posts.data[i].picture,posts.data[i].place.location,posts.data[i].story,posts.data[i].message,date); 
          dataLocation.push(obj);
      }
    }  
  }
  console.log('This is the end of userPosts Function <END>');
  checkingNextData(posts);
}

function checkingUserPosts(posts){
  console.log(posts);
  if( posts === undefined){
    $('.loader').hide();
    $('.heading').text('No Data or Your data is private');
    $('.heading').show();
  } else{
    $('.container').append(`<div class="loader"><h2>Loading</h2></div>`);
    userPosts(posts);
  }  
}

function returnInfo(link,imageLink,location,story,message,date){
  const objLocation = {lat:location.latitude, lng: location.longitude};
  const obj = {
    link: link,
    imageLink: imageLink,
    content: `${story}
      ${message}`,
    date: date,
    location: objLocation
  };
  return obj;  
}

function checkingNextData(post){
  if (post.paging === undefined) {
    console.log(`Jquery all of your posts.`);
    $('.loader').hide();
    loadGoogleAPI();
  } else {
    getNextData(post.paging.next, userPosts);
  }
}

function getNextData(linkNextPage, callback){
  $.getJSON(linkNextPage, callback);
}

function renderLoginStatusElement(isLoggedIn){
  if (isLoggedIn) {
    $('.sample-image').hide();
    $('#fb-button').hide();
    $('#logout-btn').show();
    $('.heading').hide();
  } else {
    $('.sample-image').show();
    $('#fb-button').show();
    $('#logout-btn').hide();
    $('.heading').show();
    $('.loader').remove();
    $("#map").remove();
  }
}

function logout(){
  FB.logout(function(response){
    renderLoginStatusElement(false);
    console.log('User Logout');
  });
}

function loadGoogleAPI(){
  $('#floating-panel').append(`<button id="drop" onclick="drop()">Drop Markers</button>`);
  let script = document.createElement('script');
  script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCR5JAmnDP8mdb2_usxcY3h-9FG9RBZfGQ";
  document.body.appendChild(script);
  script = document.createElement('script');
  script.src = "https://jawj.github.io/OverlappingMarkerSpiderfier/bin/oms.min.js?spiderfier";
  document.body.appendChild(script);
}

function initMap(){
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 1,
    center: homeLocation
  });
}

function drop() {
  clearMarkers();
  $('.container').append(`<div id="map"></div>`);
  initMap();
  for (let i = 0; i < dataLocation.length; i++) {
    addContentToMarker(dataLocation[i]);
  }
  window.mapData = markers;
  var iw = new google.maps.InfoWindow();
  var oms = new OverlappingMarkerSpiderfier(map, {
    markersWontMove: true,
    markersWontHide: true,
    basicFormatEvents: true
  });
  
  for (var i = 0, len = window.mapData.length; i < len; i ++) {(
    function() {  // make a closure over the marker and marker data
      var markerData = window.mapData[i];  // e.g. { lat: 50.123, lng: 0.123, text: 'XYZ' }
      var marker = new google.maps.Marker({ position: markerData });  // markerData works here as a LatLngLiteral
      google.maps.event.addListener(marker, 'spider_click', function(e) {  // 'spider_click', not plain 'click'
        iw.setContent(markerData.text);
        iw.open(map, marker);
      });
      oms.addMarker(marker);  // adds the marker to the spiderfier _and_ the map
  })();
  }
  window.map = map;  // for debugging/exploratory use in console
  window.oms = oms;  // ditto
  $('#drop').hide();
}

function addContentToMarker(post) {
  let contentString = `
    <div id='content'>
      <h1 id="firstHeading">${post.date}</h1>
      <div id="bodyContent">
        <p><img src="${post.imageLink}" alt="image of post in ${post.date}" align="middle" />&emsp;${post.content}</p>
        <p>Original Post Link: <a href=${post.link} target="_blank">Here</a></p>
      </div>
    </div>`;
  markers.push({
    lng: post.location.lng,
    lat:  post.location.lat,
    text: contentString
  });          
}

function clearMarkers() {
  markers = [];
}