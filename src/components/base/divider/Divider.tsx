import "./Divider.css";
import { Component } from "solid-js";

/** 水平分割线 */
export const RowDivider: Component = () => {
  return <div class="_m_divider __horizontal__"></div>;
};

/** 垂直分割线 */
export const ColumnDivider: Component = () => {
  return <div class="_m_divider __vertical__"></div>;
};
