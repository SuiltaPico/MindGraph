import { app_context } from "@/AppContext";
import { useContext } from "solid-js";
import "./CanvasPage.css";
import { CanvasRenderer } from "./CanvasRenderer";

export const CanvasPage = () => {
  const ac = useContext(app_context)!;
  return (
    <div class="page_canvas">
      <CanvasRenderer state={ac.canvas} />
    </div>
  );
};
