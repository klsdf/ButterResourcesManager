import { Layout, Img, Txt, Rect, Node } from '@motion-canvas/2d';
import { createRef, all, ThreadGenerator, waitFor } from '@motion-canvas/core';
import VideoPostion from './VideoPostion';

/**
 * 让任意节点移动到目标位置，同时淡入
 * @param nodeRef 节点引用（可以是 Img、Txt、Rect、Layout 等任意 Node 类型）
 * @param view 场景视图引用（用于获取屏幕尺寸，当前未使用但保留以备扩展）
 * @param targetPosition 目标位置 [x, y]
 * @param duration 动画持续时间（秒），默认1秒
 * @returns ThreadGenerator 可以 yield* 来等待动画完成
 */
export function* moveAndShow<T extends Node>(
	nodeRef: ReturnType<typeof createRef<T>>,
	view: Layout,
	targetPosition: [number, number],
	duration: number = 1
): ThreadGenerator {
	// 从屏幕下方移动到目标位置，同时淡入
	yield* all(
		nodeRef().position(targetPosition, duration), // 移动到目标位置
		nodeRef().opacity(1, duration) // 同时淡入
	);
}



/**
 * 淡入节点列表
 * @param nodeRefs 节点引用数组
 * @returns ThreadGenerator 可以 yield* 来等待动画完成
 */
export function* fadeInNodes<T extends Node>(
	nodeRefs: ReturnType<typeof createRef<T>>[]
): ThreadGenerator {
	// 文本依次淡入
	for (let i = 0; i < nodeRefs.length; i++) {
		yield* nodeRefs[i]().opacity(1, 0.5);
	}
}

/**
 * 让节点列表像被黑洞吸走一样，旋转缩小移动到目标位置
 * 注意：节点应该已经在场景根层级（不在 Layout 容器中），否则无法自由移动
 * @param nodeRefs 节点引用数组
 * @param targetRef 目标节点引用（黑洞中心）
 * @param duration 动画持续时间（秒），默认1.5秒
 * @param rotationSpeed 旋转速度（圈数），默认3圈
 * @returns ThreadGenerator 可以 yield* 来等待动画完成
 */
export function* blackHoleEffect<T extends Node>(
	nodeRefs: ReturnType<typeof createRef<T>>[],
	targetRef: ReturnType<typeof createRef<Node>>,
	duration: number = 1.5,
	rotationSpeed: number = 3
): ThreadGenerator {
	// 获取目标节点的绝对位置
	const targetNode = targetRef();
	const targetAbsolutePos = targetNode.absolutePosition();
	
	// 等待一帧，确保位置计算完成
	yield* waitFor(0);
	
	// 为每个节点创建动画生成器函数
	const animations: ThreadGenerator[] = nodeRefs.map((nodeRef, index) => {
		// 添加随机延迟，让效果更自然（0-0.2秒的随机延迟）
		const delay = (index / nodeRefs.length) * 0.2;
		
		return (function* (): ThreadGenerator {
			// 等待延迟
			if (delay > 0) {
				yield* waitFor(delay);
			}
			
			const node = nodeRef();
			
			// 同时执行：旋转、缩放、移动、淡出
			// 节点应该在场景根层级，可以直接使用绝对位置
			yield* all(
				node.rotation(node.rotation() + rotationSpeed * 360, duration), // 旋转
				node.scale(0, duration), // 缩小到0
				node.absolutePosition(targetAbsolutePos, duration), // 移动到目标位置（绝对位置）
				node.opacity(0, duration * 0.8) // 在接近时淡出（提前一点淡出）
			);
		})();
	});
	
	// 同时执行所有节点的动画
	yield* all(...animations);
}

/**
 * 持久关键词容器引用（用于跨字幕保持显示）
 * 使用 WeakMap 来为每个 view 创建独立的容器
 */
const persistentKeywordsContainers = new WeakMap<Layout, ReturnType<typeof createRef<Layout>>>();
const keywordRefs = new WeakMap<Layout, Map<string, {
	layoutRef: ReturnType<typeof createRef<Layout>>;
	titleRef: ReturnType<typeof createRef<Txt>>;
	contentRef: ReturnType<typeof createRef<Txt>>;
}>>();

/**
 * 在屏幕顶部显示持久关键词（不会消失）
 * 支持标题和内容两种样式，标题字体大，内容字体小，都在同一个框内
 * @param view 场景视图引用
 * @param keyword 要添加的关键词（标题）
 * @param content 可选的内容文本（小字体）
 * @returns ThreadGenerator 可以 yield* 来等待动画完成
 */
export function* showPersistentKeyword(
	view: Layout,
	keyword: string,
	content?: string
): ThreadGenerator {
	// 获取或创建主容器引用
	let containerRef = persistentKeywordsContainers.get(view);
	
	// 如果容器不存在，创建容器
	if (!containerRef) {
		containerRef = createRef<Layout>();
		persistentKeywordsContainers.set(view, containerRef);
		
		const container = (
			<Layout
				ref={containerRef}
				layout
				direction="column"
				alignItems="center"
				justifyContent="center"
				position={() => VideoPostion.innerTopCenter(view)}
				opacity={1}
				zIndex={200}
				gap={20}
			/>
		);
		view.add(container);
	}

	// 获取或创建关键词引用映射
	let keywordMap = keywordRefs.get(view);
	if (!keywordMap) {
		keywordMap = new Map();
		keywordRefs.set(view, keywordMap);
	}

	// 检查是否已存在该关键词
	const existingRefs = keywordMap.get(keyword);
	
	if (existingRefs) {
		// 如果已存在，更新内容
		if (content) {
			// 如果内容文本组件不存在，需要创建它
			const rect = existingRefs.layoutRef().children()[0] as Rect;
			if (!existingRefs.contentRef || rect.children().length === 1) {
				// 创建内容文本组件
				const contentTxt = (
					<Txt
						ref={existingRefs.contentRef}
						text=""
						fontSize={32}
						fill="#ffffff"
						fontFamily="Microsoft YaHei, sans-serif"
						textAlign="center"
						fontWeight={400}
						opacity={0.9}
					/>
				);
				rect.add(contentTxt);
			}
			// 打字机效果：逐字显示
			yield* typewriterEffect(existingRefs.contentRef, content);
		}
		// 淡入动画（如果之前是隐藏的）
		if (existingRefs.layoutRef().opacity() < 1) {
			yield* existingRefs.layoutRef().opacity(1, 0.5);
		}
	} else {
		// 创建新的关键词容器（包含标题和内容）
		const keywordLayoutRef = createRef<Layout>();
		const titleRef = createRef<Txt>();
		const contentRef = createRef<Txt>();
		
		const keywordContainer = (
			<Layout
				ref={keywordLayoutRef}
				layout
				direction="column"
				alignItems="center"
				justifyContent="center"
				opacity={0}
				gap={12}
			>
				<Rect
					fill="#000000"
					opacity={0.7}
					radius={8}
					padding={[20, 30]}
					layout
					direction="column"
					gap={12}
				>
					{/* 标题 - 大字体 */}
					<Txt
						ref={titleRef}
						text={keyword}
						fontSize={48}
						fill="#ffffff"
						fontFamily="Microsoft YaHei, sans-serif"
						textAlign="center"
						fontWeight={700}
					/>
					{/* 内容 - 小字体（如果提供） */}
					{content && (
						<Txt
							ref={contentRef}
							text=""
							fontSize={32}
							fill="#ffffff"
							fontFamily="Microsoft YaHei, sans-serif"
							textAlign="center"
							fontWeight={400}
							opacity={0.9}
						/>
					)}
				</Rect>
			</Layout>
		);

		containerRef().add(keywordContainer);
		
		// 保存引用
		keywordMap.set(keyword, {
			layoutRef: keywordLayoutRef,
			titleRef: titleRef,
			contentRef: contentRef,
		});

		// 淡入动画
		yield* keywordLayoutRef().opacity(1, 0.5);
		
		// 如果有内容，使用打字机效果显示
		if (content && contentRef) {
			yield* typewriterEffect(contentRef, content);
		}
	}
}

/**
 * 清除所有持久关键词（淡出并删除）
 * @param view 场景视图引用
 * @param duration 淡出持续时间（秒），默认 0.5
 * @returns ThreadGenerator 可以 yield* 来等待动画完成
 */
export function* clearPersistentKeywords(
	view: Layout,
	duration: number = 0.5
): ThreadGenerator {
	const containerRef = persistentKeywordsContainers.get(view);
	const keywordMap = keywordRefs.get(view);
	
	if (!containerRef || !keywordMap) {
		return; // 如果没有关键词，直接返回
	}
	
	// 淡出所有关键词
	const fadeOutAnimations: ThreadGenerator[] = [];
	for (const refs of keywordMap.values()) {
		fadeOutAnimations.push(refs.layoutRef().opacity(0, duration));
	}
	
	// 同时淡出所有关键词
	if (fadeOutAnimations.length > 0) {
		yield* all(...fadeOutAnimations);
	}
	
	// 移除所有关键词元素
	for (const refs of keywordMap.values()) {
		refs.layoutRef().remove();
	}
	
	// 清理引用映射
	keywordMap.clear();
	
	// 移除容器（如果存在）
	if (containerRef) {
		containerRef().remove();
		persistentKeywordsContainers.delete(view);
		keywordRefs.delete(view);
	}
}

/**
 * 打字机效果：逐字显示文本
 * @param textRef 文本引用
 * @param text 要显示的完整文本
 * @param charsPerSecond 每秒显示的字符数，默认 15
 * @returns ThreadGenerator
 */
function* typewriterEffect(
	textRef: ReturnType<typeof createRef<Txt>>,
	text: string,
	charsPerSecond: number = 15
): ThreadGenerator {
	const delay = 1 / charsPerSecond; // 每个字符之间的延迟
	
	for (let i = 0; i <= text.length; i++) {
		textRef().text(text.substring(0, i));
		if (i < text.length) {
			yield* waitFor(delay);
		}
	}
}

