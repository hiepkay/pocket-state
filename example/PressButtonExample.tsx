import React from 'react';
import {Text, Button, View} from 'react-native';
import {createStore, createHook} from 'pocket-state';

interface Press {
  press: number;
}
const pressStore = createStore<Press>({ press: 0 });
const usePress = createHook(pressStore);

export function PressButtonExample() {
  const {value: press} = usePress(state => state.press);
  const {setValue} = usePress();

  return (
    <View style={{padding: 20}}>
      <Text>Press count: {press}</Text>
      <Button title="Press +" onPress={() => setValue(s => ({press: s.press + 1}))} />
    </View>
  );
}
