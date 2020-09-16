/**
 * Add static namespace to store the unique keys and some global properties
 */
if (window && !window.htmlBindJs) {
  window.htmlBindJs = {
    attributePrefix: "dk",
    bindObjects: {},
  };
}

/**
 * The main class
 */
class HtmlBindJs {
  constructor({ key, data, parentElem, process, useLoadingStyle } = {}) {
    // this.useStrongHash = false;
    this.hbBindObjects = window.htmlBindJs.bindObjects;
    this.attributePrefix = window.htmlBindJs.attributePrefix;
    this.attribBindsSeparator = ";";
    this.attribBindDirectiveSeparator = ":";
    this.attribBindDirectiveKeySeparator = ">";
    this.useLoadingStyle = useLoadingStyle;
    this.attributes = {
      BIND: this.attributePrefix + "-bind",
      BIND_TEXT: "text",
      BIND_VALUE: "value",
      DATA_EACH: "each",
      DATA_AS: "each-as",
      IF: "if",
    };
    this.noDataLoadedClassName = "dk-no-data-loaded"

    this.directives = {
      text: { fn: this.updateText },
      value: { fn: this.updateValue },
      each: { fn: this.updateEach },
      // "each-as": { fn: this.updateEach},
      if: { fn: this.updateIf },
    };

    if (key) {
      this.register({ key, data, parentElem, process });
    }
  }

  /**
   * Register the key against the bind object
   * @param {object} config - key, data, parentElem
   */
  register({ key, data, parentElem, process }) {
    if (this.hbBindObjects[key]) {
      throw `The key [${key}] is already registered`;
    }

    this.hbBindObjects[key] = data;
    this.key = key;
    this.parentElem = parentElem || document;

    if (process) {
      this.update({ parentElem });
    }
  }

  /**
   * Unregister a key
   */
  unregister() {
    if (this.hbBindObjects[this.key]) {
      delete this.hbBindObjects[this.key];
    }
  }

  /**
   * Declare there has been an update in the object
   * This method re-renders the HTML
   * @param {object} config
   */
  update({ key = this.key, parentElem = this.parentElem, data } = {}) {
    const bindElements = parentElem.querySelectorAll(
      `[${this.attributes.BIND}]`
    ),
      bindElementsLength = bindElements.length;

    // Each Element:
    for (let elemIndex = 0; elemIndex < bindElementsLength; elemIndex++) {
      const elem = bindElements[elemIndex];
      this.updateElement({ key, elem, data });
    }

    this.updateElement({ key, elem: parentElem, data });
  }

  updateElement({ key, elem, data }) {
    const attrib = elem.getAttribute && elem.getAttribute(this.attributes.BIND);
    if (!attrib) return;

    const binds = attrib.split(this.attribBindsSeparator);

    // Each Bind:
    const bindsLength = binds.length;
    for (let bindIndex = 0; bindIndex < bindsLength; bindIndex++) {
      const bind = binds[bindIndex];
      if (!bind) continue;
      const bindItems = bind.split(this.attribBindDirectiveSeparator);
      const bindDirective = bindItems[0].trim();
      const bindDirectiveDetails = bindItems[1].trim();
      if (bindDirective && this.directives[bindDirective]) {
        this.directives[bindDirective].fn.call(this, {
          key: key,
          data: data,
          directive: bindDirective,
          details: bindDirectiveDetails,
          parentElem: elem,
          bindItems: bindItems,
        });
      }
    }
  }

  updateText({
    key,
    parentElem = document,
    data,
    directive,
    details,
    bindItems,
  }) {
    if (!data) {
      data = this.hbBindObjects;
    }

    const dataBindObjKey = details.substr(0, key.length);
    if (dataBindObjKey !== key || !data[key]) {
      return;
    }

    let val = this.getValueFromObject(key, details, data);
    this.updateTextElement.call(this, parentElem, val);
  }

  updateValue({
    key,
    parentElem = document,
    data,
    directive,
    details,
    bindItems,
  }) {
    if (!data) {
      data = this.hbBindObjects;
    }
    const dataBindObjKey = details.substr(0, key.length);
    if (dataBindObjKey !== key || !data[key]) {
      return;
    }

    let val = this.getValueFromObject(key, details, data);
    this.updateValueElement.call(this, parentElem, val);
  }

  updateEach({
    key,
    parentElem = document,
    data,
    directive,
    details,
    bindItems,
  }) {
    const elem = parentElem;
    let dataBind;
    if (data) {
      dataBind = data;
    } else {
      data = this.hbBindObjects;
      dataBind = details;
      let dataBindObjKey = dataBind.substr(0, key.length);
      if (dataBindObjKey !== key || !this.hbBindObjects[key]) {
        return;
      }
    }

    // Parse For..in :
    const detailsSplit = dataBind.substr(key.length + 1);
    const detailsSplitArr = detailsSplit.split("in");
    if (!detailsSplitArr.length || detailsSplitArr.length !== 2) return;

    const inAttrib = detailsSplitArr[0].trim();
    const arrayVal = this.getProp(data[key], detailsSplitArr[1].trim());

    const parentParentElem = elem.parentNode;

    // Get inside the template:
    const elemContent = elem.content.firstElementChild;

    // Remove Temporarilly the Template Node:
    parentParentElem.removeChild(elem);

    const processId = Math.random() * 4;
    const arrayValLength = arrayVal.length;
    for (let j = 0; j < arrayValLength; j++) {
      this.updateForEachChild({
        arrayItemData: arrayVal[j],
        arrayItemIndex: j,
        elemContent,
        asAttrib: inAttrib,
        parentElem: parentParentElem,
        processId: processId,
      });
      // console.log("FOR-" + j);
    }

    // console.log("FOR FINISHED");

    // remove elements that are not part of the process:
    this.removeChildren(parentParentElem, processId);

    parentParentElem.appendChild(elem);
  }

  updateIf({
    key,
    parentElem = document,
    data,
    directive,
    details,
    bindItems,
  }) {
    if (!data) {
      data = this.hbBindObjects;
    }
    if (parentElem.getAttribute) {
      const bindAttribs = [];
      // const details = parentElem.getAttribute(this.attributes.IF);

      if (!details) return;

      const dataBindObjKey = details.substr(0, key.length);
      if (dataBindObjKey !== key || !data[key]) {
        return;
      }

      // const ifFnName = this.getValueFromObject(key, dataBindObjKey, data);
      const ifFnName = details.substr(key.length + 1);
      const ifFn = this.getProp(data[key], ifFnName);
      // const ifFn = _.get(data[key], ifFnName);

      if (!ifFn) {
        return;
      }

      const ifFnResult = ifFn.call(data[key]);

      const parentParentElem = parentElem.parentElement;

      // Element Unique ID
      const elemUniqueId = `__${details}__`;

      // Find if element is already rendered:
      let renderedElem = parentParentElem.querySelector(
        `[hb-id='${elemUniqueId}']`
      );

      if (ifFnResult) {
        // If result is true and element is not rendered, add to DOM:
        if (!renderedElem) {
          // const clonedTemplate = parentElem.cloneNode(true);
          const clonedTemplate = document.importNode(parentElem.content, true);
          // const elemContent = clonedTemplate.content;
          const newElem = document.createElement("span");

          newElem.appendChild(clonedTemplate);
          // elemContent.childNodes.forEach((node) => {
          //   newElem.appendChild(node);
          // });
          this.update({
            key: key,
            parentElem: newElem,
            data: data,
          });
          newElem.setAttribute("hb-id", elemUniqueId);
          parentParentElem.appendChild(newElem);
        }
      } else {
        // If result is false and element is rendered remove from DOM:
        if (renderedElem) {
          parentParentElem.removeChild(renderedElem);
        }
      }

      // Else do nothing:
    }
  }

  updateForEachChild({
    arrayItemData,
    arrayItemIndex,
    elemContent,
    asAttrib,
    parentElem,
    processId,
  }) {
    const repeatedElem = elemContent.cloneNode(true);
    const dataObjWrapper = {};
    dataObjWrapper[asAttrib] = arrayItemData;

    const currentElem = parentElem.children[arrayItemIndex];

    const valHash = this.getObjectHash(dataObjWrapper);

    // console.log(
    //   `${arrayItemIndex}) ${arrayItemIndex} -> ${valHash} -> ${
    //     currentElem && currentElem.hbHash
    //   }`
    // );
    let isSameNode = true;
    if (
      !currentElem ||
      (currentElem.hbHash && currentElem.hbHash !== valHash) ||
      !currentElem.hbHash
    ) {
      isSameNode = false;
    }

    if (!isSameNode) {
      this.update({
        key: asAttrib,
        parentElem: repeatedElem,
        data: dataObjWrapper,
      });

      repeatedElem.hbHash = valHash;
      repeatedElem.hbProcessId = processId;
      if (currentElem) {
        if (currentElem.hbHash !== repeatedElem.hbHash) {
          parentElem.replaceChild(repeatedElem, currentElem);
        }
      } else {
        parentElem.appendChild(repeatedElem);
      }
    } else {
      currentElem.hbProcessId = processId;
    }

    // console.log("INNER FOR-" + arrayItemIndex);
  }

  removeChildren(parentElem, processId) {
    const children = parentElem.children,
      childrenLength = children.length,
      nodesToBeRemoved = [];
    for (let i = 0; i < childrenLength; i++) {
      let child = children[i];
      if (child.nodeName !== "TEMPLATE" && child.hbProcessId !== processId) {
        nodesToBeRemoved.push(child);
      }
    }
    nodesToBeRemoved.forEach((node) => {
      parentElem.removeChild(node);
    });
  }

  getValueFromObject(key, dataBind, data) {
    let val = "",
      bindObj;
    if (!data) {
      data = this.hbBindObjects;
    }
    if (key.length === dataBind.length) {
      val = JSON.stringify(data[key]);
    } else {
      const dataBindPath = dataBind.substr(key.length + 1);
      val = this.getProp(data[key], dataBindPath);
      // val = _.get(data[key], dataBindPath);
    }
    return val;
  }

  updateTextElement(elem, val) {
    const valHash = this.getStringHash(val);
    if ((elem.hbHash && elem.hbHash !== valHash) || !elem.hbHash) {
      elem.innerText = val || "";
      elem.hbHash = valHash;

      if (this.useLoadingStyle) {
        elem.classList.remove(this.noDataLoadedClassName);
      }
    }
  }

  updateValueElement(elem, val) {
    const valHash = this.getStringHash(val);
    if ((elem.hbHash && elem.hbHash !== valHash) || !elem.hbHash) {
      elem.value = val || "";
    }
    elem.hbHash = valHash;
  }

  /**
   * Hash generator
   * @param {String} str
   */
  getStringHash(str) {
    // if (this.useStrongHash) {
    //   // Strong hash:
    //   // Example taken from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
    //   const msgUint8 = new TextEncoder().encode(str);
    //   const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    //   const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    //   const hashHex = hashArray
    //     .map((b) => b.toString(16).padStart(2, "0"))
    //     .join("");
    //   return hashHex;
    // } else {
    // Simple Hash implementation:
    // Example taken from: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
    var h = 0,
      l = str.length,
      i = 0;
    if (l > 0) while (i < l) h = ((h << 5) - h + str.charCodeAt(i++)) | 0;

    return h;
    // }
  }

  /**
   * Gets the value at `path` of `object`.
   * Code taken from: https://gist.github.com/harish2704/d0ee530e6ee75bad6fd30c98e5ad9dab
   * @param {Object} object
   * @param {string|Array} path
   * @returns {*} value if exists else undefined
   */
  getProp(object, path, defaultVal) {
    const PATH = Array.isArray(path)
      ? path
      : path.split(".").filter((i) => i.length);
    if (!PATH.length) {
      return object === undefined ? defaultVal : object;
    }
    if (
      object === null ||
      object === undefined ||
      typeof object[PATH[0]] === "undefined"
    ) {
      return defaultVal;
    }
    return this.getProp(object[PATH.shift()], PATH, defaultVal);
  }

  getObjectHash(obj) {
    const objStr = JSON.stringify(obj);
    return this.getStringHash(objStr);
  }

  findSiblingOfType(elem, elemName) {
    elemName = elemName.toUpperCase();
    let node = elem;
    while (node) {
      if (
        node !== this &&
        node.nodeType === Node.ELEMENT_NODE &&
        node.nodeName === elemName
      ) {
        return elem;
      }
      node = node.nextElementSibling || node.nextSibling;
    }
  }
}

export default HtmlBindJs;
