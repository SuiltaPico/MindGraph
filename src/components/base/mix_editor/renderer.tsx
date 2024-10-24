import { JSX } from "solid-js";
import { MixEditor, Block, Inline, InlineTag } from "./MixEditor";
import { AreaContext } from "./AreaContext";

export type BlockRenderer = (props: {
  editor: MixEditor;
  block: Block;
  context: AreaContext;
}) => JSX.Element;

export type InlineRenderer = (props: {
  editor: MixEditor;
  inline: Inline;
  context: AreaContext;
}) => JSX.Element;

export type InlineTagRenderer = (props: {
  editor: MixEditor;
  inline_tag: InlineTag;
  context: AreaContext;
}) => JSX.Element;

export type RendererMap = {
  block: Map<Block["type"], BlockRenderer>;
  inline: Map<Inline["type"], InlineRenderer>;
  inline_tag: Map<InlineTag["type"], InlineTagRenderer>;
};
