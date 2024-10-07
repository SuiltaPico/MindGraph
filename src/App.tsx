import "@/common/var.scss";
import { useNavigate } from "@solidjs/router";
import {
  createEffect,
  on,
  onMount,
  ParentComponent,
  useContext,
} from "solid-js";
import "./App.scss";
import { app_context } from "./AppContext";
import { Framework } from "./components/framework/Framework";

export const App: ParentComponent = (props) => {
  const ac = useContext(app_context)!;
  console.log("AppContext", ac);

  const nav = useNavigate();

  ac.menu.list.set([
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

  return <Framework {...props}></Framework>;
};

export default App;
