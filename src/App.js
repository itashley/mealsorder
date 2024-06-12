import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import Recapitulation from "./pages/Recap";
import Login from "./pages/Login";
import OrderList from "./pages/Order";
// import Report from "./pages/Report";
import PublicRoute from "./utils/PublicRoute";
import PrivateRoute from "./utils/PrivateRoute";

function App() {
  return (
    <Router>
      <Switch>
        <PublicRoute exact path="/" component={Login} />
        <PrivateRoute exact path="/dashboard" component={OrderList} />
        <PrivateRoute exact path="/recapitulation" component={Recapitulation} />
      </Switch>
    </Router>
  );
}

export default App;
