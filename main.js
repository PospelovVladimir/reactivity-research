let state = {
  time: new Date(),
  lots: [
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
  ],
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
    lotsEl.insertAdjacentHTML("afterbegin", Lot(lot));
  });

  return lotsEl;
}

function Lot({ id, title, description, price }) {
  return `<article class="lot__item" data-id="${id}">
          <div lcass="lot__content">
            <h2 class="lot__title">${title}</h2>
            <p class="lot__desciption">${description}</p>
          </div>
          <div class="lot__price">${price}</div>
        </article>
	`;
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
  render(App(state), document.querySelector(".root"));
}

renderView(state);

function render(newDom, realDomRoot) {
  realDomRoot.textContent = "";
  realDomRoot.appendChild(newDom);
}

setInterval(() => {
  state = {
    ...state,
    time: new Date(),
  };

  renderView(state);
}, 1000);
