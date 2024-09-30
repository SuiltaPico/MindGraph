import { Component, ParentComponent, useContext } from "solid-js";
import { Header } from "./header/Header";
import { MenuRenderer } from "../base/menu/Menu";
import { app_context } from "@/App";

export const Framework: ParentComponent = (props) => {
  const ac = useContext(app_context)!;
  return (
    <div class="fw_container">
      <Header />
      <MenuRenderer context={ac.menu} />
      {props.children}
    </div>
  );
};
