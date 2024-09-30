import { Route, useNavigate } from "@solidjs/router";
import { CanvasRenderer } from "./canvas/CanvasRenderer";
import { useContext } from "solid-js";
import { app_context } from "@/AppContext";

export const routers = (
  <>
    <Route
      path="/"
      component={() => {
        const nav = useNavigate();
        nav("/canvas");
        return undefined;
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
