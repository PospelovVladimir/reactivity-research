const initTimeState = {
  time: new Date(),
};

const UPDATE_TIME = "UPDATE_TIME";

const initLotsState = {
  lots: null,
};

const LOAD_LOTS = "LOAD_LOTS";
const UPDATE_PRICE_LOT = "UPDATE_PRICE_LOT";

// --------------------------------- work with store

function timeReducer(state = initTimeState, action) {
  switch (action.type) {
    case UPDATE_TIME:
      return {
        ...state,
        time: action.data,
      };

    default:
      return state;
  }
}

function lotsReducer(state = initLotsState, action) {
  switch (action.type) {
    case LOAD_LOTS:
      return {
        ...state,
        lots: action.data,
      };
    case UPDATE_PRICE_LOT:
      return {
        ...state,
        lots: state.lots.map((lot) => {
          if (lot.id === action.data.id) {
            return {
              ...lot,
              price: action.data.price,
            };
          }
          return lot;
        }),
      };

    default:
      return state;
  }
}

// ------------------ actions
function updateTimeInStore(time) {
  return {
    type: UPDATE_TIME,
    data: time,
  };
}

function loadLots(lots) {
  return {
    type: LOAD_LOTS,
    data: lots,
  };
}

function updatePriceLot(data) {
  return {
    type: UPDATE_PRICE_LOT,
    data,
  };
}

const store = Redux.createStore(
  Redux.combineReducers({
    clock: timeReducer,
    auction: lotsReducer,
  })
);

store.subscribe(() => renderView(store.getState()));

// ------------------
// ---------------------------------

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
        <Lot lot={lot} key={lot.id} />
      ))}
    </div>
  );
}

function Lot({ lot }, key) {
  return (
    <article className="lot__item" key={key}>
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
      <Time time={state.clock.time} />
      <Lots lots={state.auction.lots} />
    </div>
  );
}

function renderView(state) {
  ReactDOM.render(React.createElement(App, { state }), document.getElementById("root"));
}

renderView(store.getState());

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

setInterval(() => {
  store.dispatch(updateTimeInStore(new Date()));
}, 1000);

api.get("/lots").then((lots) => {
  store.dispatch(loadLots(lots));

  lots.forEach((lot) => {
    stream.subscribe(lot.id, onPrice);
  });
});

const onPrice = (data) => {
  store.dispatch(updatePriceLot(data));
};
