import { Component, splitProps } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";
import clsx from "clsx";

export const Icon: Component<
  { path: string; size?: number } & JSX.HTMLAttributes<SVGSVGElement>
> = (props) => {
  const [_, pure] = splitProps(props, ["path", "size", "class", "children"]);
  return (
    <svg
      class={clsx("_m_icon", props.class)}
      width={props.size ?? 24}
      height={props.size ?? 24}
      {...(pure as any)}
    >
      <path d={props.path} />
    </svg>
  );
};
