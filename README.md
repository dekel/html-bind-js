# html-bind-js

A small JavaScript module that allows binding an object to the html.
The idea if this library is to leave a very small footprint on you code. This way if you decide to use a different method in the future you will be able to do so without changing too much code.
This library also allows the usage of other bind library at the same time with less chances of collisions.

See my blog post to get a better idea: https://daniel-dekel-webdev.blogspot.com/2020/04/from-framework-to-native.html

## Examples

This project is still in early stages but you can test some of the functionality using the following examples:

Your HTML:

```html
<h1 dk-bind-text="my-object:title"></h1>
```

Your JavaScript:

```js
// Import the lib:
import HtmlBindJs from "./html-bind.js";

// Define your Data Structure
const myData = {
  title: "My Title",
};

// Bind the HTML to the Data
let HtmlBindJsInst = new HtmlBindJs({
  key: "my-object",
  data: myData,
  process: true,
});
```

When the Data gets updated:

```js
HtmlBindJsInst.update();
```

## More Options

### Directives:

_dk-bind-text_ - Bind Text:

```html
<h1 dk-bind-text="my-object:title"></h1>
```

_dk-bind-value_ - Bind to Input Value:

```html
<input type="text" dk-bind-value="my-object:title" />
```

_dk-data-each_ - Bind to An Array:

The repeated HTML code has to be defined in a _template_ element.

```html
<ul>
  <template dk-data-each="my-object:items" dk-data-as="item">
    <li dk-bind-text="item.name">default data</li>
  </template>
</ul>
```

_dk-if_ - Bind to a function
The _function_ returns boolean - True will display the HTML element.
The _function_ has to be in the scope of the data object.

The conditional HTML code has to be defined in a _template_ element.

```html
<template dk-if="my-object:isDisplayTitle">
  Shows only if the title is:
  <span dk-bind-text="my-object:title">default data</span>
</template>
```

```js
myData.isDisplayTitle = function () {
  return this.title === "My Title Updated";
};
```
