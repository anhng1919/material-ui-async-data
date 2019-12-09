import {database} from './database';

export const getChildrenApi = async nodeId =>
  new Promise(resolve =>
    setTimeout(() => {
      const result = database.filter(node => node.parentId === nodeId);
      resolve(result);
    }, 1000)
  );