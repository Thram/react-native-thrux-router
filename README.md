# React Native - Thrux Router

[![Travis build](https://img.shields.io/travis/Thram/react-native-thrux-router.svg?style=flat-square)](https://travis-ci.org/Thram/react-native-thrux-router)
[![version](https://img.shields.io/npm/v/react-native-thrux-router.svg?style=flat-square)](https://www.npmjs.com/package/react-native-thrux-router)
[![downloads](https://img.shields.io/npm/dt/react-native-thrux-router.svg?style=flat-square)](https://www.npmjs.com/package/react-native-thrux-router)
[![MIT License](https://img.shields.io/npm/l/react-native-thrux-router.svg?style=flat-square)](https://opensource.org/licenses/MIT) [![Greenkeeper badge](https://badges.greenkeeper.io/Thram/react-native-thrux-router.svg)](https://greenkeeper.io/)

Router using [Thrux](https://github.com/Thram/thrux) state manager.

### TODO Docs, for now just an Example:

`index.js`

```javascript
import Router from "react-native-thrux-router";
import React, {Component} from 'react';
import First from "./First";
import Second from "./Second";

const styleBarWhite = Platform.OS === 'android' ? {barStyle: "light-content", backgroundColor: 'rgba(0,0,0,.3)'} : {barStyle: "dark-content"};
const styleBarDark  = assign({barStyle: "light-content"}, Platform.OS === 'android' ? {backgroundColor: '#414141'} : {});

const routes = [
  {id: 'first', title: 'First Scene', component: First, next: 'second'},
  {id: 'second', title: 'Second Scene', component: Second, replace: true, statusBar: styleBarDark},
  {id: 'third', title: 'Third Scene', component: Second, next: 'forth'},
  {id: 'forth', title: 'Forth Scene', component: First}
];

export default class NavigationExample extends Component {
  render = () => (<Router routes={routes} hideNav statusBar={styleBarWhite}/>)
}
```

`First.js`

```javascript
import React, {Component} from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import {goNextRoute, goBack} from "react-native-thrux-router";
export default class First extends Component {

  render() {
    return (
        <View style={{flex:1, backgroundColor:'#AAEE00', justifyContent:'center'}}>
          <TouchableOpacity onPress={goNextRoute}>
            <Text>Navigate to second screen</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goBack}>
            <Text>Back</Text>
          </TouchableOpacity>
        </View>
    );
  }
}
```

`Second.js`

```javascript
import React, {Component} from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import {goRoute, goBack, openModal} from "react-native-thrux-router";
import ThirdModal from './ThirdModal';

export default class Second extends Component {
  render() {
    return (
        <View style={{flex:1, backgroundColor:'#EEAA00', justifyContent:'center'}}>
          <TouchableOpacity onPress={()=> goRoute('third')}>
            <Text> Second screen </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=> openModal({component:ThirdModal})}>
            <Text> Open Modal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goBack}>
            <Text> Back</Text>
          </TouchableOpacity>
        </View>
    );
  }
}
```

`ThirdModal.js`

```javascript
import React, {Component} from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import {closeModal} from "react-native-thrux-router";

export default class ThirdModal extends Component {
  render() {
    return (
        <View style={{flex:1, backgroundColor:'#EEAA00', justifyContent:'center'}}>
          <Text> This is a Modal </Text>
          <TouchableOpacity onPress={closeModal}>
            <Text> Back</Text>
          </TouchableOpacity>
        </View>
    );
  }
}
```