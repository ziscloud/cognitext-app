// contexts/EventContext.tsx
import React, {createContext, useContext, useReducer, useCallback, useRef, useEffect} from 'react';
import {EventType, EventMap} from './event';

// 定义上下文类型
interface EventContextType {
    subscribe: <E extends EventType>(
        event: E,
        handler: (data: EventMap[E]) => void
    ) => () => void;
    publish: <E extends EventType>(
        event: E,
        data: EventMap[E]
    ) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

// 事件处理器类型
type EventHandlers = {
    [E in EventType]?: Array<(data: EventMap[E]) => void>
};

// 初始状态
const initialState: EventHandlers = {};

// Reducer 处理订阅/取消订阅
const eventReducer = (state: EventHandlers, action: {
    type: 'SUBSCRIBE' | 'UNSUBSCRIBE';
    event: EventType;
    handler: (data: any) => void
}) => {
    const {type, event, handler} = action;
    const handlers = [...(state[event] || [])];
    let newState ;
    switch (type) {
        case 'SUBSCRIBE':
            newState= {...state, [event]: [...handlers, handler]};
            break;
        case 'UNSUBSCRIBE':
            newState= {...state, [event]: handlers.filter(h => h !== handler)};
            break;
        default:
            newState = state;
    }
    return newState;
};

// 事件提供者组件
export const EventProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [handlers, dispatch] = useReducer(eventReducer, initialState);
     const handlersRef = useRef(handlers);
    // 订阅方法
    const subscribe = useCallback(<E extends EventType>(
        event: E,
        handler: (data: EventMap[E]) => void
    ) => {
        dispatch({type: 'SUBSCRIBE', event, handler});
        return () => dispatch({type: 'UNSUBSCRIBE', event, handler});
    }, [dispatch]);

    const publish = useCallback(<E extends EventType>(
        event: E,
        data: EventMap[E]
    ) => {
        handlersRef.current[event]?.forEach(handler => {
                // if (handler) {
                //
                // } else {
                handler(data);
                // }
            }
        );
    }, []);
    // 发布方法

    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    return (
        <EventContext.Provider value={{subscribe, publish}}>
            {children}
        </EventContext.Provider>
    );
};

// 自定义 Hook
export const useEvent = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error('useEvent must be used within an EventProvider');
    }
    return context;
};
