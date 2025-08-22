import React from 'react';
import {Text, View} from 'react-native';
import {createStore, createHook} from 'pocket-state';

interface User {
  name: string;
  age: number;
}
const userStore = createStore<User>({ name: 'Alice', age: 25 });
const useUser = createHook(userStore);

export function SelectorExample() {
  const {value: name} = useUser(s => s.name);
  const {value: age} = useUser(s => s.age);

  return (
    <View style={{padding: 20}}>
      <Text>User name: {name}</Text>
      <Text>User age: {age}</Text>
    </View>
  );
}
