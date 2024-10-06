import "@/common/var.scss";
import { Router } from "@solidjs/router";
import { createEffect, on, onMount } from "solid-js";
import "./App.scss";
import { app_context, AppContext } from "./AppContext";
import { Framework } from "./components/framework/Framework";
import { routers } from "./components/pages/router";

export const App = () => {
  const ac = new AppContext();
  console.log("AppContext", ac);

  ac.menu.list.set([
    {
      name: "新建",
      onclick: () => {
        alert("还没做");
      },
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
        alert("还没做");
      },
    },
  ]);

  createEffect(
    on(ac.meta.get, () => {
      ac.api.window.set_title(ac.meta.get().name + " | MindGraph");
    })
  );

  onMount(async () => {
    await ac.api.app.mg.load(ac.file.get().uri);

    const init_data = await ac.api.app.mg.get_init_data();
    ac.meta.set(init_data.meta);
    ac.canvas.root.set(init_data.root_node_id);
  });

  return (
    <app_context.Provider value={ac}>
      <Router root={Framework}>{routers}</Router>
    </app_context.Provider>
  );
};

export default App;
