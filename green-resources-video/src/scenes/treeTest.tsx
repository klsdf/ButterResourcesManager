import {
  Line,
  makeScene2D,
  Rect,
  Txt,
} from '@motion-canvas/2d';
import {
  all,
  createRefMap,
  easeOutCubic,
  noop,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';

// 主题颜色配置
const theme = {
  bg: '#1a1a1a',
  bgDark: '#0d0d0d',
  stroke: '#ffffff',
  window: '#4CAF50',
  text: '#ffffff',
  radius: 8,
};

// 简化的节点接口（移除 animation）
interface PartialGraphNode {
  key?: string;
  label: string;
  children?: Record<string, PartialGraphNode>;
}

interface GraphNode {
  key: string;
  label: string;
  children?: GraphNode[];
  parent?: GraphNode;
}

// 定义树形结构数据
const ROOT: PartialGraphNode = {
  key: 'root',
  label: '根节点',
  children: {
    branch1: {
      label: '分支1',
      children: {
        leaf1: {
          label: '叶子1',
        },
        leaf2: {
          label: '叶子2',
        },
      },
    },
    branch2: {
      label: '分支2',
      children: {
        leaf3: {
          label: '叶子3',
        },
        leaf4: {
          label: '叶子4',
        },
      },
    },
    branch3: {
      label: '分支3',
    },
  },
};

// 将 PartialGraphNode 转换为 GraphNode[]
const NODES: GraphNode[] = [];
const queue: any[] = [ROOT];
while (queue.length > 0) {
  const node = queue.shift();
  NODES.push(node);
  if (node.children) {
    let children = [];
    for (const [key, value] of Object.entries(node.children)) {
      const child = value as GraphNode;
      children.push(child);
      child.key = key;
      child.parent = node;
      queue.push(child);
    }
    node.children = children;
  }
}

export default makeScene2D(function* (view) {
  view.fill(theme.bgDark);

  const refs = createRefMap<Rect>();
  const arrows = createRefMap<Line>();

  // 使用广度优先遍历创建树形结构
  let queue: GraphNode[] = [NODES[0]];
  let row = 0;
  while (queue.length > 0) {
    const nodes = queue;
    queue = [];
    let column = 0;
    
    for (const node of nodes) {
      if (node.children) {
        queue.push(...node.children);
      }

      // 计算节点位置
      let offset = 120;
      let ratio = (column - (nodes.length - 1) / 2) / 5;
      if (row === 1) {
        offset = 60;
        ratio = column === 0 ? -0.2 : column === 1 ? 0.2 : 0;
      }
      if (row === 2) {
        offset = 40;
      }

      // 创建节点
      view.add(
        <Rect
          ref={refs[node.key]}
          x={ratio * view.width()}
          y={row * (120 + 140) - view.height() / 2 + offset + 40}
          fill={theme.bg}
          radius={theme.radius}
          layout
          scale={0.9}
          opacity={0}
          strokeFirst
          stroke={theme.window}
          direction={'column'}
          alignItems={'center'}
          justifyContent={'center'}
          padding={20}
        >
          <Txt
            text={node.label}
            fontSize={28}
            fill={theme.text}
            fontFamily="Microsoft YaHei, sans-serif"
            textAlign={'center'}
          />
        </Rect>,
      );

      // 如果有父节点，创建连线
      if (node.parent) {
        const parent = refs[node.parent.key]();
        const child = refs[node.key]();
        let offset = 60;
        if (row === 2) {
          offset = 100;
        }
        
        view.add(
          <Line
            ref={arrows[node.key]}
            lineWidth={6}
            stroke={theme.stroke}
            radius={8}
            startOffset={10}
            endOffset={10}
            endArrow
            end={0}
            opacity={0}
            points={[
              parent.bottom,
              () => parent.bottom().addY(offset),
              () => [child.top().x, parent.bottom().y + offset],
              child.top,
            ]}
          />,
        );
      }

      column++;
    }
    row++;
  }

  // 等待开始
  yield* waitUntil('start');

  // 依次显示节点和连线
  yield* sequence(
    0.1,
    ...NODES.map(({key}) =>
      all(
        refs[key]().opacity(1, 0.6, easeOutCubic),
        refs[key]().scale(1, 0.6, easeOutCubic),
        arrows[key]()?.opacity(1, 0.6) ?? noop(),
        arrows[key]()?.end(1, 0.6, easeOutCubic) ?? noop(),
      ),
    ),
  );

  yield* waitUntil('end');

  // 让叶子1的文本颜色变成红色
  const leaf1Rect = refs['leaf1']();
  const leaf1Text = leaf1Rect.childAs<Txt>(0);
  yield* leaf1Text.fill('#FF0000', 0.6);
  
  yield* waitFor(1);
});

