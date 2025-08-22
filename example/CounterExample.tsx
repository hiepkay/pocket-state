import React from 'react';
import {Text, Button, View} from 'react-native';
import {createStore, createHook} from 'pocket-state';

interface Counter {
  count: number;
}
const counterStore = createStore<Counter>({ count: 0 });
const useCounter = createHook(counterStore);

export function CounterExample() {
  const {reset} = useCounter();
  const {value: count} = useCounter(state => state.count);

  return (
    <View style={{padding: 20}}>
      <Text>Count: {count}</Text>
      <Button title="Inc" onPress={() => counterStore.setValue(s => ({count: s.count + 1}))} />
      <Button title="Reset" onPress={reset} />
    </View>
  );
}
