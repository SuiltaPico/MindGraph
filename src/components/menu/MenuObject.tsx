import "./MenuObject.css";
import "@fortawesome/fontawesome-free/css/all.css";
export default function MenuObject() {
  /**
   * 哈哈，可能会用来加载文件的函数
   * @returns
   */
  function loadFile() {
    return;
  }

  /**
   * 噢噢，可能会用来新建文件的函数
   * @returns
   */
  function newFile() {
    return;
  }
  //   ...
  return (
    <div class="menu">
      {/* 大标题 */}
      <div class="title">MindGraph</div>
      <div class="menuobjectzone1">
        <div class="openfile leftline">
          <i class="fa-solid fa-folder-open icon" style={{ color: "gray" }} />
          <div class="word">
            <div class="subtitle">打开文件</div>
            <div class="description">
              打开一个文件夹或者文件来查看与制作思维导图
            </div>
          </div>
        </div>
        <div class="openfile leftline">
          <i
            class="fa-solid fa-folder-open icon"
            style={{ color: "gray", "justify-items": "center" }}
          />
          <div class="word">
            <div class="subtitle">打开文件</div>
            <div class="description">
              打开一个文件夹或者文件来查看与制作思维导图
            </div>
          </div>
        </div>
        <div class="openfile leftline">
          <i
            class="fa-solid fa-gear icon"
            style={{ color: "gray", "justify-items": "center" }}
          />
          <div class="word">
            <div class="subtitle">设置</div>
            <div class="description">
              更改设置，选择偏好项
            </div>
          </div>
        </div>
      </div>
      <div class="menuobjectzone2">
        <div class="filegraph leftline">
            <div class="filetop">当前文档</div>
        </div>
      </div>
      <div class="copyright">
        v0.1.0 | Present by Suilta Pico & Aflocat | 2024
      </div>
    </div>
  );
}
