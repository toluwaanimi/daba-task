type Resolver<T> = {
    [K in keyof T]: T[K] extends (...args: infer Args) => infer Ret
        ? (...args: Args) => Promise<Resolver<Ret>>
        : Resolver<T[K]>;
};
