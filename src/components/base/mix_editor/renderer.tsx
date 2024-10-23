import { JSX } from "solid-js";
import { MixEditor, Block, Inline } from "./MixEditor";

export type BlockRenderer = (props: {
  editor: MixEditor<any, any>;
  block: Block<any, any>;
}) => JSX.Element;;

export type InlineRenderer = (props: {
  editor: MixEditor<any, any>;
  inline: Inline<any, any>;
}) => JSX.Element;

export type RendererMap = {
  block: Map<Block["type"], BlockRenderer>;
  inline: Map<Inline["type"], InlineRenderer>;
};

