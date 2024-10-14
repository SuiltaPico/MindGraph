import { app_context } from "@/AppContext";
import { Button } from "@/components/base/button/Button";
import { Icon } from "@/components/base/icon/Icon";
import { mdiMenu } from "@mdi/js";
import { Component, useContext } from "solid-js";
import "./Header.css";
import { useNavigate } from "@solidjs/router";

/** 顶部栏 */
export const Header: Component<{}> = () => {
  const ac = useContext(app_context)!;
  const nav = useNavigate();

  const menu_list = [
    {
      name: "新建",
      onclick: () => ac.mg_new(),
    },
    {
      name: "打开",
      onclick: () => ac.open_mg(),
    },
    { name: "保存", onclick: () => ac.mg_save() },
    { name: "另存为", onclick: () => ac.mg_save_as() },
    {
      name: "退出到主页",
      onclick: () => {
        nav("/");
      },
    },
  ];

  let button: HTMLButtonElement | undefined;
  return (
    <div class="fw_top_bar">
      <Button
        ref={button}
        onclick={() => ac.menu.show(menu_list, { el: button! })}
      >
        <Icon path={mdiMenu} style={{ color: "gray" }}></Icon>
      </Button>
      <div class="__project_name" contentEditable>
        {ac.meta.get().name}
      </div>
    </div>
  );
};
