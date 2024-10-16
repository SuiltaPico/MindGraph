import {
  Component,
  createResource,
  Match,
  onCleanup,
  onMount,
  Resource,
  Switch,
  useContext,
} from "solid-js";
import { Accordion, AccordionRenderer } from "../../../base/accordion/Accordion";
import { CanvasStateContext } from "../CanvasState";
import { RendererContext } from "../utils/RendererContext";
import { MindNodeContentRenderer } from "./ContentRenderer";
import "./Renderer.css";

export type MindNodeContentState = Resource<any>["state"];

export type MindNodeRendererMeta = {
  id: string;
  parent_id: string;
  rc: RendererContext;
  state: MindNodeContentState;
};

export type MindNodeRendererElement = HTMLDivElement & {
  _meta: MindNodeRendererMeta;
};

export const MindNodePendingRenderer: Component<{
  id: string;
  rc: RendererContext;
  state: MindNodeContentState;
}> = (props) => {
  let container: MindNodeRendererElement;

  onMount(() => {
    props.rc.dom_el = container;
    props.rc.onresize?.(0);
  });

  return (
    <div
      class="_m_mind_node mind_node_pending"
      ref={(it) => {
        container = it as MindNodeRendererElement;
        container._meta = {
          state: props.state,
          id: props.id,
          parent_id: props.rc.parent_rc.node_id,
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
  rc: RendererContext;
}> = (props) => {
  let container: MindNodeRendererElement;

  onMount(() => {
    props.rc.dom_el = container;
    props.rc.onresize?.(0);
  });

  const accordion = new Accordion();
  return (
    <div
      class="_m_mind_node mind_node_error"
      ref={(it) => {
        container = it as MindNodeRendererElement;
        container._meta = {
          state: "errored",
          id: props.id,
          parent_id: props.rc.parent_rc.node_id,
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

export function MindNodeRenderer(props: { id: string; rc: RendererContext }) {
  const node_id = props.id;
  const ctx = useContext(CanvasStateContext);
  const rc = props.rc;

  // onMount(() => {
  //   rc.children_rc.set(node_id, rc);
  // });

  // onCleanup(() => {
  //   rc.children_rc.delete(node_id);
  // });

  const [node, { refetch }] = createResource(async () => {
    return await ctx!.get_node_helper(node_id, rc);
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
