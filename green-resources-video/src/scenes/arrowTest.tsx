import {
  makeScene2D,
  Node,
  Ray,
  RayProps,
  Rect,
  Txt,
} from '@motion-canvas/2d';
import {
  all,
  createRefMap,
  easeOutCubic,
  Vector2,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';

// 主题颜色配置
const theme = {
  center: '#4CAF50',      // 中心节点颜色（绿色）
  branch1: '#2196F3',     // 分支1颜色（蓝色）
  branch2: '#FF9800',     // 分支2颜色（橙色）
  branch3: '#9C27B0',     // 分支3颜色（紫色）
  branch4: '#F44336',     // 分支4颜色（红色）
  stroke: '#ffffff',      // 箭头颜色
  bg: '#1a1a1a',          // 背景色
  text: '#ffffff',        // 文字颜色
};

// Arrow 组件：用于在两个节点之间绘制箭头
function Arrow({
  fromNode,
  toNode,
  ...props
}: RayProps & {fromNode: Node; toNode: Node}) {
  const ray = (
    <Ray
      from={fromNode.position}
      to={toNode.position}
      lineWidth={4}
      stroke={theme.stroke}
      {...props}
    />
  ) as Ray;
  
  // 添加箭头标记
  ray.add(
    ray.reactiveClone({
      to: () => Vector2.lerp(fromNode.position(), toNode.position(), 0.57),
      position: 0,
      endArrow: true,
    }),
  );

  return ray;
}

// 创建思维导图节点组件
function MindMapNode({
  text,
  color,
  size = [200, 80],
  ...props
}: {
  text: string;
  color: string;
  size?: [number, number];
} & any) {
  return (
    <Rect
      width={size[0]}
      height={size[1]}
      fill={color}
      radius={8}
      stroke={theme.stroke}
      lineWidth={2}
      {...props}
    >
      <Txt
        text={text}
        fontSize={32}
        fill={theme.text}
        fontFamily="Microsoft YaHei, sans-serif"
        textAlign="center"
      />
    </Rect>
  );
}

export default makeScene2D(function* (view) {
  view.fill(theme.bg);

  // 创建节点引用
  const nodes = createRefMap<Rect>();
  const arrows = createRefMap<Ray>();

  // 创建思维导图
  view.add(
    <Node>
      {/* 中心节点 */}
      <MindMapNode
        ref={nodes.center}
        text="思维导图"
        color={theme.center}
        size={[250, 100]}
        position={[0, 0]}
      />

      {/* 分支节点1 - 上方 */}
      <MindMapNode
        ref={nodes.branch1}
        text="分支主题1"
        color={theme.branch1}
        position={[0, -200]}
        opacity={0}
      />

      {/* 分支节点2 - 右方 */}
      <MindMapNode
        ref={nodes.branch2}
        text="分支主题2"
        color={theme.branch2}
        position={[300, 0]}
        opacity={0}
      />

      {/* 分支节点3 - 下方 */}
      <MindMapNode
        ref={nodes.branch3}
        text="分支主题3"
        color={theme.branch3}
        position={[0, 200]}
        opacity={0}
      />

      {/* 分支节点4 - 左方 */}
      <MindMapNode
        ref={nodes.branch4}
        text="分支主题4"
        color={theme.branch4}
        position={[-300, 0]}
        opacity={0}
      />

      {/* 箭头连接 */}
      <Arrow
        ref={arrows.arrow1}
        fromNode={nodes.center()}
        toNode={nodes.branch1()}
        end={0}
        opacity={0}
      />
      <Arrow
        ref={arrows.arrow2}
        fromNode={nodes.center()}
        toNode={nodes.branch2()}
        end={0}
        opacity={0}
      />
      <Arrow
        ref={arrows.arrow3}
        fromNode={nodes.center()}
        toNode={nodes.branch3()}
        end={0}
        opacity={0}
      />
      <Arrow
        ref={arrows.arrow4}
        fromNode={nodes.center()}
        toNode={nodes.branch4()}
        end={0}
        opacity={0}
      />
    </Node>,
  );

  // 等待开始
  yield* waitUntil('start');

  // 显示中心节点
  yield* nodes.center().scale(0, 0).to(1, 0.5, easeOutCubic);

  // 依次显示分支节点和箭头
  yield* waitUntil('branch1');
  yield* all(
    nodes.branch1().opacity(1, 0.3),
    arrows.arrow1().opacity(1, 0.3),
    arrows.arrow1().end(1, 0.5, easeOutCubic),
  );

  yield* waitUntil('branch2');
  yield* all(
    nodes.branch2().opacity(1, 0.3),
    arrows.arrow2().opacity(1, 0.3),
    arrows.arrow2().end(1, 0.5, easeOutCubic),
  );

  yield* waitUntil('branch3');
  yield* all(
    nodes.branch3().opacity(1, 0.3),
    arrows.arrow3().opacity(1, 0.3),
    arrows.arrow3().end(1, 0.5, easeOutCubic),
  );

  yield* waitUntil('branch4');
  yield* all(
    nodes.branch4().opacity(1, 0.3),
    arrows.arrow4().opacity(1, 0.3),
    arrows.arrow4().end(1, 0.5, easeOutCubic),
  );

  yield* waitUntil('end');
  yield* waitFor(1);
});

