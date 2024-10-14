import { Route, useNavigate } from "@solidjs/router";
import { PortalPage } from "./portal/PortalPage.tsx";
import { CanvasPage } from "./canvas/CanvasPage.tsx";

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
        return <PortalPage />;
      }}
    />
    <Route
      path="/canvas"
      component={() => {
        return <CanvasPage />;
      }}
    />
  </>
);
