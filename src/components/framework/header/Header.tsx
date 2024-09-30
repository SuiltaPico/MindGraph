import { app_context } from "@/AppContext";
import { Button } from "@/components/base/Button";
import { Icon } from "@/components/base/Icon";
import { mdiMenu } from "@mdi/js";
import { Component, useContext } from "solid-js";
import "./Header.scss";

export const Header: Component<{}> = (props) => {
  const ac = useContext(app_context)!;
  return (
    <div class="fw_top_bar">
      <Button onclick={() => ac.menu.showing.set(!ac.menu.showing.get())}>
        <Icon path={mdiMenu} style={{ color: "gray" }}></Icon>
      </Button>
      <div class="__file_name">
        <div>{ac.meta.get().name}</div>
      </div>
    </div>
  );
};
