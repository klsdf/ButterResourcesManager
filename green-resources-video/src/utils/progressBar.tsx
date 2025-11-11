import { Layout, Rect, Txt } from '@motion-canvas/2d';
import { createRef } from '@motion-canvas/core';


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

	const containerRef = createRef<Layout>();
	const progressRef = createRef<Rect>();
	const progressTrackRef = createRef<Rect>();
	const titleRefs = segments.map(() => createRef<Txt>());
	let progressWidthValue = 0; // 存储当前进度宽度，避免循环依赖

	// 外层容器：色块行，进度条浮在上方
	const component = (
		<Layout
			ref={containerRef}
			layout={false}
			width="100%"
			padding={padding}
			zIndex={200}
		>
			{/* 进度条背景轨道 */}
			<Rect
				ref={progressTrackRef}
				fill={trackColor}
				width={() => containerRef().width() - padding * 2}
				height={progressHeight}
				radius={progressHeight / 2}
				position={() => [
					0, // x位置在容器中心（容器有padding，所以轨道在padding内部）
					-height / 2 - progressHeight / 2 - 4
				]}
				zIndex={150}
			/>
			
			{/* 进度条前景 - 从左到右增长 */}
			<Rect
				ref={progressRef}
				fill={progressColor}
				width={0}
				height={progressHeight}
				radius={progressHeight / 2}
				position={() => {
					// 计算容器内部可用宽度
					const containerWidth = containerRef().width() - padding * 2;
					// 进度条左边缘对齐到轨道左边缘
					// 轨道中心在x=0，所以左边缘在 x = -containerWidth/2
					// 进度条中心应该在 x = -containerWidth/2 + progressWidthValue/2
					return [
						-(containerWidth / 2) + progressWidthValue / 2,
						-height / 2 - progressHeight / 2 - 4
					];
				}}
				zIndex={160}
			/>

			{/* 底部色块和文本 */}
			<Layout 
				layout 
				direction="row" 
				width="100%" 
				height={height}
				position={() => [0, progressHeight / 2 + 4]}
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
		</Layout>
	);

	view.add(component);

	// 设置位置
	// 容器中心点：考虑padding、进度条高度、色块高度和间距
	const totalHeight = progressHeight + 4 + height;
	if (position === 'top') {
		containerRef().position.y(() => -view.height() / 2 + padding + totalHeight / 2);
	} else {
		containerRef().position.y(() => view.height() / 2 - padding - totalHeight / 2);
	}


	return {
		/**
		 * 更新进度（index 从 0 开始）
		 */
		updateProgress: (currentIndex: number) => {
			const percent = Math.max(0, Math.min(100, ((currentIndex + 1) / totalItems) * 100));
			const containerWidth = containerRef().width() - padding * 2;
			progressWidthValue = (containerWidth * percent) / 100;
			progressRef().width(progressWidthValue);
		},

		/**
		 * 更新某个分区的标题文本
		 */
		setSegmentTitle: (segIndex: number, newTitle: string) => {
			if (titleRefs[segIndex]) titleRefs[segIndex]().text(newTitle);
		},
	};
}
