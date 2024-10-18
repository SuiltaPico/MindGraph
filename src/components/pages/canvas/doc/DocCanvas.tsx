import { createContext } from "solid-js";
import { Canvas } from "../Canvas";

export class DocCanvas {
  constructor(public canvas: Canvas) {}
}

export const DocCanvasContext = createContext<DocCanvas>();
