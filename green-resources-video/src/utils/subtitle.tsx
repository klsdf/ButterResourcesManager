import { Txt, Layout, Rect } from '@motion-canvas/2d';
import { createRef, ThreadGenerator, all } from '@motion-canvas/core';
import { VideoScript } from '../data/VideoScript';

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
		subtitleElement = (
			<Layout layout={true} direction="column" width="100%" height="100%">
				<Layout grow={1} />
				{createSubtitleContainer()}
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

	// 逐句显示字幕
	for (const item of texts) {
		// 处理 VideoScript 或字符串
		const script: VideoScript = typeof item === 'string' 
			? { text: item } 
			: item;
		
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

