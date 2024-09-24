import {
  Component,
  createResource,
  Match,
  onMount,
  Switch,
  useContext,
} from "solid-js";
import { Accordion, AccordionRenderer } from "../base/Accordion";
import { CanvasStateContext } from "./Canvas";
import "./MindNodeRenderer.scss";
import { MindNodeContentRenderer } from "./MindNodeContentRenderer";

export const MindNodePendingRenderer: Component<{
  id: string;
}> = (props) => {
  let container: HTMLDivElement;
  const ctx = useContext(CanvasStateContext)!;

  onMount(() => {
    ctx.get_render_info(props.id).onresize?.(container, 0);
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
}> = (props) => {
  let container: HTMLDivElement;
  const ctx = useContext(CanvasStateContext)!;

  onMount(() => {
    ctx.get_render_info(props.id).onresize?.(container, 0);
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

export function MindNodeRenderer(props: { id: string }) {
  const node_id = props.id;
  const ctx = useContext(CanvasStateContext);

  const [node, { refetch }] = createResource(() => ctx!.get_node(node_id));

  return (
    <Switch>
      <Match when={node.state === "pending" || node.state === "refreshing"}>
        <MindNodePendingRenderer id={node_id} />
      </Match>
      <Match when={node.state === "ready"}>
        <MindNodeContentRenderer it={node()!} />
      </Match>
      <Match when={node.state === "errored"}>
        <MindNodeErrorRenderer
          error={node.error}
          retry={refetch}
          id={node_id}
        />
      </Match>
    </Switch>
  );
}
