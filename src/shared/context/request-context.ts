import { AsyncLocalStorage } from "node:async_hooks";

type Store = {
  requestId: string;
};

const asyncLocalStorage = new AsyncLocalStorage<Store>();

export const requestContext = {
  run: (store: Store, callback: () => void) => {
    asyncLocalStorage.run(store, callback);
  },

  get: () => {
    return asyncLocalStorage.getStore();
  },

  getRequestId: () => {
    return asyncLocalStorage.getStore()?.requestId;
  },
};
