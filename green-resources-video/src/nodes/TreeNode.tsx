import { Rect, RectProps, Txt, Line, Layout } from '@motion-canvas/2d';
import {
  makeRef,
  makeRefs,
  createRefMap,
  Vector2,
} from '@motion-canvas/core';

// 节点数据结构
export interface TreeNodeData {
  key: string;
  label: string;
  children?: TreeNodeData[];
  parent?: TreeNodeData;
}

// 主题配置
export interface TreeNodeTheme {
  bg?: string;
  stroke?: string;
  text?: string;
  radius?: number;
  fontSize?: number;
}

const defaultTheme: Required<TreeNodeTheme> = {
  bg: '#1a1a1a',
  stroke: '#4CAF50',
  text: '#ffffff',
  radius: 8,
  fontSize: 28,
};

// 布局配置
export interface TreeNodeLayout {
  rowSpacing?: number; // 行间距
  columnSpacing?: number; // 列间距
  horizontalSpacing?: number; // 横向排列时的间距
  verticalOffset?: number; // 垂直偏移
}

const defaultLayout: Required<TreeNodeLayout> = {
  rowSpacing: 200,
  columnSpacing: 180,
  horizontalSpacing: 180,
  verticalOffset: 0,
};

// 引用类型
export interface TreeNodeRefs {
  nodeRefs: ReturnType<typeof createRefMap<Rect>>;
  arrowRefs: ReturnType<typeof createRefMap<Line>>;
  nodes: TreeNodeData[];
}

/**
 * 创建树形节点引用
 */
export function createTreeNodeRefs() {
  return {
    nodeRefs: createRefMap<Rect>(),
    arrowRefs: createRefMap<Line>(),
    nodes: [] as TreeNodeData[],
  };
}

/**
 * 将嵌套对象结构转换为扁平数组结构
 */
export function convertToTreeNodes(
  root: {
    key?: string;
    label: string;
    children?: Record<string, any>;
  },
  parent?: TreeNodeData
): TreeNodeData[] {
  const nodes: TreeNodeData[] = [];
  const queue: any[] = [{ ...root, parent }];
  
  while (queue.length > 0) {
    const node = queue.shift();
    const treeNode: TreeNodeData = {
      key: node.key || node.label,
      label: node.label,
      parent: node.parent,
    };
    nodes.push(treeNode);
    
    if (node.children) {
      const children: TreeNodeData[] = [];
      if (Array.isArray(node.children)) {
        // 数组形式
        for (const child of node.children) {
          const childNode = {
            ...child,
            key: child.key || child.label,
            parent: treeNode,
          };
          children.push(childNode);
          queue.push(childNode);
        }
      } else {
        // 对象形式
        for (const [key, value] of Object.entries(node.children)) {
          const childNode = {
            ...(value as any),
            key: key,
            parent: treeNode,
          };
          children.push(childNode);
          queue.push(childNode);
        }
      }
      treeNode.children = children;
    }
  }
  
  return nodes;
}

/**
 * 树形节点组件
 */
export function TreeNode({
  refs,
  root,
  view,
  theme = {},
  layout,
  showArrows = true,
  zIndex,
}: {
  refs: TreeNodeRefs;
  root: {
    key?: string;
    label: string;
    children?: Record<string, any> | any[];
  };
  view: Layout;
  theme?: TreeNodeTheme;
  layout?: TreeNodeLayout;
  showArrows?: boolean;
  zIndex?: number;
}): null {
  const finalTheme = { ...defaultTheme, ...theme };
  const finalLayout: Required<TreeNodeLayout> = { ...defaultLayout, ...(layout || {}) };
  
  // 转换节点数据
  const nodes = convertToTreeNodes(root);
  refs.nodes = nodes;
  
  // 使用广度优先遍历创建树形结构
  let queue: TreeNodeData[] = [nodes[0]];
  let row = 0;
  
  while (queue.length > 0) {
    const currentLevelNodes = queue;
    queue = [];
    let column = 0;
    
    for (const node of currentLevelNodes) {
      if (node.children) {
        queue.push(...node.children);
      }
      
      // 计算节点位置
      const x = (column - (currentLevelNodes.length - 1) / 2) * finalLayout.columnSpacing;
      const y = row * finalLayout.rowSpacing - view.height() / 2 + finalLayout.verticalOffset + 150;
      
      // 创建节点
      view.add(
        <Rect
          ref={refs.nodeRefs[node.key]}
          x={x}
          y={y}
          fill={finalTheme.bg}
          radius={finalTheme.radius}
          layout
          scale={0.9}
          opacity={0}
          strokeFirst
          stroke={finalTheme.stroke}
          lineWidth={2}
          direction="column"
          alignItems="center"
          justifyContent="center"
          padding={20}
          zIndex={zIndex}
        >
          <Txt
            text={node.label}
            fontSize={finalTheme.fontSize}
            fill={finalTheme.text}
            fontFamily="Microsoft YaHei, sans-serif"
            textAlign="center"
          />
        </Rect>
      );
      
      // 如果有父节点，创建连线
      if (node.parent && showArrows) {
        const parentRef = refs.nodeRefs[node.parent.key];
        const childRef = refs.nodeRefs[node.key];
        
        view.add(
          <Line
            ref={refs.arrowRefs[node.key]}
            lineWidth={6}
            stroke="#ffffff"
            radius={8}
            startOffset={10}
            endOffset={10}
            endArrow
            end={0}
            opacity={0}
            points={[
              () => parentRef().bottom(),
              () => parentRef().bottom().addY(60),
              () => [childRef().top().x, parentRef().bottom().y + 60],
              () => childRef().top(),
            ]}
          />
        );
      }
      
      column++;
    }
    row++;
  }
  
  return null;
}

/**
 * 创建横向排列的简单树形结构（根节点 + 子节点横向排列）
 * 可以分步创建：先创建根节点，再创建子节点
 */
export function createHorizontalTree({
  refs,
  rootLabel,
  childrenLabels = [],
  view,
  rootPosition,
  childrenPosition,
  theme = {},
  createRoot = true,
  createChildren = true,
  zIndex,
}: {
  refs: TreeNodeRefs;
  rootLabel: string;
  childrenLabels?: string[];
  view: Layout;
  rootPosition: () => [number, number];
  childrenPosition: (index: number, total: number) => [number, number];
  theme?: TreeNodeTheme;
  createRoot?: boolean;
  createChildren?: boolean;
  zIndex?: number;
}) {
  const finalTheme = { ...defaultTheme, ...theme };
  
  // 创建根节点
  if (createRoot) {
    const rootNode: TreeNodeData = {
      key: 'root',
      label: rootLabel,
    };
    if (!refs.nodes.find(n => n.key === 'root')) {
      refs.nodes.push(rootNode);
    }
    
    view.add(
      <Rect
        ref={refs.nodeRefs['root']}
        position={rootPosition}
        fill={finalTheme.bg}
        radius={finalTheme.radius}
        layout
        direction="column"
        alignItems="center"
        justifyContent="center"
        padding={20}
        stroke={finalTheme.stroke}
        strokeFirst
        lineWidth={2}
        scale={0.9}
        opacity={0}
        zIndex={zIndex}
      >
        <Txt
          text={rootLabel}
          fontSize={finalTheme.fontSize}
          fill={finalTheme.text}
          fontFamily="Microsoft YaHei, sans-serif"
          textAlign="center"
        />
      </Rect>
    );
  }
  
  // 创建子节点
  if (createChildren && childrenLabels.length > 0) {
    childrenLabels.forEach((label, index) => {
      const key = `child_${index}`;
      const existingNode = refs.nodes.find(n => n.key === key);
      if (!existingNode) {
        const childNode: TreeNodeData = {
          key,
          label,
          parent: refs.nodes.find(n => n.key === 'root'),
        };
        refs.nodes.push(childNode);
        
        view.add(
          <Rect
            ref={refs.nodeRefs[key]}
            position={() => childrenPosition(index, childrenLabels.length)}
            fill={finalTheme.bg}
            radius={finalTheme.radius}
            layout
            direction="column"
            alignItems="center"
            justifyContent="center"
            padding={20}
            stroke={finalTheme.stroke}
            strokeFirst
            lineWidth={2}
            scale={0.9}
            opacity={0}
            zIndex={zIndex}
          >
            <Txt
              text={label}
              fontSize={finalTheme.fontSize}
              fill={finalTheme.text}
              fontFamily="Microsoft YaHei, sans-serif"
              textAlign="center"
            />
          </Rect>
        );
      }
    });
  }
  
  return refs;
}

