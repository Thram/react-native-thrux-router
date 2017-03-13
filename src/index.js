/**
 * Created by thram on 24/01/17.
 */
import assign from 'lodash/assign';
import omit from 'lodash/omit';
import last from 'lodash/last';
import find from 'lodash/find';
import React, {Component, PropTypes} from 'react';
import {View, Text, Navigator, TouchableOpacity, BackAndroid, Platform, Modal, StatusBar} from 'react-native';
import {register, clearObservers, state, createDict, observe, dispatch} from "thrux";
import Scene from "./Scene";

let _routes;

register({
  router: {
    INIT       : createDict((route, state) => ({
      stack  : [route],
      current: route
    })),
    GO_ROUTE   : createDict((route, state) => {
      if (route && route.id != state.current.id) {
        let stack = state && state.stack ? state.stack : [];
        route.reset ? stack = [route]
            : (route.replace ? stack[stack.length - 1] = route
                : stack.push(route));
        return {stack, current: route, modal: undefined};
      } else {
        return state;
      }
    }),
    BACK       : createDict((payload, state) => {
      state.stack.length > 1 && state.stack.pop();
      return {stack: state.stack, current: last(state.stack)};
    }),
    SET_TAB    : createDict((tab, state) => {
      state.current.tab = tab;
      return assign({}, state)
    }),
    OPEN_MODAL : createDict((modal, state) => assign({}, state, {modal})),
    CLOSE_MODAL: createDict((payload, state) => omit(state, 'modal'))
  }
});

export const setTab = (tab) => dispatch('router:SET_TAB', tab);

export const goBack = () => state('router').modal ? dispatch('router:CLOSE_MODAL') : dispatch('router:BACK');

export const goRoute = (routeId, options) => dispatch('router:GO_ROUTE', assign({}, find(_routes, {id: routeId}), options));

export const goNextRoute = (options) => goRoute(state('router').current.next, options);

export const openModal = ({component, animation = "slide", style = {flex: 1}, visible = true, props}) =>
    dispatch('router:OPEN_MODAL', {component, animation, style, visible, props});

export const closeModal = () => dispatch('router:CLOSE_MODAL');

export const getCurrentProps = () => state('router').current.props || {};

class ModalContainer extends Component {

  state = {visible: false};

  defaultProps = assign({transparent: true}, Platform.OS === 'android' && {onRequestClose: closeModal});

  setModalVisible = (visible) => this.setState({visible});

  componentDidMount() {
    const {animation, visible, props:componentProps} = this.props,
          modalProps                                 = {animationType: animation};
    this.setState({visible, modalProps, componentProps})
  }

  render = () => {
    const ReactComponent = this.props.component;
    return (
        <Modal visible={this.state.visible} {...this.state.modalProps} {...this.defaultProps}>
          <ReactComponent {...this.state.componentProps}/>
        </Modal>
    );
  };
}


export default class Router extends Component {
  static propTypes = {
    routes: PropTypes.array.isRequired,
  };

  state = {};

  NavigationBarRouteMapper = {
    LeftButton: (route, navigator, index, navState) => this.props.leftButton ?
        this.props.leftButton(route, navigator, index, navState)
        : (index === 0 ? undefined
            : (<TouchableOpacity onPress={() => dispatch('router:BACK')}>
              {this.props.backButton || <Text>Back</Text>}
            </TouchableOpacity>)),

    RightButton: (route, navigator, index, navState) => this.props.rightButton ? this.props.rightButton(route, navigator, index, navState) : (
            <TouchableOpacity onPress={() => dispatch('router:BACK')}>
              {this.props.backButton || <Text>Back</Text>}
            </TouchableOpacity>),

    Title: (route, navigator, index, navState) => (<Text>{route.title}</Text>)

  };

  constructor(props) {
    super(props);
    _routes = this.props.routes;
    dispatch('router:INIT', _routes[0]);
  }

  componentDidMount() {
    observe('router', ({stack, current, modal}, action) => {
      switch (action) {
        case 'SET_TAB':
          break;
        case 'OPEN_MODAL':
          this.setState({modal});
          break;
        case 'CLOSE_MODAL':
          this.refs.nav.refs.modal.setModalVisible(false);
          this.setState({modal: undefined, modal_closing: true});
          setTimeout(() => this.setState({modal_closing: false}), 0);
          break;
        case 'BACK':
          this.refs.nav.pop();
          break;
        default:
          this.setState({modal: undefined});
          current.reset ? this.refs.nav.resetTo(current)
              : (current.replace ? this.refs.nav.replace(current)
                  : this.refs.nav.push(current));
      }
    });

    if (Platform.OS === 'android') {
      BackAndroid.addEventListener('hardwareBackPress', () => {
        if (state('router').stack.length === 1)
          return false;
        goBack();
        return true;
      });
    }
  }

  componentWillUnmount = () => clearObservers('router');

  render() {
    const props = assign({
      initialRoute     : _routes[0],
      initialRouteStack: _routes,
      renderScene      : this.navigatorRenderScene,
      configureScene   : assign({}, this.props.sceneConfig || Navigator.SceneConfigs.PushFromRight, {gestures: {}})
    }, !this.props.hideNav && {
          navigationBar: <Navigator.NavigationBar routeMapper={this.NavigationBarRouteMapper}/>,
          style        : {paddingTop: 40}
        });
    return (<Navigator ref="nav" {...props}/>);
  }

  navigatorRenderScene = (route, navigator) => (
      <View style={{flex: 1, backgroundColor: (this.props.backgroundColor || '#FFFFFF')}}>
        <StatusBar hidden={!!this.props.hideStatusBar} {...(route.statusBar || this.props.statusBar)}/>
        <Scene style={{flex: 1}} {...route}/>
        {this.state.modal && !this.state.modal_closing && <ModalContainer ref="modal" {...this.state.modal}/>}
      </View>)
}