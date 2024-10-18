import { Component } from "solid-js";
import { Canvas, CanvasStateContext } from "./Canvas";
import { NodeCanvas } from "./node/NodeCanvas";
import { NodeCanvasRenderer } from "./node/NodeCanvasRenderer";
import { Column } from "@/components/base/block/Flex";
import "./CanvasRenderer.css";

export const CanvasRenderer: Component<{ state: Canvas }> = (props) => {
  const node_canvas = new NodeCanvas(props.state);
  return (
    <CanvasStateContext.Provider value={props.state}>
      <Column class="_m_canvas_renderer">
        <NodeCanvasRenderer canvas={props.state} node_canvas={node_canvas} />
      </Column>
    </CanvasStateContext.Provider>
  );
};
