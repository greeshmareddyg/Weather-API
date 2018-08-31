var database,resultSet;
if (!navigator.geolocation){
    var latitude  = '39.0046';
    var longitude = '-76.8755';
  }
  $(document).ready(function () {
	database = openDatabase("Greeshma", "1.0", "Cities", 2*1024*1024); // Open SQLite Database
	//removeSearchedCities();
	initializeDatabase();
	showSearchedCities();
  });
function success(position) {
	var latitude  = position.coords.latitude;
	var longitude = position.coords.longitude;
	$.getJSON('http://api.openweathermap.org/data/2.5/weather?lat='+latitude+'&lon='+longitude+'&appid=c0ba68698deba6a4fca54bf95553e28f',function(json){
		getWeather(json.name);
	});
}

  function error() {
    output.innerHTML = "Unable to retrieve your location";
  };
  navigator.geolocation.getCurrentPosition(success, error);

/*
	Establishing DB connnection for saving the city
*/
 function initializeDatabase(){
    try {
        if (!window.openDatabase){
            alert('Databases are not supported in this browser.');
        }else {
			createSearchedCities();
        }
    }catch (e) {
        if (e == 2) {
            console.log("Invalid database version.");
        } else {
            console.log("Unknown error " + e + ".");
        }
        return;
 
    }
 
}
function createSearchedCities(){
    database.transaction(function (tx) { tx.executeSql("CREATE TABLE IF NOT EXISTS searchedCities (cityName TEXT)", [], showSearchedCities, loadErrorLog); });
}
function addRecordToSearhedCities(city){
		createSearchedCities();
		getSearchedCities(city);
		setTimeout(function() {showSearchedCities();},2000);
}
function saveCityNameToDatabase(cityName){
	addRecordToSearhedCities(cityName);
}
function loadErrorLog(tx, error){
  console.log(error.message);
}
function successLogging(){
 console.log("Data Saved Successfully.....")
}
function showSearchedCities(){
    database.transaction(function (tx) {
        tx.executeSql("SELECT * FROM searchedCities", [], function (tx, result) {
            resultSet = result.rows;
			var allCities="";
			console.log("Records length"+resultSet.length)
            for (var i = 0, item = null; i < resultSet.length; i++) {
                item = resultSet.item(i);
				allCities+="<button class='btn btn-primary' onclick='search_by_city(&#34;"+item['cityName']+"&#34;)'>"+item['cityName']+"</button>&nbsp;"
            }
			$("#historyContent").html(allCities);
        });
 
    });
}
function getSearchedCities(cityName){
    database.transaction(function (tx) {
        tx.executeSql("SELECT * FROM searchedCities", [], function (tx, result) {
            resultSet = result.rows;
			if(resultSet.length==0){
				database.transaction(function (tx) { tx.executeSql("INSERT INTO searchedCities(cityName) VALUES (?)", [cityName], successLogging, loadErrorLog); });
			}else{
				var flag=true;
				for (var i = 0, item = null; i < resultSet.length; i++) {
					item = resultSet.item(i);
					if(item['cityName'].toUpperCase()==cityName.toUpperCase()){
						flag=false;break;
					}
				}
				if(flag){database.transaction(function (tx) { tx.executeSql("INSERT INTO searchedCities(cityName) VALUES (?)", [cityName], successLogging, loadErrorLog); })}
			}
			console.log("get Records length :: "+resultSet.length);
		});
    });
}
function removeSearchedCities(){
    database.transaction(function (tx) { tx.executeSql("DROP TABLE searchedCities", [], showSearchedCities, loadErrorLog); });
    initializeDatabase();
}
 
 
 
/*
	API calls to retrive the weather by city
*/
function getWeather(city) {
	if(city==""){
		alert("Please enter the city");return
	}
	
    var url = 'http://api.openweathermap.org/data/2.5/weather?q='+city+'&appid=c0ba68698deba6a4fca54bf95553e28f&units=imperial';
	saveCityNameToDatabase(city);
   $.getJSON(url,function(json){
  	$("#city,#todayDetCity,#dailyDetCity").text(json.name);
  	$('#todaytemp').html("<img src='http://openweathermap.org/img/w/"+json.weather[0].icon+".png'/>&nbsp;"+json.main.temp+' '+'&#8457;')
  	
   	$("#todayPressure").text(json.main.pressure+''+' hpa');
	$("#todayHumidity").text(json.main.humidity+''+' %');
	$("#todayMintemp").text(json.main.temp_min+' '+'F');
	$("#todayMaxtemp").text(json.main.temp_max+' '+'F');
  });
  loadHourly(city);
  loadDaily(city);
   
}


function loadHourly(city){
	var url = 'http://api.openweathermap.org/data/2.5/forecast?q='+city+'&appid=c0ba68698deba6a4fca54bf95553e28f&units=imperial&cnt=30&mode=json';
	var div="";
	    $.getJSON(url,function(json){
  		$.each(json.list, function( index, value ) {
  			div+="<div class='col-xs-2 text-center'>"+value.dt_txt+"<br/><img src='http://openweathermap.org/img/w/"+value.weather[0].icon+".png'/>&nbsp;"+value.main.temp+"</div>";	
		});
		$("#hourlyWeather").html(div);
  });

}

function loadDaily(city){
	var url = 'http://api.openweathermap.org/data/2.5/forecast/daily?q='+city+'&appid=c0ba68698deba6a4fca54bf95553e28f&units=imperial&cnt=7&mode=json';
	var div="";
	var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var tr="<table class='table table-bordered'>";
	
	    $.getJSON(url,function(json){
	 	var div="",i=0;
  		$.each(json.list, function( index, value ) {
  		if(index%3==0){tr+='<tr>';}
  		var a=new Date(value.dt*1000);
  			tr+="<td>"+months[a.getMonth()]+" "+a.getDate()+"</td>";
  			tr+="<td><img src='http://openweathermap.org/img/w/"+value.weather[0].icon+".png'/>&nbsp;"+value.temp.day+"</td>";
  			if(index%3==2){tr+='</tr>';}	
		});
		tr+='</table>';
		$("#dailyWeather").html(tr);
  });

}

//