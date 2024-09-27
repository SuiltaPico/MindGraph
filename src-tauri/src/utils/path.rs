use std::path::PathBuf;
use dirs::data_dir;

pub fn get_app_path() -> PathBuf {
  let mut app_path =
    data_dir().expect("[错误] 无法找到 data_dir，该应用可能暂不支持您的操作系统。");
  app_path.push("MindGraph");
  app_path
}