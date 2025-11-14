import {makeScene2D, Layout} from '@motion-canvas/2d';
import {createMouseRef, Mouse} from '../nodes/Mouse';
import {showSubtitles} from '../utils/subtitle';
import {createMainSubtitles, getProgressSegments} from '../data/mainSubtitles';

export default makeScene2D(function* (view) {
  // 创建鼠标引用
  // const mouse = createMouseRef();
  // view.add(<Mouse refs={mouse} fill={'#000000'} x={200} y={-160} />);

  // 创建字幕数组（从数据文件导入，callback 在数据文件中定义）
  const subtitles = createMainSubtitles(view);

  // 获取进度条分段配置
  const progressSegments = getProgressSegments(subtitles.length);

  // 使用封装好的字幕显示函数，启用进度条
  yield* showSubtitles(view, subtitles, {
    showProgressBar: true,
    progressSegments: progressSegments,
  });
});
