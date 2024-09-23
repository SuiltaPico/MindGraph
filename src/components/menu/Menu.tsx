import { mdiMenu } from "@mdi/js";
import { Icon } from "../base/Icon";
import "./Menu.css";

export default function Menu() {
  return (
    <div class="menubuttom">
      <Icon path={mdiMenu} style={{ color: "gray" }}></Icon>
    </div>
  );
}
