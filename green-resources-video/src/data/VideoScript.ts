import { ThreadGenerator } from '@motion-canvas/core';

/**
 * 视频脚本接口
 */
export interface VideoScript {
	text: string;
	callback?: () => void | ThreadGenerator;
}

