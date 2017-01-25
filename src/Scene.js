/**
 * Created by thram on 24/01/17.
 */
import {state} from "thrux";
import React, {Component, PropTypes} from 'react';

class Scene extends Component {

  static propTypes = {
    component: PropTypes.func.isRequired,
  };

  render = () => {
    const {current, stack} = state('router'),
          RenderComponent  = this.props.component,
          toRender         = stack.length > 1 ? [current.id, stack[stack.length - 2].id] : [current.id];
    return (toRender.includes(this.props.id) && <RenderComponent />)
  }
}

export default Scene;