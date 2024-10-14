import { app_context } from "@/AppContext";
import { MenuRenderer } from "@/components/base/menu/Menu";
import { Header } from "@/components/framework/header/Header";
import { ParentComponent, useContext } from "solid-js";

export const Framework: ParentComponent = (props) => {
  const ac = useContext(app_context)!;
  return (
    <div class="fw_container">
      <Header />
      {props.children}
      <MenuRenderer context={ac.menu} />
    </div>
  );
};
