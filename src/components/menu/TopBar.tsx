import { app_context, AppContext } from "@/App";
import Menu from "./Menu";
import "./TopBar.scss";
import { Component, useContext } from "solid-js";

interface TopBarProps {
  // menuVisible: boolean;
  // setMenuVisible: (visible: boolean) => boolean;
}
export const TopBar: Component<TopBarProps> = (props) => {
  const ac = useContext(app_context)!;
  return (
    <div class="fw_top_bar">
      {/* <div onclick={() => props.setMenuVisible(!props.menuVisible)}> */}
      <Menu />
      {/* </div> */}
      <div class="__file_name">
        <div>{ac.meta.get().name}</div>
      </div>
    </div>
  );
};
