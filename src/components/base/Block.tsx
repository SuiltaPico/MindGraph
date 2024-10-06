import { Component } from "solid-js";

interface BlockProps {
  direction?: "" | "h" | "horizontal" | "v" | "vertical";
  size: number;
}

/**
 * 一个没有什么用的组件，方块(?)。生成一个空出来的区域。
 * @param props
 *        props.direction 方向（默认为水平，选填horizontal,h,vertical或者v）
 *        props.size 大小（单位px）
 * @returns
 */
export const Block: Component<BlockProps> = (props) => {
  const direction = props.direction ?? "horizontal";

  return (
    <>
      {direction === "vertical" || direction === "v" ? (
        <div
          style={{ height: props.size + "px", width: "100%", display: "block" }}
        ></div>
      ) : (
        <div
          style={{
            width: props.size + "px",
            height: "100%",
            display: "inline-block",
          }}
        ></div>
      )}
    </>
  );
};
