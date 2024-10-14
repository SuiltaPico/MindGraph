import "@/common/var.scss";
import { useNavigate } from "@solidjs/router";
import {
  createEffect,
  on,
  onMount,
  ParentComponent,
  useContext,
} from "solid-js";
import "./App.css";
import { app_context } from "./AppContext";
import { Framework } from "./components/framework/Framework";

export const App: ParentComponent = (props) => {
  const ac = useContext(app_context)!;
  console.log("AppContext", ac);

  const nav = useNavigate();

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
