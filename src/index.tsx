/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import { Router } from "@solidjs/router";
import { routers } from "./components/pages/router";
import { app_context, AppContext } from "./AppContext";
import "virtual:uno.css";

const ac = new AppContext();

render(
  () => (
    <app_context.Provider value={ac}>
      <Router root={App}>{routers}</Router>
    </app_context.Provider>
  ),
  document.getElementById("root") as HTMLElement
);
