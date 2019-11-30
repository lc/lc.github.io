---
layout: pg
title: Projects
permalink: /projects/
---
### <a href="https://github.com/lc/jenkinz" target="_blank" rel="noopener noreferrer" class="proj">jenkinz</a>
`jenkinz` is a tool to retrieve every build for every job ever created and run on a given Jenkins instance. This allows an attacker to find secrets within logs. Example: <a target='_blank' rel='noopener noreferrer' class='link' href='https://www.corben.io/jenkins-to-full-pwnage/'>Exposed Jenkins to RCE on 8 Adobe Experience Managers</a>


### <a href="https://github.com/lc/secretz" target="_blank" rel="noopener noreferrer" class="proj">secretz</a>
`secretz` is a tool that minimizes the large attack surface of Travis CI. It automatically fetches repos, builds, and logs for any given organization. Built during and for <a target='_blank' rel='noopener noreferrer' class='link' href='https://edoverflow.com/2019/ci-knew-there-would-be-bugs-here/'>research</a> on TravisCI that I participated in.

***


### <a href="https://github.com/lc/brute53" target="_blank" rel="noopener noreferrer" class="proj">brute53</a>
brute53 is a tool to bruteforce nameservers when working with subdomain delegations to AWS. Based off Frans Rosén's <a target='_blank' rel='noopener noreferrer' class='link' href='https://youtu.be/FXCzdWm2qDg?t=1132'>talk</a> "DNS hijacking using cloud providers - no verification needed".

***

### <a href="https://github.com/lc/bugbountylink" target="_blank" rel="noopener noreferrer" class="proj">bugbounty.link</a>
<a target='_blank' rel='noopener noreferrer' class='link' href='http://bugbounty.link'>bugbountylink</a> is a URL Shortening service I created. It's useful for creating redirects on the fly when testing for Server-Side Request Forgery.


***

### <a href="https://github.com/lc/theftfuzzer" target="_blank" rel="noopener noreferrer" class="proj">TheftFuzzer</a>
TheftFuzzer is a tool that fuzzes Cross-Origin Resource Sharing implementations for common misconfigurations.


***

### <a href="https://github.com/lc/230-OOB" target="_blank" rel="noopener noreferrer" class="proj">230-OOB</a>
230-OOB is a python script that emulates an FTP server that assists you in achieving file read via Out-of-Band XXE.


***

### <a href="http://xxe.sh" _target="blank" rel="noopener noreferrer" class="proj">xxe.sh</a>
xxe.sh is a tool that generates an XXE payload and a DTD to achieve file read via XXE. It is meant to be used with 230-OOB
