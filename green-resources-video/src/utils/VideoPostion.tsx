import { Layout } from "@motion-canvas/2d";
/**
 * 视频位置工具类
 * 
 * Motion Canvas 坐标系统说明：
 * - 原点 [0, 0] 在屏幕中心
 * - X 轴：左为负，右为正（-width/2 到 +width/2）
 * - Y 轴：上为负，下为正（-height/2 到 +height/2）
 * 
 * 示例（假设屏幕 1920x1080）：
 *   左上角: [-960, -540]
 *   右上角: [960, -540]
 *   中心点: [0, 0]
 *   左下角: [-960, 540]
 *   右下角: [960, 540]
 */
export default class VideoPostion {


	/**
	 * 将视图的宽度评价分为n份，取得每一份的中间位置
	 * @param view 视图引用
	 * @param numerator 分子
	 * @param denominator 分母
	 * @returns 宽度
	 */
	static getWidthByPercent(view: Layout, numerator: number, denominator: number): number {


		if(numerator > denominator) {
			throw new Error('分子不能大于分母');
		}


		let singleWidth = view.width() / denominator;

		if (numerator == 1) {
			//第一个值是第一段的中间
			return singleWidth /2;
		}

		for (let i = 2; i <= denominator; i++) {
			if (numerator == i) {
				return singleWidth /2 + singleWidth * (i-1);
			}
		}

	}



	static center(view: Layout): [number, number] {
		return [0, 0];
	}



	static topRight(view: Layout,xoffset: number = 0,yoffset: number = 0): [number, number] {
		return [view.width() / 2 + xoffset, view.height() / 2 + yoffset];
	}

	static topLeft(view: Layout,xoffset: number = 0,yoffset: number = 0): [number, number] {
		return [-view.width() / 2 + xoffset, -view.height() / 2 + yoffset];
	}

	/**
	 * 右中侧位置（从右边缘向左偏移）
	 * @param view 视图引用
	 * @param offset 从右边缘向左的偏移量（像素），默认 100
	 * @returns [x, y] 坐标，y=0 表示垂直居中
	 */
	static rightCenter(view: Layout, offset: number = 100): [number, number] {
		// view.width() / 2 = 右边缘（正数）
		// - offset = 向左移动（X 值减小）
		return [view.width() / 2 - offset, 0];
	}
	
	/**
	 * 左中侧位置（从左边缘向右偏移）
	 * @param view 视图引用
	 * @param offset 从左边缘向右的偏移量（像素），默认 100
	 * @returns [x, y] 坐标，y=0 表示垂直居中
	 */
	static leftCenter(view: Layout, offset: number = 100): [number, number] {
		// -view.width() / 2 = 左边缘（负数）
		// + offset = 向右移动（X 值增大）
		return [-view.width() / 2 + offset, 0];
	}
	
	/**
	 * 顶部中心位置（从上边缘向下偏移）
	 * @param view 视图引用
	 * @param offset 从上边缘向下的偏移量（像素），默认 100
	 * @returns [x, y] 坐标，x=0 表示水平居中
	 */
	static topCenter(view: Layout, offset: number = 100): [number, number] {
		// -view.height() / 2 = 上边缘（负数，因为 Y 轴向上为负）
		// + offset = 向下移动（Y 值增大，从负数向 0 靠近）
		return [0, -view.height() / 2 + offset];
	}
	
	/**
	 * 底部中心位置（从下边缘向上偏移）
	 * @param view 视图引用
	 * @param offset 从下边缘向上的偏移量（像素），默认 100
	 * @returns [x, y] 坐标，x=0 表示水平居中
	 */
	static bottomCenter(view: Layout, offset: number = 100): [number, number] {
		// view.height() / 2 = 下边缘（正数，因为 Y 轴向下为正）
		// - offset = 向上移动（Y 值减小，从正数向 0 靠近）
		return [0, view.height() / 2 - offset];
	}


	
	/**
	 * 里面一圈的右中侧位置（从里面一圈的右边缘向左偏移）
	 * @param view 视图引用
	 * @returns [x, y] 坐标，y=0 表示垂直居中
	 */
	static innerRightCenter(view: Layout): [number, number] {
		let halfWidth = view.width() / 2;
		return [halfWidth- halfWidth/2, 0];
	}


	/**
	 * 里面一圈的左中侧位置（从里面一圈的左边缘向右偏移）
	 * @param view 视图引用
	 * @returns [x, y] 坐标，y=0 表示垂直居中
	 */
	static innerLeftCenter(view: Layout): [number, number] {
		let halfWidth = view.width() / 2;
		return [-halfWidth+ halfWidth/2, 0];
	}

	/**
	 * 里面一圈的顶部中心位置（从里面一圈的上边缘向下偏移）
	 * @param view 视图引用
	 * @returns [x, y] 坐标，x=0 表示水平居中
	 */
	static innerTopCenter(view: Layout): [number, number] {
		let halfHeight = view.height() / 2;
		return [0, -halfHeight+ halfHeight/2];
	}

	/**
	 * 里面一圈的底部中心位置（从里面一圈的下边缘向上偏移）
	 * @param view 视图引用
	 * @returns [x, y] 坐标，x=0 表示水平居中
	 */
	static innerBottomCenter(view: Layout): [number, number] {
		let halfHeight = view.height() / 2;
		return [0, halfHeight- halfHeight/2];
	}

}