import { async_debounce } from "@/common/async";
import { WrappedSignal } from "@/common/signal";
import { EditorJSContent, IFullMindNode } from "@/domain/MindNode";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import {
  Component,
  createMemo,
  For,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch
} from "solid-js";
import { Canvas } from "../../Canvas";
import { MindNodeHelper } from "../../utils/Helper";

function markdown_to_editorjs(markdown: string): OutputData {
  return {
    blocks: markdown.split("\n").map((line) => ({
      type: "paragraph",
      data: {
        text: line,
      },
    })),
  } satisfies OutputData;
}

export function node_content_to_editorjs(content: IFullMindNode["content"]) {
  if (content._type === "markdown") {
    return {
      _type: "editorjs" as const,
      value: markdown_to_editorjs(content.value),
    };
  }
  return content;
}

export class Editor {
  // 0.5 秒保存一次
  handle_change = async_debounce(
    async (fn: () => Promise<IFullMindNode["content"]>) => {
      this.node_helper.set_prop("content", await fn());
      this.canvas.mark_modified(this.node_helper.node.id);
    },
    10
  );

  constructor(
    public node_helper: MindNodeHelper,
    public canvas: Canvas,
    public editing: WrappedSignal<boolean>
  ) {}
}

export const MarkdownReadMode: Component<{ editor: Editor }> = (props) => {
  return props.editor.node_helper.node.content.value as string;
};

export const EditorJSReadMode: Component<{ editor: Editor }> = (props) => {
  const content = createMemo(
    () => props.editor.node_helper.get_prop("content") as EditorJSContent
  );
  const blocks = createMemo(
    () =>
      content().value.blocks
  );
  return (
    <div>
      <For each={blocks()}>{(block) => <div>{block.data.text}</div>}</For>
    </div>
  );
};

export const EditorJSEditMode: Component<{ editor: Editor }> = (props) => {
  const editor = props.editor;
  let container: HTMLDivElement;
  let editor_js: EditorJS | undefined;
  onMount(() => {
    editor_js = new EditorJS({
      holder: container,
      data: node_content_to_editorjs(editor.node_helper.node.content).value,
      minHeight: 0,
      autofocus: true,
      onChange: (api) =>
        editor.handle_change(async () => ({
          _type: "editorjs",
          value: await api!.saver.save(),
        })),
    });
  });
  onCleanup(() => {
    editor_js?.destroy();
  });
  return <div ref={(it) => (container = it)}></div>;
};

export const EditorRenderer: Component<{ editor: Editor }> = (props) => {
  const editor = props.editor;
  const content = createMemo(() => editor.node_helper.get_prop("content"));
  return (
    <>
      <Show when={editor.editing.get()}>
        <EditorJSEditMode editor={editor} />
      </Show>
      <Show when={!editor.editing.get()}>
        <Switch>
          <Match when={content()._type === "markdown"}>
            <MarkdownReadMode editor={editor} />
          </Match>
          <Match when={content()._type === "editorjs"}>
            <EditorJSReadMode editor={editor} />
          </Match>
        </Switch>
      </Show>
    </>
  );
};
