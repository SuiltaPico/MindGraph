import Menu from "./Menu";
import "./TopBar.scss";
import { Component } from "solid-js";

interface TopBarProps {
  // menuVisible: boolean;
  // setMenuVisible: (visible: boolean) => boolean;
}
export const TopBar: Component<TopBarProps> = (props) => {
  return (
    <div class="fw_top_bar">
      {/* <div onclick={() => props.setMenuVisible(!props.menuVisible)}> */}
      <Menu />
      {/* </div> */}
      <div class="__file_name">
        <div>新建知识库</div>
      </div>
    </div>
  );
};
