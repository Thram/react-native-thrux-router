/**
 * Created by Thram on 21/03/17.
 */
import _assign from 'lodash/assign';
import React, { Component, PropTypes } from 'react';
import { Platform, Modal } from 'react-native';
import { closeModal } from './index';


export default class ModalContainer extends Component {

  propTypes = {
    animation: PropTypes.string,
    visible: PropTypes.bool,
    component: PropTypes.func,
    props: PropTypes.shape({}),
  };

  constructor(props) {
    super(props);
    this.defaultProps = _assign({ transparent: true }, Platform.OS === 'android' && { onRequestClose: closeModal });
    const { animation, visible, props: componentProps } = props;
    const modalProps = { animationType: animation };
    this.state = { visible, modalProps, componentProps };
  }

  setModalVisible = visible => this.setState({ visible });


  render = () => {
    const ReactComponent = this.props.component;
    return (
      <Modal visible={this.state.visible} {...this.state.modalProps} {...this.defaultProps}>
        <ReactComponent {...this.state.componentProps} />
      </Modal>
    );
  };
}
