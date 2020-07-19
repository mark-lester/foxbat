# Foxbat
Multi phase executable Handlebars with integrated i18n

## Usage
```
Foxbat=require('foxbat')
foxbat=new Foxbat({
  handbars:handlebars,
  once_file_limit:100,
  every_file_limit:500,
  })
foxbat.execute(file)
.then((output)=>

``````
## Examples
```
{% do something once %}
{@ do something every time the page is served @}
{{ preserve this markup for use in the client }}

``````
## Features
Asynchronous non blocking runtime complation of two phases, once and every. LRU cache, no need to preload.

### How it works
An interediatry compile file is created at .{filename}.% if none is present or it is older than the source. It is then conditionally executed with a given locale and output to .foxbat/{locale}/{filename} if that file is older or nonexistent. That is then compiled to .foxbat/{locale}/.{filename}.@, should it be missing or older, and then, finally and always, the .foxbat/{locale}/.{filename}.@ template is excuted and the output returned to the called (typically to be passed to res.send) 
