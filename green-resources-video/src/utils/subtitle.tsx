import { Txt, Layout, Rect } from '@motion-canvas/2d';
import { createRef, ThreadGenerator, all } from '@motion-canvas/core';
import { VideoScript } from '../data/VideoScript';
import { createSegmentedProgressBar, ProgressSegment } from './progressBar';

export type SubtitleItem = string | VideoScript;

export interface SubtitleOptions {
	fontSize?: number;
	fill?: string;
	fontFamily?: string;
	fadeInDuration?: number;
	fadeOutDuration?: number;
	minDisplayDuration?: number;
	charsPerSecond?: number;
	padding?: number;
	position?: 'bottom' | 'center' | 'top';
	backgroundColor?: string;
	backgroundOpacity?: number;
	borderRadius?: number;
	showProgressBar?: boolean;
	progressSegments?: ProgressSegment[];
}

export function* showSubtitles(
	view: Layout,
	texts: SubtitleItem[],
	options: SubtitleOptions = {}
) {
	const {
		fontSize = 48,
		fill = '#ffffff',
		fontFamily = 'Microsoft YaHei, sans-serif',
		fadeInDuration = 0.5,
		fadeOutDuration = 0.5,
		minDisplayDuration = 2,
		charsPerSecond = 0.15,
		padding = 40,
		position = 'bottom',
		backgroundColor = '#000000',
		backgroundOpacity = 0.6,
		borderRadius = 8,
		showProgressBar = false,
		progressSegments = [],
	} = options;

	const subtitle = createRef<Txt>();
	const background = createRef<Rect>();
	const container = createRef<Layout>();

	const createSubtitleContainer = () => (
		<Layout
		ref={container}
		layout
		alignItems="center"
		justifyContent="center"
		opacity={0}
		padding={padding}
		zIndex={300}
	  >
		<Rect
		  ref={background}
		  fill={backgroundColor}
		  opacity={backgroundOpacity}
		  radius={borderRadius}
		  padding={padding}
		  layout
		>
		  <Txt
			ref={subtitle}
			text=""
			fontSize={fontSize}
			fill={fill}
			fontFamily={fontFamily}
			textAlign="center"
			layout
		  />
		</Rect>
	  </Layout>
	);

	let subtitleElement;

	if (position === 'bottom') {
		// 字幕在底部，但要在进度条上方，所以需要留出空间
		subtitleElement = (
			<Layout layout={true} direction="column" width="100%" height="100%">
				<Layout grow={1} />
				{createSubtitleContainer()}
				{/* 为进度条预留空间（大约 150px） */}
				<Layout height={150} />
			</Layout>
		);
	} else if (position === 'top') {
		subtitleElement = (
			<Layout layout={true} direction="column" width="100%" height="100%">
				{createSubtitleContainer()}
				<Layout grow={1} />
			</Layout>
		);
	} else {
		// center
		subtitleElement = (
			<Layout layout={true} direction="column" width="100%" height="100%" alignItems="center" justifyContent="center">
				{createSubtitleContainer()}
			</Layout>
		);
	}

	view.add(subtitleElement);

	// 创建进度条（如果需要）
	let progressBar: ReturnType<typeof createSegmentedProgressBar> | null = null;
	if (showProgressBar && progressSegments.length > 0) {
		progressBar = createSegmentedProgressBar(view, {
			segments: progressSegments,
			totalItems: texts.length,
		});
	}

	// 逐句显示字幕
	for (let index = 0; index < texts.length; index++) {
		const item = texts[index];
		// 处理 VideoScript 或字符串
		const script: VideoScript = typeof item === 'string' 
			? { text: item } 
			: item;
		
		// 更新进度条
		if (progressBar) {
			progressBar.updateProgress(index);
		}

		// 淡入
		subtitle().text(script.text);
		
		// 并行执行回调（如果有）和字幕淡入
		if (script.callback) {
			const result = script.callback();
			if (result && typeof result[Symbol.iterator] === 'function') {
				// 并行执行回调动画和字幕淡入
				yield* all(
					container().opacity(1, fadeInDuration),
					result as ThreadGenerator
				);
			} else {
				yield* container().opacity(1, fadeInDuration);
			}
		} else {
			yield* container().opacity(1, fadeInDuration);
		}

		// 显示持续时间（根据文本长度调整）
		const duration = Math.max(minDisplayDuration, script.text.length * charsPerSecond);
		yield* container().opacity(1, duration);

		// 淡出
		yield* container().opacity(0, fadeOutDuration);
	}
}

