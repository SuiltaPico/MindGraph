import { useContext } from "solid-js";
import { CanvasRenderer } from "./CanvasRenderer";
import { app_context } from "@/AppContext";
import "./CanvasPage.css";

export const CanvasPage = () => {
  const ac = useContext(app_context)!;
  return (
    <div class="page_canvas">
      <CanvasRenderer state={ac.canvas} />
    </div>
  );
};
