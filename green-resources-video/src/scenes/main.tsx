import {makeScene2D, Layout, Img} from '@motion-canvas/2d';
import {createRef, all} from '@motion-canvas/core';
import {showSubtitles} from '../utils/subtitle';
import {VideoScript} from '../data/VideoScript';

export default makeScene2D(function* (view) {
  const imgRef = createRef<Img>();

  // 预先添加图片（初始透明）
  view.add(
    <Img 
      ref={imgRef} 
      src={'/imgs/project-icon.png'} 
      scale={0.5}
      position={[0, -100]}
      opacity={0}
    />
  );

  // 字幕脚本数组（前10句话）
  const subtitles: VideoScript[] = [
    { 
      text: '我是一只仓鼠',
      callback: function* () {
        // 淡入显示图片（不阻塞，与字幕同时显示）
        yield* imgRef().opacity(1, 1);
      }
    },
    { text: '准确的说，我是一只专业的赛博仓鼠' },
    { text: '多年来，我一直保持着仓鼠的优良传统' },
    { text: '————收集资源' },
    { text: '当然了，和一般的仓鼠不一样，我喜欢的种子并不是松树上长出来的' },
    { text: '为了这些食物，我每天都会孤独而深沉地穿梭于互联网的各个角落' },
    { text: '游戏、漫画、电影、小说、音声' },
    { text: '无论任何类型的资源都会被我收入囊中' },
    { text: '只要是被我盯到的猎物，没有能逃离我的手掌心的' },
    { text: '从4TB移动硬盘开始……到16TB企业级硬盘盒……再到36TB的raid硬盘柜……最后是72TB的nas，我已经历许多' }
  ];

  // 使用封装好的字幕显示函数
  yield* showSubtitles(view, subtitles);
});
