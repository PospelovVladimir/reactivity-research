const initLotsState = {
  lots: [],
  loaded: false,
  load: false,
  error: null,
};

const LOTS_STATUS_LOADED = "LOTS_STATUS_LOADED";
const LOTS_STATUS_LOAD = "LOTS_STATUS_LOAD";
const LOTS_STATUS_ERROR = "LOTS_STATUS_ERROR";
const UPDATE_PRICE_LOT = "UPDATE_PRICE_LOT";
const ADD_LOT_IN_FAVORITE = "ADD_LOT_IN_FAVORITE";
const REMOVE_LOT_FROM_FAVORITE = "REMOVE_LOT_FROM_FAVORITE";

// --------------------------------- work with store

function lotsReducer(state = initLotsState, action) {
  switch (action.type) {
    case LOTS_STATUS_LOADED:
      return {
        ...state,
        lots: action.data,
        loaded: true,
        load: false,
        error: null,
      };
    case LOTS_STATUS_LOAD:
      return {
        ...state,
        lots: [],
        loaded: false,
        load: true,
        error: null,
      };
    case LOTS_STATUS_ERROR:
      return {
        ...state,
        lots: [],
        loaded: false,
        load: false,
        error: action.data,
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

function statusLoadedLots(lots) {
  return {
    type: LOTS_STATUS_LOADED,
    data: lots,
  };
}

function statusLoadLots() {
  return {
    type: LOTS_STATUS_LOAD,
    data: null,
  };
}

function statusErrorLots(status) {
  return {
    type: LOTS_STATUS_ERROR,
    data: status,
  };
}

function asyncLoadLots() {
  return (dispatch, getState, { api }) => {
    dispatch(statusLoadLots());
    return api
      .get("/lots")
      .then((lots) => {
        dispatch(statusLoadedLots(lots));
      })
      .catch((error) => {
        dispatch(statusErrorLots(error.message));
      });
  };
}

function updatePriceLot(data) {
  return {
    type: UPDATE_PRICE_LOT,
    data,
  };
}

function asyncSubscribeLotOnSocket(id) {
  return (dispatch, getState, { stream }) => {
    return stream.subscribe(id, (data) => {
      store.dispatch(updatePriceLot(data));
    });
  };
}

function favoriteAsync(id) {
  return (dispatch, getState, { api }) => {
    return api.post(`/lots/${id}/favorite`).then(() => {
      dispatch(addLotInFavorite(id));
    });
  };
}

function addLotInFavorite(id) {
  return {
    type: ADD_LOT_IN_FAVORITE,
    id,
  };
}

function unfavoriteAsync(id) {
  return (dispatch, getState, { api }) => {
    return api.post(`/lots/${id}/unfavorite`).then(() => {
      dispatch(removeLotFromFavorite(id));
    });
  };
}

function removeLotFromFavorite(id) {
  return {
    type: REMOVE_LOT_FROM_FAVORITE,
    id,
  };
}

const api = {
  get(link) {
    switch (link) {
      case "/lots":
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.25) {
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
            } else {
              reject(new Error("Лоты с сервера не пришли :)"));
            }
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
          }, 1500);
        });
      case "/lots/unfavorite":
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({});
          }, 1500);
        });

      default:
        new Error("api path is not defined!");
        break;
    }
  },
};

const stream = {
  subscribe(channel, callback) {
    const unInterval = setInterval(() => {
      callback({
        id: channel,
        price: Math.floor(Math.random() * (150 - 50 + 1)) + 50,
      });
    }, 500);

    return () => {
      clearInterval(unInterval);
    };
  },
};

const thunk = ReduxThunk;

const store = Redux.createStore(
  Redux.combineReducers({
    auction: lotsReducer,
  }),
  Redux.applyMiddleware(thunk.withExtraArgument({ api, stream }))
);

// ------------------
// ---------------------------------

//----------------------------------

function App() {
  return (
    <div className="app">
      <Header />
      <TimeContainer />
      <LotsContainerConnected />
    </div>
  );
}

function Header() {
  return (
    <header className="header">
      <Logo />
    </header>
  );
}

function Logo() {
  return <img className="logo" src="./logo.png" alt="logo" />;
}

function TimeContainer() {
  const [time, setState] = React.useState(new Date());

  React.useEffect(() => {
    const unInterval = setInterval(() => setState(new Date()), 1000);
    return () => clearInterval(unInterval);
  }, [1]);

  return <Time time={time} />;
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

function Loading() {
  return <div className="lots">loading...</div>;
}

function AlertError({ message }) {
  return <div className="error">{message}</div>;
}

// ---------------------------------------------------------------------------------------------------------------------------

function LotsContainer({ asyncLoad, statusLoaded, statusLoad, statusError, lots }) {
  React.useEffect(() => {
    if (!statusLoaded && !statusLoad && statusError === null) {
      asyncLoad();
    }
  }, [!statusLoaded]);

  if (statusLoad) {
    return <Loading />;
  }

  if (statusError !== null) {
    return <AlertError message={statusError} />;
  }

  if (!statusLoaded) {
    return null;
  }

  return <Lots lots={lots} />;
}

const lotsContainerMapStateToProps = (state) => {
  return {
    lots: state.auction.lots,
    statusLoaded: state.auction.loaded,
    statusLoad: state.auction.load,
    statusError: state.auction.error,
  };
};

const lotsContainerMapDispatchToProps = {
  asyncLoad: asyncLoadLots,
};

const LotsContainerConnected = ReactRedux.connect(
  lotsContainerMapStateToProps,
  lotsContainerMapDispatchToProps
)(LotsContainer);

function Lots({ lots }) {
  return (
    <div className="lots">
      {lots.map((lot) => {
        return <LotContainerConnected lot={lot} key={lot.id} />;
      })}
    </div>
  );
}

// ---------------------------------

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

const lotMapDispatchToProp = {
  favorite: favoriteAsync,
  unfavorite: unfavoriteAsync,
};

const LotConnected = ReactRedux.connect(null, lotMapDispatchToProp)(Lot);

function LotContainer({ lot, subscribe }) {
  React.useEffect(() => {
    const unSub = subscribe(lot.id);
    return () => unSub();
  }, [lot.id]);

  return <LotConnected lot={lot} />;
}

const lotContainerMapDispatchToProps = {
  subscribe: asyncSubscribeLotOnSocket,
};

const LotContainerConnected = ReactRedux.connect(null, lotContainerMapDispatchToProps)(LotContainer);

function Favorite({ active, favorite, unfavorite }) {
  const [isDisabled, setDisabled] = React.useState(false);

  const onClickFavorite = () => {
    setDisabled(true);
    favorite()
      .then(() => {
        setDisabled(false);
      })
      .catch(() => {
        setDisabled(false);
      });
  };

  const onClickUnfavorite = () => {
    setDisabled(true);
    unfavorite()
      .then(() => {
        setDisabled(false);
      })
      .catch(() => {
        setDisabled(false);
      });
  };

  return active ? (
    <button type="button" className="favorite" onClick={() => onClickUnfavorite()} disabled={isDisabled}>
      <ion-icon name="heart"></ion-icon>
    </button>
  ) : (
    <button type="button" className="favorite" onClick={() => onClickFavorite()} disabled={isDisabled}>
      <ion-icon name="heart-outline"></ion-icon>
    </button>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------

ReactDOM.render(
  <ReactRedux.Provider store={store}>
    <App />
  </ReactRedux.Provider>,
  document.getElementById("root")
);
