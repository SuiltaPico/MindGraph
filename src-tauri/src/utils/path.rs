use dirs::data_dir;
use std::path::PathBuf;

pub fn get_app_path() -> PathBuf {
  let mut app_path =
    data_dir().expect("[错误] 无法找到 data_dir，该应用可能暂不支持您的操作系统。");
  app_path.push("MindGraph");
  app_path
}


pub fn parse_uri(uri: String) -> Result<String, Box<dyn std::error::Error>> {
  if uri.starts_with("file://") {
    Ok(uri.replace("file://", ""))
  } else if uri.starts_with("mindgraph://") {
    match uri.as_str() {
      "mindgraph://new" => Ok(
        get_app_path()
          .join("data/temp/new.mg")
          .to_str()
          .unwrap()
          .to_string(),
      ),
      _ => Err(Box::new(std::io::Error::new(
        std::io::ErrorKind::InvalidInput,
        format!("Invalid uri: {}", uri),
      ))),
    }
  } else {
    Err(Box::new(std::io::Error::new(
      std::io::ErrorKind::InvalidInput,
      format!("Invalid uri: {}", uri),
    )))
  }
}