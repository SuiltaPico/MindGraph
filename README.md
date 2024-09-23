# MindGraph

基于有向无环图的知识库。

## 开发

1. 通过 `rustc -V` 检查当前 Rust 版本。当前开发环境使用
    `rustc 1.80.1 (3f5fd8dd4 2024-08-06)`。如果你没有安装 Rust，请前往
    https://www.rust-lang.org/zh-CN/tools/install 按照官方指示步骤进行安装。

2. 通过 `node -v` 检查当前 Node.js 版本。当前开发环境使用 `node v22.3.0`。如果你没有安装 Node.js，请前往
    https://nodejs.org/en/download 按照官方指示步骤进行安装。

3. 执行 `pnpm i` 安装依赖。
4. 执行 `pnpm tauri dev` 启动开发环境。
## 构建

1. 执行 `pnpm tauri build` 进行构建。

## 推荐 IDE 配置

- [VS Code](https://code.visualstudio.com/) +
  [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) +
  [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
