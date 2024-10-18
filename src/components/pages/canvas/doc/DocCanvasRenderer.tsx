import { Canvas } from "../Canvas";
import { DocCanvas, DocCanvasContext } from "./DocCanvas";

export const DocCanvasRenderer = (props: {
  canvas: Canvas;
  doc_canvas: DocCanvas;
}) => {
  return (
    <DocCanvasContext.Provider value={props.doc_canvas}>
      <div>TODO</div>
    </DocCanvasContext.Provider>
  );
};
