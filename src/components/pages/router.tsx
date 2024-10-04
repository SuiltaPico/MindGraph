import { Route, useNavigate } from "@solidjs/router";
import { CanvasRenderer } from "./canvas/CanvasRenderer";
import { Portal } from "./portal/portal.tsx";
import { useContext } from "solid-js";
import { app_context } from "@/AppContext";

export const routers = (
  <>
    <Route
      path="/"
      component={() => {
        const nav = useNavigate();
        nav("/portal");
        return undefined;
      }}
    />
    <Route
      path="/portal"
      component={() => {
        const ac = useContext(app_context)!;
        return <Portal />;
      }}
    />
    <Route
      path="/canvas"
      component={() => {
        const ac = useContext(app_context)!;
        return <CanvasRenderer state={ac.canvas} />;
      }}
    />
  </>
);
