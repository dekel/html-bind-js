if (window && !window.htmlBindJs) {
  window.htmlBindJs = {
    attributePrefix: "dk",
    bindObjects: {},
  };
}

class HtmlBindJs {
  constructor({ key, data, parentElem, process } = {}) {
    // this.useStrongHash = false;
    this.hbBindObjects = window.htmlBindJs.bindObjects;
    this.attributePrefix = window.htmlBindJs.attributePrefix;
    this.attributes = {
      BIND_TEXT: this.attributePrefix + "-bind-text",
      BIND_VALUE: this.attributePrefix + "-bind-value",
      DATA_EACH: this.attributePrefix + "-data-each",
      IF: this.attributePrefix + "-if",
      DATA_AS: this.attributePrefix + "-data-as",
    };

    if (key) {
      this.register({ key, data, parentElem, process });
    }
  }

  /**
   * Register the key against the bind object
   * @param {*} param0
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

  unregister() {
    if (this.hbBindObjects[this.key]) {
      delete this.hbBindObjects[this.key];
    }
  }

  update({ key = this.key, parentElem = this.parentElem, data } = {}) {
    // key = key || this.key;

    this.updateBind({ key, parentElem, data });
    this.updateEach({ key, parentElem, data });
    this.updateIf({ key, parentElem, data });
  }

  updateBind({ key, parentElem = document, data }) {
    const elems = parentElem.querySelectorAll(
      `[${this.attributes.BIND_TEXT}],[${this.attributes.BIND_VALUE}]`
    );
    const elemsLength = elems.length;
    for (let i = 0; i < elemsLength; i++) {
      const elem = elems[i];
      this.updateBindElem({ key, parentElem: elem, data });
    }
    this.updateBindElem({ key, parentElem, data });
  }

  updateBindElem({ key, parentElem, data }) {
    let dataBind;
    if (!data) {
      data = this.hbBindObjects;
    }
    if (parentElem.getAttribute) {
      const bindAttribs = [];
      const textBindData = parentElem.getAttribute(this.attributes.BIND_TEXT);
      const valueBindData = parentElem.getAttribute(this.attributes.BIND_VALUE);

      textBindData &&
        bindAttribs.push({
          attr: this.attributes.BIND_TEXT,
          dataBind: textBindData,
          updateFn: this.updateTextElement,
        });
      valueBindData &&
        bindAttribs.push({
          attr: this.attributes.BIND_VALUE,
          dataBind: valueBindData,
          updateFn: this.updateValueElement,
        });

      // .forEach((item) => {
      for (
        let i = 0, bindAttribsLength = bindAttribs.length;
        i < bindAttribsLength;
        i++
      ) {
        const item = bindAttribs[i];
        const dataBindObjKey = item.dataBind.substr(0, key.length);
        if (dataBindObjKey !== key || !data[key]) {
          return;
        }

        let val = this.getValueFromObject(key, item.dataBind, data);
        item.updateFn.call(this, parentElem, val);
      }
    }
  }

  updateEach({ key, parentElem = document, data }) {
    const elems = parentElem.querySelectorAll(`[${this.attributes.DATA_EACH}]`),
      elemsLength = elems.length;

    // elems.forEach((elem) => {
    for (let i = 0; i < elemsLength; i++) {
      const elem = elems[i];
      let dataBind;
      if (data) {
        dataBind = data;
      } else {
        dataBind = elem.getAttribute(this.attributes.DATA_EACH);
        let dataBindObjKey = dataBind.substr(0, key.length);
        if (dataBindObjKey !== key || !this.hbBindObjects[key]) {
          return;
        }
      }

      const asAttrib = elem.getAttribute(this.attributes.DATA_AS);
      const arrayVal = this.getValueFromObject(key, dataBind);
      const parentElem = elem.parentNode;

      // Remove current children:
      // const childrenToRemove = elem.querySelectorAll(".__hb-repeat-class__");

      // this.removeChildren(parentElem);

      // Get inside the template:
      const elemContent = elem.content.firstElementChild;

      // Remove Temporarilly the Template Node:
      parentElem.removeChild(elem);

      const processId = Math.random() * 4;
      const arrayValLength = arrayVal.length;
      for (let j = 0; j < arrayValLength; j++) {
        this.updateForEachChild({
          arrayItemData: arrayVal[j],
          arrayItemIndex: j,
          elemContent,
          asAttrib,
          parentElem,
          processId: processId,
        });
        // console.log("FOR-" + j);
      }

      // console.log("FOR FINISHED");

      // remove elements that are not part of the process:
      this.removeChildren(parentElem, processId);

      parentElem.appendChild(elem);
    }
  }

  updateIf({ key, parentElem = document, data }) {
    const elems = parentElem.querySelectorAll(`[${this.attributes.IF}]`);
    const elemsLength = elems.length;
    for (let i = 0; i < elemsLength; i++) {
      const elem = elems[i];
      this.updateIfElem({ key, parentElem: elem, data });
    }
    this.updateIfElem({ key, parentElem, data });
  }

  updateIfElem({ key, parentElem, data }) {
    if (!data) {
      data = this.hbBindObjects;
    }
    if (parentElem.getAttribute) {
      const bindAttribs = [];
      const ifBindData = parentElem.getAttribute(this.attributes.IF);

      if (!ifBindData) return;

      const dataBindObjKey = ifBindData.substr(0, key.length);
      if (dataBindObjKey !== key || !data[key]) {
        return;
      }

      // const ifFnName = this.getValueFromObject(key, dataBindObjKey, data);
      const ifFnName = ifBindData.substr(key.length + 1);
      const ifFn = _.get(data[key], ifFnName);

      if (!ifFn) {
        return;
      }

      const ifFnResult = ifFn.call(data[key]);

      const parentParentElem = parentElem.parentElement;

      // Element Unique ID
      const elemUniqueId = `__${ifBindData}__`;

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
      val = _.get(data[key], dataBindPath);
    }
    return val;
  }

  updateTextElement(elem, val) {
    const valHash = this.getStringHash(val);
    if ((elem.hbHash && elem.hbHash !== valHash) || !elem.hbHash) {
      elem.innerText = val || "";
      elem.hbHash = valHash;
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
