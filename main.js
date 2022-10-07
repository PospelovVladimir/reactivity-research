const initTimeState = {
  time: new Date(),
};

const UPDATE_TIME = "UPDATE_TIME";

const initLotsState = {
  lots: null,
};

const LOAD_LOTS = "LOAD_LOTS";
const UPDATE_PRICE_LOT = "UPDATE_PRICE_LOT";
const ADD_LOT_IN_FAVORITE = "ADD_LOT_IN_FAVORITE";
const REMOVE_LOT_FROM_FAVORITE = "REMOVE_LOT_FROM_FAVORITE";

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
    case ADD_LOT_IN_FAVORITE:
      return {
        ...state,
        lots: state.lots.map((lot) => {
          if (lot.id === action.id) {
            return {
              ...lot,
              favorite: true,
            };
          }
          return lot;
        }),
      };
    case REMOVE_LOT_FROM_FAVORITE:
      return {
        ...state,
        lots: state.lots.map((lot) => {
          if (lot.id === action.id) {
            return {
              ...lot,
              favorite: false,
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

function addLotInFavorite(id) {
  return {
    type: ADD_LOT_IN_FAVORITE,
    id,
  };
}

function removeLotFromFavorite(id) {
  return {
    type: REMOVE_LOT_FROM_FAVORITE,
    id,
  };
}

const store = Redux.createStore(
  Redux.combineReducers({
    clock: timeReducer,
    auction: lotsReducer,
  })
);

store.subscribe(() => renderView(store));

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

function Lots({ lots, favorite, unfavorite }) {
  if (lots === null) {
    return <div className="lots">loading...</div>;
  }

  return (
    <div className="lots">
      {lots.map((lot) => (
        <Lot lot={lot} key={lot.id} favorite={favorite} unfavorite={unfavorite} />
      ))}
    </div>
  );
}

function Lot({ lot, favorite, unfavorite }) {
  return (
    <article className={`lot__item ${lot.favorite ? "lot__item-favorite" : ""}`}>
      <div className="lot__content">
        <h2 className="lot__title">{lot.title}</h2>
        <p className="lot__desciption">{lot.description}</p>
      </div>
      <div className="lot__price">{lot.price}</div>
      <Favorite active={lot.favorite} favorite={() => favorite(lot.id)} unfavorite={() => unfavorite(lot.id)} />
    </article>
  );
}

function Favorite({ active, favorite, unfavorite }) {
  return active ? (
    <button type="button" className="favorite" onClick={() => unfavorite()}>
      <ion-icon name="heart"></ion-icon>
    </button>
  ) : (
    <button type="button" className="favorite" onClick={() => favorite()}>
      <ion-icon name="heart-outline"></ion-icon>
    </button>
  );
}

function App({ state, favorite, unfavorite }) {
  return (
    <div className="app">
      <Header />
      <Time time={state.clock.time} />
      <Lots lots={state.auction.lots} favorite={favorite} unfavorite={unfavorite} />
    </div>
  );
}

function renderView(store) {
  const state = store.getState();

  const favorite = (id) => {
    api.post(`/lots/${id}/favorite`).then(() => {
      store.dispatch(addLotInFavorite(id));
    });
  };

  const unfavorite = (id) => {
    api.post(`/lots/${id}/unfavorite`).then(() => {
      store.dispatch(removeLotFromFavorite(id));
    });
  };

  ReactDOM.render(React.createElement(App, { state, favorite, unfavorite }), document.getElementById("root"));
}

renderView(store);

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
                favorite: false,
              },
              {
                id: 2,
                title: "Orange",
                description: "Orange desciption",
                price: 130,
                favorite: false,
              },
            ]);
          }, 2000);
        });

      default:
        new Error("api path is not defined!");
        break;
    }
  },

  post(link) {
    const [path, id, action] = link.slice(1).split("/");
    switch (`/${path}/${action}`) {
      case "/lots/favorite":
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({});
          }, 500);
        });
      case "/lots/unfavorite":
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({});
          }, 500);
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
