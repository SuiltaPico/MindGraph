import { JSXElement, Component } from "solid-js";
import "./DisplayRenderer.css";

interface DisplayRendererProps {
  display: JSXElement | "empty";
}

export const DisplayRenderer: Component<DisplayRendererProps> = (props) => {
  const empty_display = () => {
    return <div class="__display_empty">空空如也</div>;
  };

  return (
    <div class="_display">
      {props.display === "empty" ? (
        empty_display()
      ) : (
        <div class="__display_display">( props.display )</div>
      )}
    </div>
  );
};
