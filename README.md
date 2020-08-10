# Foxbat
Multi phase executable LiquidJS with integrated i18n

## Usage
```
Foxbat=require('foxbat')
foxbat=new Foxbat(locale)
foxbat.execute(file)
.then((output)=>

``````
## Examples
```
// just once per locale
{@translate "translate something" @}
{$ constant_variable_per_domain $}

// perform on every CGI call for this file
{! for product in collection.products !}
  {? product.title ?}
{! endfor !}

// standard {{ and {% syntax is reserved for use in the client

``````
## Features
Asynchronous non blocking runtime complation of two phases, once and every. LRU cache, no need to preload.

### How it works
An intermediary compile file is created at .{filename}.% if none is present or it is older than the source. It is then conditionally executed with a given locale and output to .foxbat/{locale}/{filename} if that file is older or nonexistent. That is then compiled to .foxbat/{locale}/.{filename}.@, should it be missing or older, and then, finally and always, the .foxbat/{locale}/.{filename}.@ template is excuted and the output returned to the called (typically to be passed to res.send) 
