# html-bind-js

A small JavaScript module that allows binding an object to the html.
The idea if this library is to leave a very small footprint on you code. This way if you decide to use a different method in the future you will be able to do so without changing too much code.
This library also allows the usage of other bind library at the same time with less chances of collisions.

See my blog post to get a better idea: https://daniel-dekel-webdev.blogspot.com/2020/04/from-framework-to-native.html

## Examples

This project is still in early stages but you can test some of the functionality using the following examples:

Your HTML:

```html
<h1 dk-bind="text:my-object>title"></h1>
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

### DOM Methods:

In the DOM, there is one attribute that references the binding method - _dk-bind_.

The value in that attribute starts with the method separated with a colon symbol (:).

Multiple DOM methods can de attached to the same DOM element in the same attribute, you just need to separate these by a semicolon.

`<ELEMENT dk-bind="function1:value; function2:value">`

It is common that some of the functions will accept the key representing the object to bind to. After that key comes the path to the property you want to bind to. That can be written as `KEY>THE_PATH` (see the first text function example)

#### text - Injects a text to the current element

```html
<h1 dk-bind="text:my-object>title"></h1>
```

#### value - Updates the value of the current element

```html
<input type="text" dk-bind="value:my-object>title" />
```

#### each - Bind to An Array:

The repeated HTML code has to be defined in a _template_ element.

The item being iterated is named as part of the `in` statement in the each method: `item in items`.

```html
<ul>
  <template dk-bind="each:my-object>item in items">
    <li dk-bind="text:item.name">default data</li>
  </template>
</ul>
```

#### if - Bind to a function

The _function_ returns boolean - True will display the HTML element.
The _function_ has to be in the scope of the data object.

The conditional HTML code has to be defined in a _template_ element.

```html
<template dk-bind="if:my-object>isDisplayTitle">
  Shows only if the title is:
  <span dk-bind="text:my-object>title">default data</span>
</template>
```

```js
myData.isDisplayTitle = function () {
  return this.title === "My Title Updated";
};
```

## Style Options
If you include the _html-bind.css_ file you can have the following effects:

### Loading content element indicator

When configuring the instance of _HtmlBindJs_ add the property _useLoadingStyle:true_
```js
let HtmlBindJsInst = new HtmlBindJs({
  key: "my-object",
  data: myData,
  process: true,
  useLoadingStyle: true
});
```
and in the HTML element add the class _dk-no-data-loaded_ 

```html
<span dk-bind="text:my-object>title" class="dk-no-data-loaded">default data</span>
```

That class will be removed once the data is loaded.
The style can be changed by overwriting the following selector: ``` [dk-bind].dk-no-data-loaded:before```

