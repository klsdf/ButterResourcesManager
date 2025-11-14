/**
 * 进度条分段配置
 * @interface ProgressSegmentConfig
 */
 export default interface ProgressSegmentConfig {
	/** 分段标题 */
	title: string;
	/** 起始索引 */
	startIndex: number;
	/** 结束索引 */
	endIndex: number;
	/** 颜色值 */
	color: string;
}