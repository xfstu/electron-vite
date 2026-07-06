import { defineStore } from "pinia";
import { type RouteLocationNormalizedGeneric, type RouteLocationNormalizedLoadedGeneric, type Router } from "vue-router";

interface config {
  router: {
    to: RouteLocationNormalizedGeneric;
    form: RouteLocationNormalizedLoadedGeneric;
  }
}

type DeepPath<T> = T extends object
  ? {
    [K in keyof T]: K extends string
    ? T[K] extends object
    ? `${K}` | `${K}.${DeepPath<T[K]>}`
    : `${K}`
    : never
  }[keyof T]
  : never

type Path<T> = T extends object ? keyof T & string : never


type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
  ? PathValue<T[K], Rest>
  : never
  : P extends keyof T
  ? T[P]
  : never

type Join<K, P> = K extends string
  ? P extends string
  ? `${K}.${P}`
  : never
  : never

type setPath<T> = {
  [K in keyof T]: K extends string
  ? T[K] extends object
  ? `${K}` | `${K}.${setPath<T[K]>}`
  : `${K}`
  : never
}[keyof T]


type setPathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
  ? PathValue<T[K], Rest>
  : never
  : P extends keyof T
  ? T[P]
  : never

type history = {
  path: string,
  title: string,
  meta?: any
}
export const useRouterStore = defineStore("router-cache", {
  state: () => ({
    router: {
      to: null as unknown as RouteLocationNormalizedGeneric,
      from: null as unknown as RouteLocationNormalizedLoadedGeneric,
      router: null as unknown as Router
    }
  }),
  actions: {

  }
})