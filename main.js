let state = {
  time: new Date(),
  lots: null,
};

function Header() {
  return (
    <header className="header">
      <Logo />
    </header>
  );
}

function Logo() {
  return <img className="logo" src="./logo.png" alt="erjkgh e" />;
}

function Time({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return (
    <div className="time">
      <span className="time__value">{time.toLocaleTimeString()}</span>
      <span className="time__icon">{isDay ? "🌕" : "🌑"}</span>
    </div>
  );
}

function Lots({ lots }) {
  if (lots === null) {
    return <div className="lots">loading...</div>;
  }

  return (
    <div className="lots">
      {lots.map((lot) => (
        <Lot lot={lot} />
      ))}
    </div>
  );
}

function Lot({ lot }) {
  return (
    <article className="lot__item" key={lot.id}>
      <div className="lot__content">
        <h2 className="lot__title">{lot.title}</h2>
        <p className="lot__desciption">{lot.description}</p>
      </div>
      <div className="lot__price">{lot.price}</div>
    </article>
  );
}

function App({ state }) {
  return (
    <div className="app">
      <Header />
      <Time time={state.time} />
      <Lots lots={state.lots} />
    </div>
  );
}

function renderView(state) {
  ReactDOM.render(React.createElement(App, { state }), document.getElementById("root"));
}

renderView(state);

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
