import compose from './compose';
import { Middleware, MiddlewareAPI } from './types/middleware';
import { AnyAction } from './types/actions';
import { StoreEnhancer, StoreCreator, Dispatch } from './types/store';
import { Reducer } from './types/reducers';

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param middlewares The middleware chain to be applied.
 * @returns A store enhancer applying the middleware.
 *
 * @template Ext Dispatch signature added by a middleware.
 * @template S The type of the state supported by a middleware.
 */
export default function applyMiddleware(): StoreEnhancer;
export default function applyMiddleware<Ext1, S>(
  middleware1: Middleware<Ext1, S, any>,
): StoreEnhancer<{ dispatch: Ext1 }>;
export default function applyMiddleware<Ext1, Ext2, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>,
): StoreEnhancer<{ dispatch: Ext1 & Ext2 }>;
export default function applyMiddleware<Ext1, Ext2, Ext3, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>,
  middleware3: Middleware<Ext3, S, any>,
): StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 }>;
export default function applyMiddleware<Ext1, Ext2, Ext3, Ext4, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>,
  middleware3: Middleware<Ext3, S, any>,
  middleware4: Middleware<Ext4, S, any>,
): StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 & Ext4 }>;
export default function applyMiddleware<Ext1, Ext2, Ext3, Ext4, Ext5, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>,
  middleware3: Middleware<Ext3, S, any>,
  middleware4: Middleware<Ext4, S, any>,
  middleware5: Middleware<Ext5, S, any>,
): StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 & Ext4 & Ext5 }>;
export default function applyMiddleware<Ext, S = any>(
  ...middlewares: Middleware<any, S, any>[]
): StoreEnhancer<{ dispatch: Ext }>;
export default function applyMiddleware(
  ...middlewares: Middleware[]
): StoreEnhancer<any> {
  return (createStore: StoreCreator) => <S, A extends AnyAction>(
    reducer: Reducer<S, A>,
    ...args: any[]
  ) => {
    const store = createStore(reducer, ...args);
    let dispatch: Dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
          'Other middleware would not be applied to this dispatch.',
      );
    };

    const middlewareAPI: MiddlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args),
    };
    // 首先一个最简单的中间件的格式: store => next => action => {}
    // 这一行代码就是传入了store, 获得了 next => action => {} 的函数
    const chain = middlewares.map((middleware) => middleware(middlewareAPI));

    // 这一行代码其实拆分成两行
    // const composeRes = compose(...chain);
    // dispatch = composeRes(store.dispatch);
    // 第一行是通过compose, 将一个 这样 next => action => {} 的数组组合成 (...args) => f(g(b(...args))) 这么一个函数
    // 第二行通过传入store.dispatch, 这个store.dispatch就是最后一个 next => action => {}的next参数
    // 传入后 (...args) => f(g(b(...args)) 就会执行, 执行时, store.dispacth作为b的next传入, b函数结果action => {}会作为
    // g的next传入, 以此类推. 所以最后dispatch作为有中间件的store的dispatch属性输出, 当用户调用dispatch时, 中间件就会一个一个
    // 执行完逻辑后, 将执行权给下一个, 直到原始的store.dispacth, 最后计算出新的state

    dispatch = compose<typeof dispatch>(...chain)(store.dispatch);

    return {
      ...store,
      dispatch,
    };
  };
}
