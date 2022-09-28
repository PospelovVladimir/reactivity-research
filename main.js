let state = {
  time: new Date(),
  lots: null,
};

function Header() {
  return {
    type: "header",
    props: {
      className: "header",
      children: [
        {
          type: Logo,
        },
      ],
    },
  };
}

function Logo() {
  return {
    type: "img",
    props: {
      className: "logo",
      src: "./logo.png",
    },
  };
}

function Time({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return {
    type: "div",
    props: {
      className: "time",
      children: [
        {
          type: "span",
          props: {
            className: "time__value",
            children: [time.toLocaleTimeString()],
          },
        },
        {
          type: "span",
          props: {
            className: "time__icon",
            children: [isDay ? "🌕" : "🌑"],
          },
        },
      ],
    },
  };
}

function Lots({ lots }) {
  if (lots === null) {
    return {
      type: "div",
      props: {
        className: "lots",
        children: ["loading..."],
      },
    };
  }

  return {
    type: "div",
    props: {
      className: "lots",
      children: lots.map((lot) => {
        return {
          type: Lot,
          props: { ...lot },
        };
      }),
    },
  };
}

function Lot({ id, title, description, price }) {
  return {
    type: "article",
    key: id,
    props: {
      className: "lot__item",
      children: [
        {
          type: "div",
          props: {
            className: "lot__content",
            children: [
              {
                type: "h2",
                props: {
                  className: "lot__title",
                  children: [title],
                },
              },
              {
                type: "p",
                props: {
                  className: "lot__desciption",
                  children: [description],
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            className: "lot__price",
            children: [price],
          },
        },
      ],
    },
  };
}

function App({ time, lots }) {
  return {
    type: "div",
    props: {
      className: "app",
      children: [
        {
          type: Header,
          props: {},
        },
        {
          type: Time,
          props: { time },
        },
        {
          type: Lots,
          props: { lots },
        },
      ],
    },
  };
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
      children: Array.isArray(props.children)
        ? props.children.map(evaluate)
        : [evaluate(props.children)],
    },
  };
}

function renderView(state) {
  render(App(state), document.getElementById("root"));
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
  const virtualChildren = virtualNode.props
    ? virtualNode.props.children || []
    : [];
  const realChildren = realNode.childNodes;

  for (let i = 0; i < virtualChildren.length || i < realChildren.length; i++) {
    const virtual = virtualChildren[i];
    const real = realChildren[i];

    // remove
    if (virtual === undefined && real !== undefined) {
      real.remove();
    }

    // update
    if (
      virtual !== undefined &&
      real !== undefined &&
      (virtual.type || "") === (real.tagName || "").toLowerCase()
    ) {
      sync(virtual, real);
    }

    // replace
    if (
      virtual !== undefined &&
      real !== undefined &&
      (virtual.type || "") !== (real.tagName || "").toLowerCase()
    ) {
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
