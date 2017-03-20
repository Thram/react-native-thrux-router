/**
 * Created by thram on 24/01/17.
 */
import _assign from 'lodash/assign';
import _omit from 'lodash/omit';
import _last from 'lodash/last';
import _find from 'lodash/find';
import React, { Component, PropTypes } from 'react';
import { View, Text, Navigator, TouchableOpacity, BackAndroid, Platform, StatusBar } from 'react-native';
import { register, clearObservers, state, createDict, observe, dispatch } from 'thrux';
import Scene from './Scene';
import ModalContainer from './ModalContainer';

let routes;
let onBeforeBackFunc;

register({
  router: {
    INIT: createDict(route => ({
      stack: [route],
      current: route,
    })),
    GO_ROUTE: createDict((route) => {
      if (route && route.id !== state.current.id) {
        let stack = state && state.stack ? state.stack : [];
        if (route.reset) {
          stack = [route];
        } else if (route.replace) {
          stack[stack.length - 1] = route;
        } else {
          stack.push(route);
        }
        return { stack, current: route, modal: undefined };
      }
      return state;
    }),
    BACK: createDict((payload, currentState) => {
      if (currentState.stack.length > 1) currentState.stack.pop();
      return { stack: currentState.stack, current: _last(currentState.stack) };
    }),
    SET_TAB: createDict((tab, currentState) => _assign({}, currentState, {
      current: _assign({}, currentState.current, { tab }),
    })),
    OPEN_MODAL: createDict((modal, currentState) => _assign({}, currentState, { modal })),
    CLOSE_MODAL: createDict((payload, currentState) => _omit(currentState, 'modal')),
  },
});

export const setTab = tab => dispatch('router:SET_TAB', tab);

export const onBeforeBack = (func) => {
  onBeforeBackFunc = func;
};


const shouldGoBack = (func) => {
  if (onBeforeBackFunc) {
    onBeforeBackFunc(result => (result === undefined || result) && func());
  } else {
    func();
  }
};

export const goBack = () => {
  if (state('router').modal) {
    dispatch('router:CLOSE_MODAL');
  } else {
    shouldGoBack(() => dispatch('router:BACK'));
  }
};

export const goRoute = (routeId, options) => dispatch('router:GO_ROUTE', _assign({}, _find(routes, { id: routeId }), options));

export const goNextRoute = options => goRoute(state('router').current.next, options);

export const openModal = ({ component, animation = 'slide', style = { flex: 1 }, visible = true, props }) =>
  dispatch('router:OPEN_MODAL', { component, animation, style, visible, props });

export const closeModal = () => dispatch('router:CLOSE_MODAL');

export const getCurrentProps = () => state('router').current.props || {};


export default class Router extends Component {
  static propTypes = {
    routes: PropTypes.arrayOf(React.PropTypes.shape({})).isRequired,
    leftButton: PropTypes.func,
    backButton: PropTypes.func,
    rightButton: PropTypes.func,
    hideNav: PropTypes.bool,
    hideStatusBar: PropTypes.bool,
    sceneConfig: React.PropTypes.shape({}),
    backgroundColor: PropTypes.string,
    statusBar: PropTypes.string,
  };
  static defaultProps = {
    routes: [],
    statusBar: undefined,
    backgroundColor: undefined,
    leftButton: undefined,
    backButton: undefined,
    rightButton: undefined,
    hideNav: false,
    hideStatusBar: false,
    sceneConfig: undefined,
  };

  constructor(props) {
    super(props);
    routes = this.props.routes;
    dispatch('router:INIT', routes[0]);
  }

  state = {};

  componentDidMount() {
    observe('router', ({ stack, current, modal }, action) => {
      switch (action) {
        case 'SET_TAB':
          break;
        case 'OPEN_MODAL':
          this.setState({ modal });
          break;
        case 'CLOSE_MODAL':
          this.nav.refs.modal.setModalVisible(false);
          this.setState({ modal: undefined, modal_closing: true });
          setTimeout(() => this.setState({ modal_closing: false }), 0);
          break;
        case 'BACK':
          if (onBeforeBackFunc) onBeforeBackFunc = undefined;
          this.nav.pop();
          break;
        default:
          if (onBeforeBackFunc) onBeforeBackFunc = undefined;
          this.setState({ modal: undefined });
          if (current.reset) {
            this.nav.resetTo(current);
          } else if (current.replace) {
            this.nav.replace(current);
          } else {
            this.nav.push(current);
          }
      }
    });

    if (Platform.OS === 'android') {
      BackAndroid.addEventListener('hardwareBackPress', () => {
        if (state('router').stack.length === 1) {
          return false;
        }
        goBack();
        return true;
      });
    }
  }

  componentWillUnmount = () => clearObservers('router');

  defaultRight = () => <TouchableOpacity onPress={goNextRoute}>
    {<Text>Next</Text>}
  </TouchableOpacity>;

  defaultLeft = index => (index === 0 ? undefined
    : (<TouchableOpacity onPress={goBack}>
      {this.props.backButton || <Text>Back</Text>}
    </TouchableOpacity>));

  NavigationBarRouteMapper = {
    LeftButton: (route, navigator, index, navState) => {
      const { leftButton } = this.props;
      return leftButton ?
        leftButton(route, navigator, index, navState)
        : this.defaultLeft(index);
    },

    RightButton: (route, navigator, index, navState) => (this.props.rightButton
      ? this.props.rightButton(route, navigator, index, navState)
      : this.defaultRight()),

    Title: route => (<Text>{route.title}</Text>),

  };

  navigatorRenderScene = route => (
    <View style={{ flex: 1, backgroundColor: (this.props.backgroundColor || '#FFFFFF') }}>
      <StatusBar hidden={this.props.hideStatusBar} {...(route.statusBar || this.props.statusBar)} />
      <Scene style={{ flex: 1 }} {...route} />
      {this.state.modal && !this.state.modal_closing && <ModalContainer
        ref={(modal) => {
          this.modal = modal;
        }} {...this.state.modal}
      />}
    </View>);

  render() {
    const props = _assign({
      initialRoute: routes[0],
      initialRouteStack: routes,
      renderScene: this.navigatorRenderScene,
      configureScene: () => {
        const { sceneConfig } = this.props;
        return _assign({}, sceneConfig || Navigator.SceneConfigs.PushFromRight, { gestures: {} });
      },
    }, !this.props.hideNav && {
      navigationBar: <Navigator.NavigationBar routeMapper={this.NavigationBarRouteMapper} />,
      style: { paddingTop: 40 },
    });
    return (<Navigator
      ref={(nav) => {
        this.nav = nav;
      }} {...props}
    />);
  }


}
