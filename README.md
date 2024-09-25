# MindGraph

基于有向无环图的知识库。

## 准备
1. 通过 `rustc -V` 检查当前 Rust 版本。当前开发环境使用
    `rustc 1.80.1 (3f5fd8dd4 2024-08-06)`。如果你没有安装 Rust，请前往
    https://www.rust-lang.org/zh-CN/tools/install 按照官方指示步骤进行安装。

2. 通过 `node -v` 检查当前 Node.js 版本。当前开发环境使用 `node v22.3.0`。如果你没有安装 Node.js，请前往
    https://nodejs.org/en/download 按照官方指示步骤进行安装。

3. 如果你使用的是 Windows 系统，请确保 cmake 处于环境变量 PATH 中。

## 开发
3. 执行 `pnpm i` 安装依赖。
4. 执行 `pnpm tauri dev` 启动开发环境。
## 构建

### 桌面

#### 当前平台

执行 `pnpm tauri build` 进行构建。

### 安卓

1. 确保你已经在你的开发环境中安装了 Android SDK 和 Android NDK。你可以通过
   Android Studio 或者直接从
   [Android 开发者官网](https://developer.android.com/studio) 下载。
2. 确保环境变量 `ANDROID_HOME` 指向 Android SDK 根目录，确保环境变量 `NDK_HOME`
   指向 Android NDK 根目录，
3. 执行 `pnpm build:android` 进行构建，此构建过程生成的安装包仅支持
   aarch64（ARM64）架构。

## 推荐 IDE 配置

- [VS Code](https://code.visualstudio.com/) +
  [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) +
  [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
