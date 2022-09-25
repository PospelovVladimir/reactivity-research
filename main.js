let state = {
  time: new Date(),
  lots: null,
};

function Header() {
  const header = document.createElement("header");
  header.classList.add("header");
  header.appendChild(Logo());

  return header;
}

function Logo() {
  const logo = document.createElement("img");
  logo.classList.add("logo");
  logo.src = "./logo.png";

  return logo;
}

function Time({ time }) {
  const timeEl = document.createElement("div");
  timeEl.classList.add("time");

  const value = document.createElement("span");
  value.classList.add("time__value");
  value.textContent = time.toLocaleTimeString();

  const icon = document.createElement("span");
  icon.classList.add("time__icon");

  if (time.getHours() >= 7 && time.getHours() <= 21) {
    icon.textContent = "🌕";
  } else {
    icon.textContent = "🌑";
  }

  timeEl.appendChild(value);
  timeEl.appendChild(icon);

  return timeEl;
}

function Lots({ lots }) {
  const lotsEl = document.createElement("div");
  lotsEl.classList.add("lots");

  if (lots === null) {
    lotsEl.textContent = "loading...";
    return lotsEl;
  }

  lots.forEach((lot) => {
    lotsEl.insertAdjacentHTML("beforeend", Lot(lot));
  });

  return lotsEl;
}

function Lot({ id, title, description, price }) {
  return `<article class="lot__item" data-id="${id}">
          <div class="lot__content">
            <h2 class="lot__title">${title}</h2>
            <p class="lot__desciption">${description}</p>
          </div>
          <div class="lot__price">${price}</div>
        </article>`;
}

function App({ time, lots }) {
  const app = document.createElement("div");
  app.classList.add("app");

  app.appendChild(Header());
  app.appendChild(Time({ time }));
  app.appendChild(Lots({ lots }));

  return app;
}

function renderView(state) {
  render(App(state), document.getElementById("root"));
}

renderView(state);

function render(virtualDom, realDomRoot) {
  const virtualDomRoot = document.createElement(realDomRoot.tagName);
  virtualDomRoot.id = realDomRoot.id;
  virtualDomRoot.append(virtualDom);

  sync(virtualDomRoot, realDomRoot);
}

function sync(virtualNode, realNode) {
  // sync elements
  if (virtualNode.id !== realNode.id) {
    realNode.id = virtualNode.id;
  }

  if (virtualNode.className !== realNode.className) {
    realNode.className = virtualNode.className;
  }

  if (virtualNode.attributes) {
    Array.from(virtualNode.attributes).forEach((attr) => {
      realNode[attr.nodeName] = attr.value;
    });
  }

  if (virtualNode.nodeValue !== realNode.nodeValue) {
    realNode.nodeValue = virtualNode.nodeValue;
  }

  // sync children nodes
  const virtualChildren = virtualNode.childNodes;
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
      virtual.tagName === real.tagName
    ) {
      sync(virtual, real);
    }

    // replace
    if (
      virtual !== undefined &&
      real !== undefined &&
      virtual.tagName !== real.tagName
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
  if (virtualNode.nodeType === Node.TEXT_NODE) {
    return document.createTextNode("");
  }
  return document.createElement(virtualNode.tagName);
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
