/**
 * Created by thram on 24/01/17.
 */
import { state } from 'thrux';
import React, { PropTypes } from 'react';

const Scene = () => {
  const { current, stack } = state('router');
  const RenderComponent = this.props.component;
  const toRender = stack.length > 1 ? [current.id, stack[stack.length - 2].id] : [current.id];
  return (toRender.includes(this.props.id) && <RenderComponent />);
};
Scene.propTypes = {
  id: PropTypes.string.isRequired,
  component: PropTypes.func.isRequired,
};

export default Scene;
