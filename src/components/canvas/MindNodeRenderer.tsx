import {
  Component,
  createResource,
  Match,
  onMount,
  Resource,
  Switch,
  useContext,
} from "solid-js";
import { Accordion, AccordionRenderer } from "../base/Accordion";
import {
  CanvasStateContext,
  RenderContext
} from "./CanvasState";
import { MindNodeContentRenderer } from "./MindNodeContentRenderer";
import "./MindNodeRenderer.scss";

export type MindNodeContentState = Resource<any>["state"];

export type MindNodeRendererMeta = {
  id: string;
  parent_id: string;
  rc: RenderContext;
  state: MindNodeContentState;
};

export type MindNodeRendererElement = HTMLDivElement & {
  _meta: MindNodeRendererMeta;
};

export const MindNodePendingRenderer: Component<{
  id: string;
  rc: RenderContext;
  state: MindNodeContentState;
}> = (props) => {
  let container: MindNodeRendererElement;

  onMount(() => {
    props;
    props.rc.onresize?.(container, 0);
  });

  return (
    <div
      class="mind_node_renderer mind_node_pending"
      ref={(it) => {
        container = it as MindNodeRendererElement;
        container._meta = {
          state: props.state,
          id: props.id,
          parent_id: props.rc.parent_rc.id,
          rc: props.rc,
        };
      }}
    >
      加载中...
    </div>
  );
};

export const MindNodeErrorRenderer: Component<{
  error: any;
  retry: () => void;
  id: string;
  rc: RenderContext;
}> = (props) => {
  let container: MindNodeRendererElement;

  onMount(() => {
    props.rc.onresize?.(container, 0);
  });

  const accordion = new Accordion();
  return (
    <div
      class="mind_node_renderer mind_node_error"
      ref={(it) => {
        container = it as MindNodeRendererElement;
        container._meta = {
          state: "errored",
          id: props.id,
          parent_id: props.rc.parent_rc.id,
          rc: props.rc,
        };
      }}
    >
      节点加载失败。
      <AccordionRenderer
        class="__accordion"
        state={accordion}
        _title={<div>错误信息</div>}
        _content={<div>{String(props.error)}</div>}
      ></AccordionRenderer>
      <button onClick={props.retry}>重试</button>
    </div>
  );
};

export function MindNodeRenderer(props: { id: string; rc: RenderContext }) {
  const node_id = props.id;
  const ctx = useContext(CanvasStateContext);

  const [node, { refetch }] = createResource(async () => {
    return await ctx!.get_node(node_id, props.rc.parent_rc.id);
  });

  return (
    <Switch>
      <Match when={node.state === "pending" || node.state === "refreshing"}>
        <MindNodePendingRenderer
          id={node_id}
          rc={props.rc}
          state={node.state}
        />
      </Match>
      <Match when={node.state === "ready"}>
        <MindNodeContentRenderer it={node()!} />
      </Match>
      <Match when={node.state === "errored"}>
        <MindNodeErrorRenderer
          error={node.error}
          retry={refetch}
          id={node_id}
          rc={props.rc}
        />
      </Match>
    </Switch>
  );
}
