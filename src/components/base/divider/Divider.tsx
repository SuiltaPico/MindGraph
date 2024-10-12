import "./Divider.scss";
import { Component } from "solid-js";

interface DividerProps {
  direction?: "" | "h" | "horizontal" | "v" | "vertical";
}

/**
 * 一个分割线组件。
 * @param props
 *        props.direction 方向（默认为水平，选填horizontal,h,vertical或者v）
 * @returns
 */
export const Divider: Component<DividerProps> = (props) => {
  const direction = props.direction ?? "horizontal";
  const className =
    direction === "v" || direction === "vertical"
      ? "_m_divider_vertical"
      : "_m_divider_horizontal";
  return <div class={className}></div>;
};
