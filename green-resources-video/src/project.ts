import {makeProject} from '@motion-canvas/core';

import main from './scenes/main?scene';
import logo from './scenes/logo?scene';

import arrowTest from './scenes/arrowTest?scene';
import treeTest from './scenes/treeTest?scene';

import bgm from '../public/sounds/正午12点.mp3';

export default makeProject({
  scenes: [arrowTest,treeTest,main ],
  audio: bgm,
});
