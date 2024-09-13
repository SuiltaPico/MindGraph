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
        <div class="openfile">
          <div class="indicatrix" />
          <i class="fa-solid fa-folder-open" style={{ color: "gray" }} />
          <div class="word">
            <div class="subtitle">打开文件</div>
            <div class="description">
              打开一个文件夹或者文件来查看与制作思维导图
            </div>
          </div>
        </div>
        <div class="openfile">
          <div class="indicatrix" />
          <i
            class="fa-solid fa-folder-open"
            style={{ color: "gray", "justify-items": "center" }}
          />
          <div class="word">
            <div class="subtitle">打开文件</div>
            <div class="description">
              打开一个文件夹或者文件来查看与制作思维导图
            </div>
          </div>
        </div>
        <div class="openfile">
          <div class="indicatrix" />
          <i
            class="fa-solid fa-folder-open"
            style={{ color: "gray", "justify-items": "center" }}
          />
          <div class="word">
            <div class="subtitle">打开文件</div>
            <div class="description">
              打开一个文件夹或者文件来查看与制作思维导图
            </div>
          </div>
        </div>
      </div>
      {/* <div class="zone2">
        <div class="filegraph"></div>
      </div> */}
      <div class="copyright">Present by Suilta Pico & Aflocat --2024</div>
    </div>
  );
}
