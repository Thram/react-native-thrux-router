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
      if (route) {
        let stack = state && state.stack ? state.stack : [];
        route.reset ? stack = [route]
            : (route.replace ? stack[stack.length - 1] = route
                : stack.push(route));
        return {stack, current: route};
      }
    }),
    BACK       : createDict((payload, state) => {
      state.stack.length > 1 && state.stack.pop();
      return {stack: state.stack, current: last(state.stack)};
    }),
    OPEN_MODAL : createDict((modal, state) => assign({}, state, {modal})),
    CLOSE_MODAL: createDict((payload, state) => omit(state, 'modal'))
  }
});

export const goBack = () => dispatch('router:BACK');

export const goRoute = (routeId) => dispatch('router:GO_ROUTE', find(_routes, {id: routeId}));

export const goNextRoute = () => goRoute(state('router').current.next);

export const openModal = ({component, animation = "slide", style = {flex: 1}, visible = true, props}) =>
    dispatch('router:OPEN_MODAL', {component, animation, style, visible, props});

export const closeModal = () => dispatch('router:CLOSE_MODAL');


export default class Router extends Component {
  static propTypes = {
    routes: PropTypes.array.isRequired,
  };

  state = {};

  NavigationBarRouteMapper = {
    LeftButton: (route, navigator, index, navState) => this.props.leftButton ?
        this.props.leftButton(route, navigator, index, navState)
        : (index === 0 ? undefined
            : (<TouchableOpacity onPress={()=> dispatch('router:BACK')}>
              {this.props.backButton || <Text>Back</Text>}
            </TouchableOpacity>)),

    RightButton: (route, navigator, index, navState) => this.props.rightButton ? this.props.rightButton(route, navigator, index, navState) : (
            <TouchableOpacity onPress={()=> dispatch('router:BACK')}>
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
        case 'OPEN_MODAL':
          this.setState({modal});
          break;
        case 'CLOSE_MODAL':
          this.setState({modal: undefined});
          break;
        case 'BACK':
          this.refs.nav.pop();
          break;
        default:
          current.reset ? this.refs.nav.resetTo(current)
              : (current.replace ? this.refs.nav.replace(current)
                  : this.refs.nav.push(current));
      }
    });

    if (Platform.OS === 'android') {
      BackAndroid.addEventListener('hardwareBackPress', () => {
        if (this.refs.nav.getCurrentRoutes().length === 1)
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
      renderScene      : this.navigatorRenderScene

    }, !this.props.hideNav && {
          navigationBar: <Navigator.NavigationBar routeMapper={this.NavigationBarRouteMapper}/>,
          style        : {paddingTop: 40}
        });
    return (<Navigator ref="nav" {...props}/>);
  }

  renderModal = () => {
    const {animation, visible, props} = this.state.modal,
          ReactComponent              = this.state.modal.component,
          modalProps                  = assign({
            animationType: animation,
            visible
          }, Platform.OS === 'android' && {onRequestClose: closeModal});

    return (
        <Modal {...modalProps}>
          <ReactComponent {...props}/>
        </Modal>
    );
  };

  navigatorRenderScene = (route, navigator) => (
      <View style={{flex:1, backgroundColor:'#FFFFFF'}}>
        <StatusBar hidden={!!this.props.hideStatusBar}/>
        <Scene style={{flex:1}} {...route}/>
        {this.state.modal && this.renderModal()}
      </View>)
}