let state = {
  time: new Date(),
  lots: null,
};

const vDom = {
  createElement(type, config, ...children) {
    const key = config ? config.key || null : null;
    const props = config || {};

    if (children.length === 1) {
      props.children = children[0];
    } else if (children.length > 1) {
      props.children = children;
    }

    return {
      type,
      key,
      props,
    };
  },
};

function Header() {
  return vDom.createElement("header", { className: "header" }, vDom.createElement(Logo));
}

function Logo() {
  return vDom.createElement("img", { className: "logo", src: "./logo.png" });
}

function Time({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return vDom.createElement(
    "div",
    { className: "time" },
    vDom.createElement("span", { className: "time__value" }, time.toLocaleTimeString()),
    vDom.createElement("span", { className: "time__icon" }, isDay ? "🌕" : "🌑")
  );
}

function Lots({ lots }) {
  if (lots === null) {
    return vDom.createElement("div", { className: "lots" }, "loading...");
  }

  const lotsList = lots.map((lot) => vDom.createElement(Lot, { ...lot }));
  return vDom.createElement("div", { className: "lots" }, lotsList);
}

function Lot({ id, title, description, price }) {
  return vDom.createElement(
    "article",
    { key: id, className: "lot__item" },
    vDom.createElement(
      "div",
      { className: "lot__content" },
      vDom.createElement("h2", { className: "lot__title" }, title),
      vDom.createElement("p", { className: "lot__desciption" }, description)
    ),
    vDom.createElement("div", { className: "lot__price" }, price)
  );
}

function App({ state }) {
  return vDom.createElement(
    "div",
    { className: "app" },
    vDom.createElement(Header),
    vDom.createElement(Time, { time: state.time }),
    vDom.createElement(Lots, { lots: state.lots })
  );
}

function evaluate(virtualNode) {
  if (typeof virtualNode !== "object") {
    return virtualNode;
  }

  if (typeof virtualNode.type === "function") {
    return evaluate(virtualNode.type(virtualNode.props));
  }

  const props = virtualNode.props || {};

  return {
    ...virtualNode,
    props: {
      ...props,
      children: Array.isArray(props.children) ? props.children.map(evaluate) : [evaluate(props.children)],
    },
  };
}

function renderView(state) {
  render(vDom.createElement(App, { state }), document.getElementById("root"));
}

renderView(state);

function render(virtualDom, realDomRoot) {
  const completedVirtualDom = evaluate(virtualDom);
  const virtualDomRoot = {
    type: realDomRoot.tagName.toLowerCase(),
    props: {
      id: realDomRoot.id,
      ...realDomRoot.attributes,
      children: [completedVirtualDom],
    },
  };
  sync(virtualDomRoot, realDomRoot);
}

function sync(virtualNode, realNode) {
  // sync elements
  if (virtualNode.props) {
    Object.entries(virtualNode.props).forEach(([key, value]) => {
      if (key === "children" || key === "key") {
        return;
      }

      if (realNode[key] !== value) {
        realNode[key] = value;
      }
    });
  }

  if (virtualNode.key) {
    realNode.dataset.key = virtualNode.key;
  }

  if (typeof virtualNode !== "object" && virtualNode !== realNode.nodeValue) {
    realNode.nodeValue = virtualNode;
  }

  // sync children nodes
  const virtualChildren = virtualNode.props ? virtualNode.props.children || [] : [];
  const realChildren = realNode.childNodes;

  for (let i = 0; i < virtualChildren.length || i < realChildren.length; i++) {
    const virtual = virtualChildren[i];
    const real = realChildren[i];

    // remove
    if (virtual === undefined && real !== undefined) {
      real.remove();
    }

    // update
    if (virtual !== undefined && real !== undefined && (virtual.type || "") === (real.tagName || "").toLowerCase()) {
      sync(virtual, real);
    }

    // replace
    if (virtual !== undefined && real !== undefined && (virtual.type || "") !== (real.tagName || "").toLowerCase()) {
      const realDomEl = createRealNodeByVirtual(virtual);
      sync(virtual, realDomEl);
      realNode.replaceChild(realDomEl, real);
    }

    // create
    if (virtual !== undefined && real === undefined) {
      const realDomEl = createRealNodeByVirtual(virtual);
      sync(virtual, realDomEl);
      realNode.appendChild(realDomEl);
    }
  }
}

function createRealNodeByVirtual(virtualNode) {
  if (typeof virtualNode !== "object") {
    return document.createTextNode("");
  }
  return document.createElement(virtualNode.type);
}

setInterval(() => {
  state = {
    ...state,
    time: new Date(),
  };

  renderView(state);
}, 1000);

const api = {
  get(link) {
    switch (link) {
      case "/lots":
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([
              {
                id: 1,
                title: "Apple",
                description: "Apple desciption",
                price: 13,
              },
              {
                id: 2,
                title: "Orange",
                description: "Orange desciption",
                price: 130,
              },
            ]);
          }, 2000);
        });

      default:
        new Error("api path is not defined!");
        break;
    }
  },
};

const stream = {
  subscribe(channel, callback) {
    setInterval(() => {
      callback({
        id: channel,
        price: Math.floor(Math.random() * (150 - 50 + 1)) + 50,
      });
    }, 500);
  },
};

const onPrice = (data) => {
  state = {
    ...state,
    lots: state.lots.map((lot) => {
      if (lot.id === data.id) {
        return {
          ...lot,
          price: data.price,
        };
      }
      return lot;
    }),
  };

  renderView(state);
};

api.get("/lots").then((lots) => {
  state = {
    ...state,
    lots,
  };

  renderView(state);

  lots.forEach((lot) => {
    stream.subscribe(lot.id, onPrice);
  });
});
