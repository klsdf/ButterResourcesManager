import {makeProject} from '@motion-canvas/core';

import main from './scenes/main?scene';
import logo from './scenes/logo?scene';

export default makeProject({
  scenes: [logo,main],
});
