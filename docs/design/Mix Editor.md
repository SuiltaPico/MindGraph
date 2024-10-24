# MixEditor
## 概念
### 区域
区域是 MixEditor 中用于表示内容的基本单位，包含块区和行内区两种类型。

#### 块区
块区用于表达一个块级元素，通常是个矩形。

常见的块区有：
* 段落：没有特殊样式的矩形区域。
* 标题：通常用于表示段落中的标题，通常会相对显眼。
* 列表：通常用于表示一组内容，分为有序列表和无序列表两种。
* 引用：通常用于表示一段引用内容。
* 代码块：通常用于表示一段代码内容。
* 多媒体：通常用于表示一段多媒体内容，例如图片、视频、音频等。
* 分割线：通常用于表示一段分割线内容。

#### 行内区
行内区用于表达一个行内元素，通常被包含在块区中。

常见的行内区有：
* 文本：通常用于表示一段文本内容。
* 图片：通常用于表示一张图片。

#### 行内区标签
行内区标签用于为行内区添加修饰。

常见的行内区标签有：
* 超链接：通常用于表示一个超链接。
* 强调：通常用于表示强调内容。
* 删除：通常用于表示删除内容。
* 代码段：通常用于表示一段代码内容。
* 高亮：通常用于表示高亮内容。

#### 接口
区域具有以下接口：
* `get_child(index: number)`：获取区域指定索引的子区域。
* `get_child_position(index: number)`：获取区域相对于编辑器的位置。

## 功能设计
### 选区
选区是 MixEditor 中用于表示用户当前选中的内容。选区包含起始位置和结束位置，其都是一个数组，记录了光标在区块中的位置。

#### 光标位置的计算
光标会从区域开始，按照光标记录的索引，调用 `get_child` 方法，访问其子区域，直到到达倒数第二个索引时，调用 `get_child_position` 方法，获取其相对于编辑器的位置。
