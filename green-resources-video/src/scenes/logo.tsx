import { Circle, Img, Rect, Txt, makeScene2D } from '@motion-canvas/2d';
import { createRef, all, map, slideTransition, Direction, waitFor } from '@motion-canvas/core';

export default makeScene2D(function* (view) {

    const rectRef = createRef<Rect>();
    const imgRef = createRef<Img>();

    view.add(<Img ref={imgRef} src={'/imgs/logo.png'} scale={1.5} position={[0, 0]} />)
    view.add(<Rect ref={rectRef} size={view.size()} fill={'black'} position={[0, 0]} />)
    // view.add(<Rect ref={rectRef} size={[view.width(), view.height()]} fill={'black'} />)
    // yield* slideTransition(Direction.Right,3)
 
    // 从完全不透明到完全透明，等待2秒后,再到不透明
    yield* rectRef().opacity(1, 0).to(0, 2)
    yield* waitFor(2)
    yield* rectRef().opacity(1, 2)
});
