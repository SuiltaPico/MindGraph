// https://github.com/tauri-apps/tauri/discussions/6425#discussioncomment-5280064
import { exec } from "child_process";

let cmd = "upx -9 src-tauri/target/release/mind-graph";

if (process.platform === "win32") {
  cmd += ".exe";
}

exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error("[upx.js]", err);
    return;
  }
  console.log(`[upx.js] stdout: ${stdout}`);
  console.error(`[upx.js] stderr: ${stderr}`);
});
