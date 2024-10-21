export async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** 异步防抖，会等待上一个调用完成才执行下一次调用。 */
export function async_debounce(
  this: any,
  func: (...args: any[]) => Promise<any>,
  delay: number
) {
  let timer: NodeJS.Timeout | null = null;
  let nextArgs: any[] | null = null;
  let isExecuting = false;

  return async function (this: any, ...args: any[]) {
    // 清除之前的计时器
    if (timer) {
      clearTimeout(timer);
    }

    // 如果当前正在执行，保存参数供下次执行
    if (isExecuting) {
      nextArgs = args;
      return;
    }

    // 设置新的计时器
    return new Promise((resolve) => {
      timer = setTimeout(async () => {
        isExecuting = true;
        try {
          const result = await func.apply(this, args);
          resolve(result);
        } finally {
          isExecuting = false;
          // 检查是否有下一个要执行的
          if (nextArgs) {
            const nextArgsToUse = nextArgs;
            nextArgs = null;
            async_debounce(func, delay).apply(this, nextArgsToUse);
          }
        }
      }, delay);
    });
  };
}
