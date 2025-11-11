import { Layout, Rect, Txt } from '@motion-canvas/2d';
import { createRef, ThreadGenerator, tween, linear } from '@motion-canvas/core';


/**
 * 我期望实现的效果是：
 * 不同区块的进度条底色
 * 真正的进度条随着时间推移，从左向右0%到100%
 * 文本始终浮在各个区块最上方
 * 
 */

export interface ProgressSegment {
	title: string;
	startIndex: number;
	endIndex: number;
	color?: string;
}

export interface ProgressBarOptions {
	segments: ProgressSegment[];
	totalItems: number;
	height?: number;                // 底部色块高度
	progressHeight?: number;        // 顶部进度条高度
	padding?: number;               // 容器内边距
	titleFontSize?: number;
	titleColor?: string;
	progressColor?: string;
	trackColor?: string;
	position?: 'top' | 'bottom';    // 整体位置
}

/**
 * 创建一个“分区色块 + 顶部进度条”的进度组件
 * view: 你主 Layout（场景）引用
 */
export function createSegmentedProgressBar(view: Layout, options: ProgressBarOptions) {
	const {
		segments,
		totalItems,
		height = 60,
		progressHeight = 8,
		padding = 16,
		titleFontSize = 18,
		titleColor = '#ffffff',
		progressColor = '#ff8a65',
		trackColor = '#333333',
		position = 'bottom',
	} = options;

	// 外层容器引用：包含整个进度条组件（进度条 + 分段色块）
	const containerRef = createRef<Layout>();
	
	// 分段区域Layout引用：包含所有分段色块，用于获取宽度和位置信息，确保进度条与分段区域对齐
	const segmentsLayoutRef = createRef<Layout>();
	
	// 进度条前景引用：显示当前进度的矩形，宽度会随着进度更新而从左到右增长
	const progressRef = createRef<Rect>();
	
	// 进度条背景轨道引用：进度条的背景轨道（当前已注释，未使用）
	const progressTrackRef = createRef<Rect>();
	
	// 标题文本引用数组：每个分段对应一个文本引用，用于动态更新分段标题
	const titleRefs = segments.map(() => createRef<Txt>());
	
	// 当前进度百分比（0-100）：存储当前进度百分比，用于计算进度条宽度和位置
	let progressPercent = 0;

	// 外层容器
	const component = (
		<Layout
			ref={containerRef}
			layout={false}
			width="100%"
			padding={padding}
			zIndex={200}
		>
			{/* 分段区域Layout - 作为参考宽度 */}
			<Layout 
				ref={segmentsLayoutRef}
				layout 
				direction="row" 
				width="100%" 
				height={height}
				position={() => [0, 0]}
			>
				{segments.map((seg, idx) => {
					const spanPercent = ((seg.endIndex - seg.startIndex + 1) / totalItems) * 100;
					return (
						<Rect
							fill={seg.color ?? '#666'}
							width={`${spanPercent}%`}
							height="100%"
							radius={8}
							layout
							alignItems="center"
							justifyContent="center"
						>
							<Txt
								ref={titleRefs[idx]}
								text={seg.title}
								fontSize={titleFontSize}
								fill={titleColor}
								fontFamily="Microsoft YaHei, sans-serif"
								textAlign="center"
								zIndex={300}
							/>
						</Rect>
					);
				})}
			</Layout>

			{/* 进度条背景轨道 - 使用与分段Layout相同的宽度和位置 */}
			{/*  
			<Rect
				ref={progressTrackRef}
				fill={trackColor}
				width={() => segmentsLayoutRef().width()}
				height={progressHeight}
				radius={progressHeight / 2}
				position={() => [
					segmentsLayoutRef().position.x(),
					-height / 2 - progressHeight / 2 - 4
				]}
				zIndex={150}
			/>
			*/}
			
			{/* 进度条前景 - 位置和高度与色块一样，从左到右增长 */}
			<Rect
				ref={progressRef}
				fill="#000000"
				opacity={0.5}
				width={0}
				height={height}
				radius={8}
				position={[0, 0]}
				zIndex={160}
			/>
		</Layout>
	);

	view.add(component);

	// 设置位置
	// 容器中心点：考虑padding和色块高度
	if (position === 'top') {
		containerRef().position.y(() => -view.height() / 2 + padding + height / 2);
	} else {
		containerRef().position.y(() => view.height() / 2 - padding - height / 2);
	}

	// 让进度条在整个动画过程中持续平滑增长
	// totalDuration: 整个动画的总时长（秒）
	const animateProgress = function* (totalDuration: number): ThreadGenerator {
		// 使用 tween 让进度条在整个时长内从0%平滑增长到100%
		// 每一帧都会更新进度条的宽度和位置，实现平滑的持续增长
		yield* tween(totalDuration, (value) => {
			// value 从 0 到 1，表示进度从 0% 到 100%
			// 获取分段Layout的宽度和位置
			const segmentsWidth = segmentsLayoutRef().width() || (containerRef().width() - padding * 2);
			const segmentsX = segmentsLayoutRef().position.x();
			const segmentsY = segmentsLayoutRef().position.y();
			
			// 计算当前进度条的宽度（从0到完整宽度）
			const currentProgressWidth = segmentsWidth * value;
			
			// 计算进度条位置
			// 进度条左边缘对齐到分段Layout的左边缘
			const leftEdge = segmentsX - segmentsWidth / 2;
			// 进度条中心位置 = 左边缘 + 当前宽度的一半
			const progressCenterX = leftEdge + currentProgressWidth / 2;
			
			// 更新进度条的宽度和位置
			progressRef().width(currentProgressWidth);
			progressRef().position([progressCenterX, segmentsY]);
			
			// 更新进度百分比
			progressPercent = value * 100;
		}, linear);
	};

	// 初始化进度条位置（进度为0）- 不带动画，直接设置
	const initProgressBar = () => {
		progressPercent = 0;
		const segmentsWidth = segmentsLayoutRef().width() || (containerRef().width() - padding * 2);
		const segmentsX = segmentsLayoutRef().position.x();
		const segmentsY = segmentsLayoutRef().position.y();
		const leftEdge = segmentsX - segmentsWidth / 2;
		progressRef().width(0);
		progressRef().position([leftEdge, segmentsY]);
	};
	
	// 初始化进度条
	initProgressBar();

	return {
		/**
		 * 让进度条在整个动画过程中持续平滑增长
		 * @param totalDuration 整个动画的总时长（秒）
		 * @returns ThreadGenerator 可以 yield* 来等待动画完成
		 */
		animateProgress: animateProgress,

		/**
		 * 更新某个分区的标题文本
		 */
		setSegmentTitle: (segIndex: number, newTitle: string) => {
			if (titleRefs[segIndex]) titleRefs[segIndex]().text(newTitle);
		},
	};
}
