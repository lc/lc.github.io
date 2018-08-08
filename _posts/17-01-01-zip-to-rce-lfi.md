---
layout: post
title: "Leveraging LFI to RCE using zip://"
author: Corben Leo
---
So you've found a page that's vulnerable to Local File Inclusion:
<br><br>
![LFI-1](/images/lfi/lfi-1.png "LFI-1")
<br>
 You do some testing to leverage this vulnerability to RCE, but nothing's working
Null bytes don't work, `/proc/self/environ` doesn't work, and wrappers that lead to RCE
such as `data://` or `php://input` do not work either. Don't give up yet, there may be another way!
<br><br>
Let's start off by trying to read the source code of this page! Let's see if `php://filter` works:
`http://127.0.0.1/vuln.php?page=php://filter/convert.base64-encode/resource=vuln`
<br><br>
![LFI-2](/images/lfi/lfi-2.png "LFI-2")
<br><br>
Voila! It works. Once base64 decoded the code is: <br><br>
![LFI-3](/images/lfi/lfi-3.png "LFI-3")
<br><br>
Now you can see how the page is being requested. It's using include to request the page & appending the .php
(ignore the commented line below it, I was was merely playing with RFI).
<br><br>
So now we know we can read files on the site. Use this to try to find the full path of the site, since you can use it. Now say this site has a function where you can upload a profile picture or upload a picture to a gallery. Awesome, then you're in luck!
<br><br>
Write some php code (Ex: `<?php phpinfo(); ?>` and **compress it** to a zip file.
Rename the zip file to *avatar.jpg* (change the extension to an image file) and upload it.  
<br><br>
My picture is uploaded to http://127.0.0.1/avatars/myavi.jpg
Now here's the trick using the **zip://** wrapper!
<br><br>
`zip:///path/to/filename#dir/file` (URL Encode the # to %23) when exploiting.
<br><br>
### Example:
With full path: <br><br>
`http://127.0.0.1/vuln.php?page=zip:///Library/WebServer/Documents/avatars/myavi.jpg%23shell`
<br><br>
Without full path: <br><br>
`http://127.0.0.1/vuln.php?page=zip://avatars/myavi.jpg%23shell`
<br><br>
I did not have to add the .php to the end because the script will automatically appends it!
Now, we have successfully leveraged this LFI to an RCE using the **zip://** wrapper!
<br><br>
![LFI-4](/images/lfi/lfi-4.png "LFI-4")
<br><br>
Thanks for reading,<br><br>
**Corben Leo**
- <a class="link" href="https://twitter.com/hacker_"  target="_blank" rel="noopener noreferrer">https://twitter.com/hacker_</a>
- <a class="link" href="https://hackerone.com/cdl" target="_blank" rel="noopener noreferrer">https://hackerone.com/cdl</a>
- <a class="link" href="https://bugcrowd.com/c" target="_blank" rel="noopener noreferrer">https://bugcrowd.com/c</a>
- <a class="link" href="https://github.com/C0RB3N"  target="_blank" rel="noopener noreferrer">https://github.com/C0RB3N</a>

