import Menu from "./Menu";
import "./FnBar.css";

interface FnBarProps {
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => boolean;
}
export default function FnBar(props: FnBarProps) {
  return (
    <div class="bar">
      <div class="fnbarzone1" style={{ display: "flex" }}>
        <div
          style={{ "z-index": 15 }}
          onclick={() => props.setMenuVisible(!props.menuVisible)}
        >
          <Menu />
        </div>
        <div class="filename">
          <div>FileNameExample</div>
        </div>
      </div>
    </div>
  );
}
