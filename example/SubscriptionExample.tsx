import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import {createStore, createHook} from 'pocket-state';

interface Log {
  count: number;
}
const logStore = createStore<Log>({ count: 0 });
const useLog = createHook(logStore);

export function SubscriptionExample() {
  const {setValue, subscribe} = useLog();
  const {value: count} = useLog(s => s.count);

  useEffect(() => {
    const unsub = subscribe(s => s.count, (c) => {
      console.log('Count changed:', c);
    });
    return unsub;
  }, [subscribe]);

  return (
    <View style={{padding: 20}}>
      <Text>Count: {count}</Text>
      <Text>(Open console to see subscription logs)</Text>
    </View>
  );
}
