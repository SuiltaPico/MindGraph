import {
  Component,
  createResource,
  Match,
  onMount,
  Switch,
  useContext,
} from "solid-js";
import { Accordion, AccordionRenderer } from "../base/Accordion";
import { CanvasStateContext, RenderContext } from "./Canvas";
import { MindNodeContentRenderer } from "./MindNodeContentRenderer";
import "./MindNodeRenderer.scss";

export const MindNodePendingRenderer: Component<{
  id: string;
  rc: RenderContext
}> = (props) => {
  let container: HTMLDivElement;

  onMount(() => {
    props.rc.onresize?.(container, 0);
  });

  return (
    <div
      class="mind_node_pending"
      ref={(it) => {
        container = it;
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
  rc: RenderContext
}> = (props) => {
  let container: HTMLDivElement;

  onMount(() => {
    props.rc.onresize?.(container, 0);
  });

  const accordion = new Accordion();
  return (
    <div
      class="mind_node_error"
      ref={(it) => {
        container = it;
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
    return await ctx!.get_node(node_id, props.rc.parent_id);
  });

  return (
    <Switch>
      <Match when={node.state === "pending" || node.state === "refreshing"}>
        <MindNodePendingRenderer id={node_id} rc={props.rc} />
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
